# Initial schema for the LTV Manager module integrated into Afillimetrics / Skallora.
import decimal
import django.core.validators
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.CreateModel(
            name="Marketplace",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)), ("code", models.SlugField(max_length=80)), ("active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now, editable=False)), ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="marketplace_records", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Channel",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)), ("code", models.SlugField(max_length=80)), ("active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now, editable=False)), ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="channel_records", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="AutomationSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("enabled", models.BooleanField(default=False)),
                ("interval_seconds", models.PositiveIntegerField(default=900, validators=[django.core.validators.MinValueValidator(60), django.core.validators.MaxValueValidator(86400)])),
                ("pending_alert_days", models.PositiveIntegerField(default=14)), ("last_run_at", models.DateTimeField(blank=True, null=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="ltv_automation_settings", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="AutomationRun",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("run_type", models.CharField(choices=[("maintenance", "Manutenção analítica"), ("snapshot", "Snapshot diário"), ("alerts", "Verificação de alertas"), ("sync", "Sincronização externa")], default="maintenance", max_length=20)),
                ("status", models.CharField(choices=[("running", "Executando"), ("success", "Concluída"), ("warning", "Concluída com alertas"), ("failed", "Falhou")], default="running", max_length=16)),
                ("started_at", models.DateTimeField(default=django.utils.timezone.now)), ("finished_at", models.DateTimeField(blank=True, null=True)),
                ("processed", models.PositiveIntegerField(default=0)), ("details", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now, editable=False)), ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="automationrun_records", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-started_at"]},
        ),
        migrations.CreateModel(
            name="ImportBatch",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("filename", models.CharField(max_length=255)), ("status", models.CharField(choices=[("preview", "Prévia"), ("completed", "Concluída"), ("failed", "Falhou")], default="preview", max_length=16)),
                ("total_rows", models.PositiveIntegerField(default=0)), ("imported_rows", models.PositiveIntegerField(default=0)), ("updated_rows", models.PositiveIntegerField(default=0)), ("skipped_rows", models.PositiveIntegerField(default=0)), ("error_rows", models.PositiveIntegerField(default=0)),
                ("preview_json", models.JSONField(blank=True, default=list)), ("summary", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now, editable=False)), ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="importbatch_records", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="LTVSnapshot",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("snapshot_date", models.DateField(default=django.utils.timezone.localdate)),
                ("approved_total", models.DecimalField(decimal_places=2, default=decimal.Decimal("0.00"), max_digits=16)),
                ("pending_total", models.DecimalField(decimal_places=2, default=decimal.Decimal("0.00"), max_digits=16)),
                ("acquisition_count", models.PositiveIntegerField(default=0)), ("average_ltv", models.DecimalField(decimal_places=2, default=decimal.Decimal("0.00"), max_digits=16)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="ltv_snapshots", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["snapshot_date"]},
        ),
        migrations.CreateModel(
            name="Product",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("name", models.CharField(max_length=180)),
                ("external_id", models.CharField(blank=True, max_length=160)), ("category", models.CharField(blank=True, max_length=120)), ("active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now, editable=False)), ("updated_at", models.DateTimeField(auto_now=True)),
                ("marketplace", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="products", to="ltv.marketplace")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="product_records", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Campaign",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("name", models.CharField(max_length=180)),
                ("start_date", models.DateField(blank=True, null=True)), ("end_date", models.DateField(blank=True, null=True)),
                ("status", models.CharField(choices=[("active", "Ativa"), ("paused", "Pausada"), ("finished", "Finalizada")], default="active", max_length=16)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now, editable=False)), ("updated_at", models.DateTimeField(auto_now=True)),
                ("channel", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="campaigns", to="ltv.channel")),
                ("marketplace", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="campaigns", to="ltv.marketplace")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="campaign_records", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Acquisition",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("external_reference", models.CharField(blank=True, help_text="Identificador pseudonimizado ou externo; não informe dados pessoais.", max_length=180)),
                ("acquired_at", models.DateTimeField(db_index=True, default=django.utils.timezone.now)), ("source", models.CharField(blank=True, max_length=120)),
                ("attribution_method", models.CharField(choices=[("external_id", "Identificador externo comprovado"), ("tracking", "Código de rastreamento"), ("campaign", "Evidência de campanha"), ("manual", "Atribuição manual documentada"), ("unattributed", "Não atribuída")], default="unattributed", max_length=20)),
                ("confidence", models.DecimalField(decimal_places=2, default=decimal.Decimal("0.00"), max_digits=5, validators=[django.core.validators.MinValueValidator(0), django.core.validators.MaxValueValidator(100)])),
                ("notes", models.TextField(blank=True)), ("created_at", models.DateTimeField(default=django.utils.timezone.now, editable=False)), ("updated_at", models.DateTimeField(auto_now=True)),
                ("campaign", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="acquisitions", to="ltv.campaign")),
                ("channel", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="acquisitions", to="ltv.channel")),
                ("marketplace", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="acquisitions", to="ltv.marketplace")),
                ("product", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="acquisitions", to="ltv.product")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="acquisition_records", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-acquired_at"]},
        ),
        migrations.CreateModel(
            name="Commission",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("external_id", models.CharField(blank=True, max_length=180)), ("source", models.CharField(default="manual", max_length=100)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=14, validators=[django.core.validators.MinValueValidator(decimal.Decimal("0.00"))])),
                ("sale_date", models.DateTimeField(db_index=True, default=django.utils.timezone.now)), ("approved_at", models.DateTimeField(blank=True, null=True)),
                ("status", models.CharField(choices=[("pending", "Pendente"), ("approved", "Aprovada"), ("cancelled", "Cancelada"), ("refunded", "Reembolsada"), ("reversed", "Revertida")], db_index=True, default="pending", max_length=16)),
                ("attribution_evidence", models.CharField(blank=True, max_length=240)), ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(default=django.utils.timezone.now, editable=False)), ("updated_at", models.DateTimeField(auto_now=True)),
                ("acquisition", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="commissions", to="ltv.acquisition")),
                ("campaign", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="commissions", to="ltv.campaign")),
                ("channel", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="commissions", to="ltv.channel")),
                ("marketplace", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="commissions", to="ltv.marketplace")),
                ("product", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="commissions", to="ltv.product")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="commission_records", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-sale_date"]},
        ),
        migrations.CreateModel(
            name="AttributionHistory",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("reason", models.TextField()), ("created_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("changed_by", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ("commission", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="attribution_history", to="ltv.commission")),
                ("new_acquisition", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="new_attributions", to="ltv.acquisition")),
                ("previous_acquisition", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="previous_attributions", to="ltv.acquisition")),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddConstraint(model_name="marketplace", constraint=models.UniqueConstraint(fields=("user", "code"), name="uniq_marketplace_user_code")),
        migrations.AddConstraint(model_name="channel", constraint=models.UniqueConstraint(fields=("user", "code"), name="uniq_channel_user_code")),
        migrations.AddConstraint(model_name="acquisition", constraint=models.UniqueConstraint(condition=models.Q(("external_reference", ""), _negated=True), fields=("user", "external_reference"), name="uniq_acquisition_user_external_ref")),
        migrations.AddConstraint(model_name="commission", constraint=models.UniqueConstraint(condition=models.Q(("external_id", ""), _negated=True), fields=("user", "source", "external_id"), name="uniq_commission_source_external_id")),
        migrations.AddConstraint(model_name="ltvsnapshot", constraint=models.UniqueConstraint(fields=("user", "snapshot_date"), name="uniq_ltv_snapshot_user_date")),
        migrations.AddIndex(model_name="product", index=models.Index(fields=["user", "name"], name="ltv_product_user_name_idx")),
        migrations.AddIndex(model_name="campaign", index=models.Index(fields=["user", "status"], name="ltv_campaign_user_status_idx")),
        migrations.AddIndex(model_name="acquisition", index=models.Index(fields=["user", "acquired_at"], name="ltv_acq_user_date_idx")),
        migrations.AddIndex(model_name="acquisition", index=models.Index(fields=["user", "campaign"], name="ltv_acq_user_camp_idx")),
        migrations.AddIndex(model_name="commission", index=models.Index(fields=["user", "status", "sale_date"], name="ltv_comm_user_stat_date_idx")),
        migrations.AddIndex(model_name="commission", index=models.Index(fields=["user", "acquisition"], name="ltv_comm_user_acq_idx")),
    ]
