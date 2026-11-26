import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
import core.fields


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        ("core", "0009_produto_indicadores_e_progresso_coleta"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="MercadoLivreSettings",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("access_token", core.fields.EncryptedTextField(blank=True, default="")),
                ("site_id", models.CharField(default="MLB", max_length=8)),
                ("affiliate_id", models.CharField(blank=True, default="", max_length=120)),
                ("request_timeout", models.PositiveSmallIntegerField(default=20)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="mercado_livre_settings", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="MarketplaceItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("external_id", models.CharField(max_length=64)),
                ("original_url", models.URLField(max_length=2000)),
                ("affiliate_url", models.URLField(blank=True, default="", max_length=3000)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("product", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="mercado_livre_data", to="core.produto")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="mercado_livre_items", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-updated_at"],
                "indexes": [models.Index(fields=["user", "-updated_at"], name="ml_item_user_updated_idx")],
                "constraints": [
                    models.UniqueConstraint(fields=("user", "external_id"), name="uniq_ml_item_user_external_id"),
                    models.UniqueConstraint(fields=("user", "original_url"), name="uniq_ml_item_user_url"),
                ],
            },
        ),
        migrations.CreateModel(
            name="SearchRun",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("query", models.CharField(max_length=180)),
                ("requested_limit", models.PositiveSmallIntegerField(default=10)),
                ("returned_count", models.PositiveSmallIntegerField(default=0)),
                ("affiliate_count", models.PositiveSmallIntegerField(default=0)),
                ("status", models.CharField(choices=[("SUCCESS", "Concluída"), ("EMPTY", "Sem resultados"), ("ERROR", "Erro")], db_index=True, default="SUCCESS", max_length=12)),
                ("error", models.CharField(blank=True, default="", max_length=1000)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="mercado_livre_searches", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-created_at"],
                "indexes": [models.Index(fields=["user", "-created_at"], name="ml_search_user_date_idx")],
            },
        ),
    ]
