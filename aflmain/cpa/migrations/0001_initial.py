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
            name="Channel",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)),
                ("code", models.SlugField(max_length=40)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"verbose_name": "canal", "verbose_name_plural": "canais", "ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Platform",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)),
                ("code", models.SlugField(max_length=40)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"verbose_name": "plataforma de anúncios", "verbose_name_plural": "plataformas de anúncios", "ordering": ["name"]},
        ),
        migrations.CreateModel(
            name="Campaign",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=160)),
                ("external_id", models.CharField(blank=True, help_text="ID da campanha na plataforma de anúncios.", max_length=120)),
                ("integration_key", models.SlugField(blank=True, help_text="Chave estável para integração com o projeto principal/LTV.", max_length=100)),
                ("objective", models.CharField(choices=[("purchase", "Compra"), ("lead", "Lead"), ("signup", "Cadastro"), ("click", "Clique qualificado"), ("other", "Outra conversão")], default="purchase", max_length=20)),
                ("conversion_label", models.CharField(default="Conversões", max_length=60)),
                ("is_active", models.BooleanField(default=True)),
                ("notes", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("channel", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="campaigns", to="cpa.channel")),
                ("platform", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="campaigns", to="cpa.platform")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="cpa_campaigns", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="ImportBatch",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("filename", models.CharField(max_length=255)),
                ("status", models.CharField(choices=[("preview", "Prévia"), ("confirmed", "Confirmada"), ("failed", "Falhou")], default="preview", max_length=20)),
                ("rows_total", models.PositiveIntegerField(default=0)),
                ("rows_imported", models.PositiveIntegerField(default=0)),
                ("rows_updated", models.PositiveIntegerField(default=0)),
                ("rows_ignored", models.PositiveIntegerField(default=0)),
                ("rows_error", models.PositiveIntegerField(default=0)),
                ("preview", models.JSONField(default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("confirmed_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.CreateModel(
            name="PerformanceRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("date", models.DateField(db_index=True, default=django.utils.timezone.localdate)),
                ("spend", models.DecimalField(decimal_places=2, max_digits=14, validators=[django.core.validators.MinValueValidator(0)])),
                ("clicks", models.PositiveIntegerField(default=0)),
                ("conversions", models.PositiveIntegerField(default=0)),
                ("impressions", models.PositiveIntegerField(blank=True, null=True)),
                ("source", models.CharField(default="manual", help_text="Origem do registro; ex.: manual ou import:meta-ads.", max_length=80)),
                ("external_id", models.CharField(blank=True, help_text="ID estável da linha/origem para reimportação idempotente.", max_length=140)),
                ("notes", models.CharField(blank=True, max_length=240)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("campaign", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="performance_records", to="cpa.campaign")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="cpa_performance_records", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-date", "-id"]},
        ),
        migrations.CreateModel(
            name="IntegrationToken",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100)),
                ("prefix", models.CharField(max_length=12, unique=True)),
                ("token_hash", models.CharField(max_length=128)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("last_used_at", models.DateTimeField(blank=True, null=True)),
                ("revoked_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="cpa_integration_tokens", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-created_at"]},
        ),
        migrations.AddConstraint(model_name="channel", constraint=models.UniqueConstraint(fields=("user", "code"), name="cpa_channel_code_uniq")),
        migrations.AddConstraint(model_name="platform", constraint=models.UniqueConstraint(fields=("user", "code"), name="cpa_platform_code_uniq")),
        migrations.AddConstraint(model_name="campaign", constraint=models.UniqueConstraint(condition=models.Q(("integration_key", ""), _negated=True), fields=("user", "integration_key"), name="cpa_cmp_user_ikey_uniq")),
        migrations.AddIndex(model_name="campaign", index=models.Index(fields=["user", "name"], name="cpa_cmp_user_name_idx")),
        migrations.AddIndex(model_name="campaign", index=models.Index(fields=["user", "external_id"], name="cpa_cmp_user_ext_idx")),
        migrations.AddConstraint(model_name="performancerecord", constraint=models.CheckConstraint(condition=models.Q(("spend__gte", 0)), name="cpa_spend_nonneg")),
        migrations.AddConstraint(model_name="performancerecord", constraint=models.CheckConstraint(condition=models.Q(("clicks__gte", 0)), name="cpa_clicks_nonneg")),
        migrations.AddConstraint(model_name="performancerecord", constraint=models.CheckConstraint(condition=models.Q(("conversions__gte", 0)), name="cpa_conv_nonneg")),
        migrations.AddConstraint(model_name="performancerecord", constraint=models.UniqueConstraint(condition=models.Q(("external_id", ""), _negated=True), fields=("user", "source", "external_id"), name="cpa_record_ext_src_uniq")),
        migrations.AddIndex(model_name="performancerecord", index=models.Index(fields=["user", "date"], name="cpa_rec_user_date_idx")),
        migrations.AddIndex(model_name="performancerecord", index=models.Index(fields=["user", "campaign", "date"], name="cpa_rec_user_cmp_dt_idx")),
    ]
