from decimal import Decimal
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from django.db.models import Q
from django.utils import timezone


class OwnedModel(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="%(class)s_records")
    created_at = models.DateTimeField(default=timezone.now, editable=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class Marketplace(OwnedModel):
    name = models.CharField(max_length=100)
    code = models.SlugField(max_length=80)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [models.UniqueConstraint(fields=["user", "code"], name="uniq_marketplace_user_code")]

    def __str__(self):
        return self.name


class Channel(OwnedModel):
    name = models.CharField(max_length=100)
    code = models.SlugField(max_length=80)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [models.UniqueConstraint(fields=["user", "code"], name="uniq_channel_user_code")]

    def __str__(self):
        return self.name


class Product(OwnedModel):
    name = models.CharField(max_length=180)
    marketplace = models.ForeignKey(Marketplace, null=True, blank=True, on_delete=models.SET_NULL, related_name="products")
    external_id = models.CharField(max_length=160, blank=True)
    category = models.CharField(max_length=120, blank=True)
    active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["user", "name"], name="ltv_product_user_name_idx")]

    def __str__(self):
        return self.name


class Campaign(OwnedModel):
    STATUS_CHOICES = [("active", "Ativa"), ("paused", "Pausada"), ("finished", "Finalizada")]
    name = models.CharField(max_length=180)
    marketplace = models.ForeignKey(Marketplace, null=True, blank=True, on_delete=models.SET_NULL, related_name="campaigns")
    channel = models.ForeignKey(Channel, null=True, blank=True, on_delete=models.SET_NULL, related_name="campaigns")
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="active")

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["user", "status"], name="ltv_campaign_user_status_idx")]

    def __str__(self):
        return self.name


class Acquisition(OwnedModel):
    ATTRIBUTION_CHOICES = [
        ("external_id", "Identificador externo comprovado"),
        ("tracking", "Código de rastreamento"),
        ("campaign", "Evidência de campanha"),
        ("manual", "Atribuição manual documentada"),
        ("unattributed", "Não atribuída"),
    ]
    external_reference = models.CharField(max_length=180, blank=True, help_text="Identificador pseudonimizado ou externo; não informe dados pessoais.")
    acquired_at = models.DateTimeField(default=timezone.now, db_index=True)
    marketplace = models.ForeignKey(Marketplace, null=True, blank=True, on_delete=models.SET_NULL, related_name="acquisitions")
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.SET_NULL, related_name="acquisitions")
    campaign = models.ForeignKey(Campaign, null=True, blank=True, on_delete=models.SET_NULL, related_name="acquisitions")
    channel = models.ForeignKey(Channel, null=True, blank=True, on_delete=models.SET_NULL, related_name="acquisitions")
    source = models.CharField(max_length=120, blank=True)
    attribution_method = models.CharField(max_length=20, choices=ATTRIBUTION_CHOICES, default="unattributed")
    confidence = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"), validators=[MinValueValidator(0), MaxValueValidator(100)])
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-acquired_at"]
        constraints = [models.UniqueConstraint(fields=["user", "external_reference"], condition=~Q(external_reference=""), name="uniq_acquisition_user_external_ref")]
        indexes = [models.Index(fields=["user", "acquired_at"], name="ltv_acq_user_date_idx"), models.Index(fields=["user", "campaign"], name="ltv_acq_user_camp_idx")]

    def __str__(self):
        return self.external_reference or f"Aquisição #{self.pk}"


class Commission(OwnedModel):
    STATUS_CHOICES = [
        ("pending", "Pendente"),
        ("approved", "Aprovada"),
        ("cancelled", "Cancelada"),
        ("refunded", "Reembolsada"),
        ("reversed", "Revertida"),
    ]
    external_id = models.CharField(max_length=180, blank=True)
    source = models.CharField(max_length=100, default="manual")
    acquisition = models.ForeignKey(Acquisition, null=True, blank=True, on_delete=models.SET_NULL, related_name="commissions")
    marketplace = models.ForeignKey(Marketplace, null=True, blank=True, on_delete=models.SET_NULL, related_name="commissions")
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.SET_NULL, related_name="commissions")
    campaign = models.ForeignKey(Campaign, null=True, blank=True, on_delete=models.SET_NULL, related_name="commissions")
    channel = models.ForeignKey(Channel, null=True, blank=True, on_delete=models.SET_NULL, related_name="commissions")
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(Decimal("0.00"))])
    sale_date = models.DateTimeField(default=timezone.now, db_index=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="pending", db_index=True)
    attribution_evidence = models.CharField(max_length=240, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["-sale_date"]
        constraints = [models.UniqueConstraint(fields=["user", "source", "external_id"], condition=~Q(external_id=""), name="uniq_commission_source_external_id")]
        indexes = [models.Index(fields=["user", "status", "sale_date"], name="ltv_comm_user_stat_date_idx"), models.Index(fields=["user", "acquisition"], name="ltv_comm_user_acq_idx")]

    def __str__(self):
        return f"{self.get_status_display()} — R$ {self.amount}"

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.acquisition_id and self.user_id and self.acquisition.user_id != self.user_id:
            raise ValidationError({"acquisition": "A aquisição pertence a outro usuário."})


class AttributionHistory(models.Model):
    commission = models.ForeignKey(Commission, on_delete=models.CASCADE, related_name="attribution_history")
    previous_acquisition = models.ForeignKey(Acquisition, null=True, blank=True, on_delete=models.SET_NULL, related_name="previous_attributions")
    new_acquisition = models.ForeignKey(Acquisition, null=True, blank=True, on_delete=models.SET_NULL, related_name="new_attributions")
    reason = models.TextField()
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]


class ImportBatch(OwnedModel):
    STATUS_CHOICES = [("preview", "Prévia"), ("completed", "Concluída"), ("failed", "Falhou")]
    filename = models.CharField(max_length=255)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="preview")
    total_rows = models.PositiveIntegerField(default=0)
    imported_rows = models.PositiveIntegerField(default=0)
    updated_rows = models.PositiveIntegerField(default=0)
    skipped_rows = models.PositiveIntegerField(default=0)
    error_rows = models.PositiveIntegerField(default=0)
    preview_json = models.JSONField(default=list, blank=True)
    summary = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]


class AutomationSettings(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ltv_automation_settings")
    enabled = models.BooleanField(default=False)
    interval_seconds = models.PositiveIntegerField(default=900, validators=[MinValueValidator(60), MaxValueValidator(86400)])
    pending_alert_days = models.PositiveIntegerField(default=14)
    last_run_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)


class AutomationRun(OwnedModel):
    TYPE_CHOICES = [("maintenance", "Manutenção analítica"), ("snapshot", "Snapshot diário"), ("alerts", "Verificação de alertas"), ("sync", "Sincronização externa")]
    STATUS_CHOICES = [("running", "Executando"), ("success", "Concluída"), ("warning", "Concluída com alertas"), ("failed", "Falhou")]
    run_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default="maintenance")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="running")
    started_at = models.DateTimeField(default=timezone.now)
    finished_at = models.DateTimeField(null=True, blank=True)
    processed = models.PositiveIntegerField(default=0)
    details = models.TextField(blank=True)

    class Meta:
        ordering = ["-started_at"]


class LTVSnapshot(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ltv_snapshots")
    snapshot_date = models.DateField(default=timezone.localdate)
    approved_total = models.DecimalField(max_digits=16, decimal_places=2, default=Decimal("0.00"))
    pending_total = models.DecimalField(max_digits=16, decimal_places=2, default=Decimal("0.00"))
    acquisition_count = models.PositiveIntegerField(default=0)
    average_ltv = models.DecimalField(max_digits=16, decimal_places=2, default=Decimal("0.00"))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["snapshot_date"]
        constraints = [models.UniqueConstraint(fields=["user", "snapshot_date"], name="uniq_ltv_snapshot_user_date")]
