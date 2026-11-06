from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import core.fields


class Migration(migrations.Migration):
    dependencies = [("core", "0005_marketing_inteligente"), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.AlterField(model_name="configuracaocanal", name="token", field=core.fields.EncryptedTextField(blank=True, default="")),
        migrations.CreateModel(
            name="ConfiguracaoAutomacao",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("auto_publicar_ofertas", models.BooleanField(default=False)),
                ("canais_automaticos", models.JSONField(blank=True, default=list)),
                ("cache_retencao_hours", models.PositiveIntegerField(default=120)),
                ("campanha_sazonal", models.CharField(blank=True, default="NENHUM", max_length=80)),
                ("turno_padrao", models.CharField(blank=True, default="", max_length=20)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("owner", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="configuracao_automacao", to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name="TemplateOferta",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("tipo", models.CharField(choices=[("CATEGORIA", "Categoria"), ("KEYWORD", "Palavra-chave")], max_length=20)),
                ("chave", models.CharField(max_length=160)),
                ("chamadas", models.JSONField(blank=True, default=list)),
                ("divulgar_sem_template", models.BooleanField(default=False)),
                ("nativo", models.BooleanField(default=False)),
                ("ativo", models.BooleanField(default=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="templates_oferta", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["tipo", "chave"]},
        ),
        migrations.AddConstraint(model_name="templateoferta", constraint=models.UniqueConstraint(fields=("owner", "tipo", "chave"), name="uniq_template_por_owner_tipo_chave")),
        migrations.CreateModel(
            name="AlertaSistema",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("codigo", models.CharField(db_index=True, max_length=100)),
                ("canal", models.CharField(blank=True, default="", max_length=20)),
                ("nivel", models.CharField(choices=[("INFO", "Informação"), ("WARNING", "Alerta"), ("ERROR", "Erro")], default="WARNING", max_length=20)),
                ("titulo", models.CharField(max_length=180)),
                ("mensagem", models.TextField()),
                ("resolvido", models.BooleanField(default=False)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="alertas_sistema", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-atualizado_em"]},
        ),
        migrations.AddConstraint(model_name="alertasistema", constraint=models.UniqueConstraint(fields=("owner", "codigo"), name="uniq_alerta_ativo_codigo_owner")),
        migrations.CreateModel(
            name="ProdutoQuente",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("score", models.DecimalField(decimal_places=2, default=0, max_digits=8)),
                ("motivo", models.CharField(blank=True, default="", max_length=300)),
                ("calculado_em", models.DateTimeField(auto_now_add=True)),
                ("owner", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="produtos_quentes", to=settings.AUTH_USER_MODEL)),
                ("produto", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="ranking_quente", to="core.produto")),
            ],
            options={"ordering": ["-score", "-calculado_em"]},
        ),
    ]
