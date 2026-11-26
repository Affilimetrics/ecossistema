from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator
from django.utils import timezone

class Marketplace(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=80)
    class Meta:
        unique_together = ("user", "name")
        ordering = ["name"]
    def __str__(self): return self.name

class Channel(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=80)
    class Meta:
        unique_together = ("user", "name")
        ordering = ["name"]
    def __str__(self): return self.name

class Product(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    marketplace = models.ForeignKey(Marketplace, on_delete=models.PROTECT, related_name="products")
    name = models.CharField(max_length=180)
    external_id = models.CharField(max_length=120, blank=True)
    url = models.URLField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ["name"]
    def __str__(self): return self.name

class Campaign(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    name = models.CharField(max_length=160)
    description = models.TextField(blank=True)
    marketplace = models.ForeignKey(Marketplace, null=True, blank=True, on_delete=models.SET_NULL)
    channel = models.ForeignKey(Channel, null=True, blank=True, on_delete=models.SET_NULL)
    products = models.ManyToManyField(Product, blank=True, related_name="campaigns")
    starts_on = models.DateField(null=True, blank=True)
    ends_on = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ["-created_at"]
    def __str__(self): return self.name

class Expense(models.Model):
    CATEGORIES = [
        ("trafego", "Tráfego pago"), ("anuncios", "Anúncios"),
        ("ferramentas", "Ferramentas e softwares"), ("assinaturas", "Assinaturas"),
        ("conteudo", "Produção de conteúdo"), ("terceiros", "Serviços terceirizados"),
        ("operacao", "Operação"), ("outros", "Outros"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    description = models.CharField(max_length=180)
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(0.01)])
    date = models.DateField(default=timezone.localdate)
    category = models.CharField(max_length=20, choices=CATEGORIES, default="outros")
    marketplace = models.ForeignKey(Marketplace, null=True, blank=True, on_delete=models.PROTECT)
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.PROTECT)
    campaign = models.ForeignKey(Campaign, null=True, blank=True, on_delete=models.PROTECT)
    channel = models.ForeignKey(Channel, null=True, blank=True, on_delete=models.PROTECT)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta: ordering = ["-date", "-id"]

class Commission(models.Model):
    STATUS = [
        ("pending", "Pendente"), ("approved", "Aprovada"),
        ("cancelled", "Cancelada"), ("refunded", "Reembolsada"),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    order_id = models.CharField(max_length=140, blank=True)
    transaction_id = models.CharField(max_length=140, blank=True)
    external_id = models.CharField(max_length=140, blank=True)
    marketplace = models.ForeignKey(Marketplace, on_delete=models.PROTECT)
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.PROTECT)
    campaign = models.ForeignKey(Campaign, null=True, blank=True, on_delete=models.PROTECT)
    channel = models.ForeignKey(Channel, null=True, blank=True, on_delete=models.PROTECT)
    order_date = models.DateField(null=True, blank=True)
    commission_date = models.DateField(default=timezone.localdate)
    approved_at = models.DateTimeField(null=True, blank=True)
    sale_value = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(0)])
    status = models.CharField(max_length=12, choices=STATUS, default="pending")
    source = models.CharField(max_length=100, default="manual")
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    class Meta:
        ordering = ["-commission_date", "-id"]
        constraints = [
            models.UniqueConstraint(fields=["user", "marketplace", "order_id"], condition=~models.Q(order_id=""), name="uniq_user_market_order"),
            models.UniqueConstraint(fields=["user", "marketplace", "transaction_id"], condition=~models.Q(transaction_id=""), name="uniq_user_market_transaction"),
        ]

class FinancialAudit(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    entity = models.CharField(max_length=30)
    object_id = models.PositiveBigIntegerField()
    action = models.CharField(max_length=30)
    before = models.JSONField(default=dict, blank=True)
    after = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta: ordering = ["-created_at"]


class AutomationSettings(models.Model):
    """Preferências por usuário para automações locais e seguras."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="automation_settings")
    enabled = models.BooleanField(default=True)
    auto_import = models.BooleanField(default=True)
    auto_recurring_expenses = models.BooleanField(default=True)
    interval_minutes = models.PositiveSmallIntegerField(default=15)
    inbox_path = models.CharField(max_length=500, blank=True, help_text="Pasta local monitorada pelo comando de automação")
    notify_roi_negative = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self): return f"Automação de {self.user}"

class RecurringExpense(models.Model):
    FREQUENCIES = [("monthly", "Mensal"), ("weekly", "Semanal"), ("yearly", "Anual")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    description = models.CharField(max_length=180)
    amount = models.DecimalField(max_digits=14, decimal_places=2, validators=[MinValueValidator(0.01)])
    category = models.CharField(max_length=20, choices=Expense.CATEGORIES, default="assinaturas")
    frequency = models.CharField(max_length=10, choices=FREQUENCIES, default="monthly")
    next_date = models.DateField()
    active = models.BooleanField(default=True)
    marketplace = models.ForeignKey(Marketplace, null=True, blank=True, on_delete=models.PROTECT)
    channel = models.ForeignKey(Channel, null=True, blank=True, on_delete=models.PROTECT)
    last_generated = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta: ordering = ["next_date", "description"]
    def __str__(self): return self.description

class AutomationEvent(models.Model):
    LEVELS = [("info", "Informação"), ("success", "Sucesso"), ("warning", "Atenção"), ("error", "Erro")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    level = models.CharField(max_length=10, choices=LEVELS, default="info")
    title = models.CharField(max_length=160)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)
    class Meta: ordering = ["-created_at"]

class ImportedFile(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    sha256 = models.CharField(max_length=64)
    filename = models.CharField(max_length=255)
    kind = models.CharField(max_length=20)
    imported_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "sha256"], name="uniq_imported_file_user_hash")]
        ordering = ["-created_at"]
