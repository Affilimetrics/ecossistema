# Initial schema for the standalone ROI Manager.
from decimal import Decimal

from django.conf import settings
from django.db import migrations, models
import django.core.validators
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    initial = True

    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="Marketplace",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=80)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["name"], "unique_together": {("user", "name")}},
        ),
        migrations.CreateModel(
            name="Channel",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=80)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["name"], "unique_together": {("user", "name")}},
        ),
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=180)),
                ("external_id", models.CharField(blank=True, max_length=120)),
                ("url", models.URLField(blank=True)),
                ("category", models.CharField(blank=True, max_length=100)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("marketplace", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="products", to="financeiro.marketplace")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Campaign",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("description", models.TextField(blank=True)),
                ("starts_on", models.DateField(blank=True, null=True)),
                ("ends_on", models.DateField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("channel", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="financeiro.channel")),
                ("marketplace", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="financeiro.marketplace")),
                ("products", models.ManyToManyField(blank=True, related_name="campaigns", to="financeiro.product")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="Expense",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("description", models.CharField(max_length=180)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=14, validators=[django.core.validators.MinValueValidator(Decimal("0.01"))])),
                ("date", models.DateField(default=django.utils.timezone.localdate)),
                ("category", models.CharField(choices=[("trafego", "Tráfego pago"), ("anuncios", "Anúncios"), ("ferramentas", "Ferramentas e softwares"), ("assinaturas", "Assinaturas"), ("conteudo", "Produção de conteúdo"), ("terceiros", "Serviços terceirizados"), ("operacao", "Operação"), ("outros", "Outros")], default="outros", max_length=20)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("campaign", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="financeiro.campaign")),
                ("channel", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="financeiro.channel")),
                ("marketplace", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="financeiro.marketplace")),
                ("product", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="financeiro.product")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-date", "-id"]},
        ),
        migrations.CreateModel(
            name="Commission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("order_id", models.CharField(blank=True, max_length=140)),
                ("transaction_id", models.CharField(blank=True, max_length=140)),
                ("external_id", models.CharField(blank=True, max_length=140)),
                ("order_date", models.DateField(blank=True, null=True)),
                ("commission_date", models.DateField(default=django.utils.timezone.localdate)),
                ("approved_at", models.DateTimeField(blank=True, null=True)),
                ("sale_value", models.DecimalField(blank=True, decimal_places=2, max_digits=14, null=True, validators=[django.core.validators.MinValueValidator(Decimal("0"))])),
                ("amount", models.DecimalField(decimal_places=2, max_digits=14, validators=[django.core.validators.MinValueValidator(Decimal("0"))])),
                ("status", models.CharField(choices=[("pending", "Pendente"), ("approved", "Aprovada"), ("cancelled", "Cancelada"), ("refunded", "Reembolsada")], default="pending", max_length=12)),
                ("source", models.CharField(default="manual", max_length=100)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("campaign", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="financeiro.campaign")),
                ("channel", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="financeiro.channel")),
                ("marketplace", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="financeiro.marketplace")),
                ("product", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="financeiro.product")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-commission_date", "-id"]},
        ),
        migrations.CreateModel(
            name="FinancialAudit",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("entity", models.CharField(max_length=30)),
                ("object_id", models.PositiveBigIntegerField()),
                ("action", models.CharField(max_length=30)),
                ("before", models.JSONField(blank=True, default=dict)),
                ("after", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="AutomationSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("enabled", models.BooleanField(default=True)),
                ("auto_import", models.BooleanField(default=True)),
                ("auto_recurring_expenses", models.BooleanField(default=True)),
                ("interval_minutes", models.PositiveSmallIntegerField(default=15)),
                ("inbox_path", models.CharField(blank=True, help_text="Pasta local monitorada pelo comando de automação", max_length=500)),
                ("notify_roi_negative", models.BooleanField(default=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="automation_settings", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="RecurringExpense",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("description", models.CharField(max_length=180)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=14, validators=[django.core.validators.MinValueValidator(Decimal("0.01"))])),
                ("category", models.CharField(choices=[("trafego", "Tráfego pago"), ("anuncios", "Anúncios"), ("ferramentas", "Ferramentas e softwares"), ("assinaturas", "Assinaturas"), ("conteudo", "Produção de conteúdo"), ("terceiros", "Serviços terceirizados"), ("operacao", "Operação"), ("outros", "Outros")], default="assinaturas", max_length=20)),
                ("frequency", models.CharField(choices=[("monthly", "Mensal"), ("weekly", "Semanal"), ("yearly", "Anual")], default="monthly", max_length=10)),
                ("next_date", models.DateField()),
                ("active", models.BooleanField(default=True)),
                ("last_generated", models.DateField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("channel", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="financeiro.channel")),
                ("marketplace", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, to="financeiro.marketplace")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["next_date", "description"]},
        ),
        migrations.CreateModel(
            name="AutomationEvent",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("level", models.CharField(choices=[("info", "Informação"), ("success", "Sucesso"), ("warning", "Atenção"), ("error", "Erro")], default="info", max_length=10)),
                ("title", models.CharField(max_length=160)),
                ("message", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="ImportedFile",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("sha256", models.CharField(max_length=64)),
                ("filename", models.CharField(max_length=255)),
                ("kind", models.CharField(max_length=20)),
                ("imported_count", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddConstraint(
            model_name="commission",
            constraint=models.UniqueConstraint(condition=models.Q(order_id="", _negated=True), fields=("user", "marketplace", "order_id"), name="uniq_user_market_order"),
        ),
        migrations.AddConstraint(
            model_name="commission",
            constraint=models.UniqueConstraint(condition=models.Q(transaction_id="", _negated=True), fields=("user", "marketplace", "transaction_id"), name="uniq_user_market_transaction"),
        ),
        migrations.AddConstraint(
            model_name="importedfile",
            constraint=models.UniqueConstraint(fields=("user", "sha256"), name="uniq_imported_file_user_hash"),
        ),
    ]
