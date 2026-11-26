from django.conf import settings
from django.db import models
from django.db.models import Q
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.utils import timezone

class OwnedDimension(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    code = models.SlugField(max_length=40)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        abstract = True
        ordering = ["name"]
    def __str__(self):
        return self.name

class Platform(OwnedDimension):
    class Meta:
        ordering = ["name"]
        constraints = [models.UniqueConstraint(fields=["user", "code"], name="cpa_platform_code_uniq")]
        verbose_name = "plataforma de anúncios"
        verbose_name_plural = "plataformas de anúncios"

class Channel(OwnedDimension):
    # Evita colisão com financeiro.Channel no reverse accessor do usuário.
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cpa_channels")
    class Meta:
        ordering = ["name"]
        constraints = [models.UniqueConstraint(fields=["user", "code"], name="cpa_channel_code_uniq")]
        verbose_name = "canal"
        verbose_name_plural = "canais"

class Campaign(models.Model):
    OBJECTIVE_CHOICES = [("purchase", "Compra"), ("lead", "Lead"), ("signup", "Cadastro"), ("click", "Clique qualificado"), ("other", "Outra conversão")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cpa_campaigns")
    name = models.CharField(max_length=160)
    external_id = models.CharField(max_length=120, blank=True, help_text="ID da campanha na plataforma de anúncios.")
    integration_key = models.SlugField(max_length=100, blank=True, help_text="Chave estável para integração com o projeto principal/LTV.")
    platform = models.ForeignKey(Platform, on_delete=models.SET_NULL, null=True, blank=True, related_name="campaigns")
    channel = models.ForeignKey(Channel, on_delete=models.SET_NULL, null=True, blank=True, related_name="campaigns")
    objective = models.CharField(max_length=20, choices=OBJECTIVE_CHOICES, default="purchase")
    conversion_label = models.CharField(max_length=60, default="Conversões")
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "integration_key"], condition=~Q(integration_key=""), name="cpa_cmp_user_ikey_uniq"),
        ]
        indexes = [models.Index(fields=["user", "name"], name="cpa_cmp_user_name_idx"), models.Index(fields=["user", "external_id"], name="cpa_cmp_user_ext_idx")]
    def clean(self):
        if self.platform_id and not Platform.objects.filter(pk=self.platform_id, user_id=self.user_id).exists():
            raise ValidationError({"platform": "A plataforma deve pertencer à mesma conta da campanha."})
        if self.channel_id and not Channel.objects.filter(pk=self.channel_id, user_id=self.user_id).exists():
            raise ValidationError({"channel": "O canal deve pertencer à mesma conta da campanha."})
    def save(self, *args, **kwargs):
        if self.platform_id and not Platform.objects.filter(pk=self.platform_id, user_id=self.user_id).exists():
            raise ValidationError("A plataforma selecionada pertence a outra conta.")
        if self.channel_id and not Channel.objects.filter(pk=self.channel_id, user_id=self.user_id).exists():
            raise ValidationError("O canal selecionado pertence a outra conta.")
        super().save(*args, **kwargs)
    def __str__(self):
        return self.name

class PerformanceRecord(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cpa_performance_records")
    campaign = models.ForeignKey(Campaign, on_delete=models.PROTECT, related_name="performance_records")
    date = models.DateField(default=timezone.localdate, db_index=True)
    spend = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(0)])
    clicks = models.PositiveIntegerField(default=0)
    conversions = models.PositiveIntegerField(default=0)
    impressions = models.PositiveIntegerField(null=True, blank=True)
    source = models.CharField(max_length=80, default="manual", help_text="Origem do registro; ex.: manual ou import:meta-ads.")
    external_id = models.CharField(max_length=140, blank=True, help_text="ID estável da linha/origem para reimportação idempotente.")
    notes = models.CharField(max_length=240, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["-date", "-id"]
        constraints = [
            models.CheckConstraint(condition=Q(spend__gte=0), name="cpa_spend_nonneg"),
            models.CheckConstraint(condition=Q(clicks__gte=0), name="cpa_clicks_nonneg"),
            models.CheckConstraint(condition=Q(conversions__gte=0), name="cpa_conv_nonneg"),
            models.UniqueConstraint(fields=["user", "source", "external_id"], condition=~Q(external_id=""), name="cpa_record_ext_src_uniq"),
        ]
        indexes = [models.Index(fields=["user", "date"], name="cpa_rec_user_date_idx"), models.Index(fields=["user", "campaign", "date"], name="cpa_rec_user_cmp_dt_idx")]
    def clean(self):
        if self.campaign_id and not Campaign.objects.filter(pk=self.campaign_id, user_id=self.user_id).exists():
            raise ValidationError({"campaign": "A campanha deve pertencer à mesma conta do registro."})
    def save(self, *args, **kwargs):
        if self.campaign_id and not Campaign.objects.filter(pk=self.campaign_id, user_id=self.user_id).exists():
            raise ValidationError("A campanha selecionada pertence a outra conta.")
        super().save(*args, **kwargs)
    def __str__(self):
        return f"{self.campaign} — {self.date}"

class ImportBatch(models.Model):
    STATUS_CHOICES = [("preview", "Prévia"), ("confirmed", "Confirmada"), ("failed", "Falhou")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    filename = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="preview")
    rows_total = models.PositiveIntegerField(default=0)
    rows_imported = models.PositiveIntegerField(default=0)
    rows_updated = models.PositiveIntegerField(default=0)
    rows_ignored = models.PositiveIntegerField(default=0)
    rows_error = models.PositiveIntegerField(default=0)
    preview = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        ordering = ["-created_at"]
    def __str__(self):
        return f"{self.filename} ({self.get_status_display()})"


class IntegrationToken(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="cpa_integration_tokens")
    name = models.CharField(max_length=100)
    prefix = models.CharField(max_length=12, unique=True)
    token_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    class Meta:
        ordering = ["-created_at"]
    def __str__(self):
        return f"{self.name} ({self.prefix}...)"
    @property
    def is_active(self):
        return self.revoked_at is None
