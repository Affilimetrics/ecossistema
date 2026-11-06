from decimal import Decimal

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0008_mensagem_snapshot_republicacao"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="produto",
            name="comissao_porcentagem",
            field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=5),
        ),
        migrations.AddField(
            model_name="produto",
            name="comissao_valor",
            field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=10),
        ),
        migrations.AddField(
            model_name="produto",
            name="vendas_count",
            field=models.PositiveIntegerField(default=0),
        ),
        migrations.AddField(
            model_name="produto",
            name="lucro_estimado",
            field=models.DecimalField(decimal_places=2, default=Decimal("0.00"), max_digits=10),
        ),
        migrations.CreateModel(
            name="ProgressoColeta",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("marketplace", models.CharField(db_index=True, default="MAGALU", max_length=40)),
                ("tipo_alvo", models.CharField(choices=[("categoria", "Categoria"), ("keyword", "Palavra-chave")], max_length=20)),
                ("alvo", models.CharField(max_length=180)),
                ("proxima_pagina", models.PositiveIntegerField(default=1)),
                ("familias_recentes", models.JSONField(blank=True, default=list)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="progressos_coleta", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "ordering": ["-atualizado_em"],
                "constraints": [
                    models.UniqueConstraint(
                        fields=("owner", "marketplace", "tipo_alvo", "alvo"),
                        name="uniq_progresso_coleta_owner_alvo",
                    ),
                ],
            },
        ),
    ]
