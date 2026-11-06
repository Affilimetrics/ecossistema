from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="ConfiguracaoCanal",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("canal", models.CharField(choices=[("TELEGRAM","Telegram"),("WHATSAPP","WhatsApp")], max_length=20, unique=True)),
                ("ativo", models.BooleanField(default=False)),
                ("destino", models.CharField(blank=True, default="", max_length=255)),
                ("token", models.CharField(blank=True, default="", max_length=500)),
                ("endpoint", models.URLField(blank=True, default="", max_length=1000)),
            ],
        ),
        migrations.CreateModel(
            name="Execucao",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("inicio", models.DateTimeField(auto_now_add=True)),
                ("fim", models.DateTimeField(blank=True, null=True)),
                ("estado", models.CharField(db_index=True, default="INICIANDO", max_length=40)),
                ("produtos_processados", models.PositiveIntegerField(default=0)),
                ("produtos_total", models.PositiveIntegerField(default=0)),
                ("links_obtidos", models.PositiveIntegerField(default=0)),
                ("categorias", models.JSONField(blank=True, default=list)),
                ("keywords", models.JSONField(blank=True, default=list)),
                ("erro", models.TextField(blank=True, default="")),
            ],
            options={"ordering":["-inicio"]},
        ),
        migrations.CreateModel(
            name="Produto",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("categoria", models.CharField(db_index=True, max_length=120)),
                ("nome", models.CharField(blank=True, default="", max_length=500)),
                ("url_produto", models.URLField(max_length=2000, unique=True)),
                ("preco_anterior", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("preco_atual", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering":["-atualizado_em"]},
        ),
        migrations.CreateModel(
            name="Afiliado",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("link_afiliado", models.URLField(blank=True, max_length=3000, null=True)),
                ("status", models.CharField(db_index=True, default="REVISAR", max_length=30)),
                ("data_criacao", models.DateTimeField(auto_now_add=True)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("produto", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="afiliado", to="core.produto")),
            ],
        ),
        migrations.CreateModel(
            name="Oferta",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("titulo", models.CharField(blank=True, default="", max_length=500)),
                ("mensagem", models.TextField(blank=True, default="")),
                ("desconto_percentual", models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
                ("status", models.CharField(choices=[("RASCUNHO","Rascunho"),("PRONTA","Pronta"),("ENVIADA","Enviada"),("ARQUIVADA","Arquivada")], default="RASCUNHO", max_length=20)),
                ("criada_em", models.DateTimeField(auto_now_add=True)),
                ("atualizada_em", models.DateTimeField(auto_now=True)),
                ("produto", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="ofertas", to="core.produto")),
            ],
            options={"ordering":["-criada_em"]},
        ),
        migrations.CreateModel(
            name="Mensagem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("canal", models.CharField(choices=[("TELEGRAM","Telegram"),("WHATSAPP","WhatsApp")], max_length=20)),
                ("status", models.CharField(choices=[("PENDENTE","Pendente"),("ENVIADO","Enviado"),("ERRO","Erro")], default="PENDENTE", max_length=20)),
                ("conteudo", models.TextField(blank=True, default="")),
                ("data_envio", models.DateTimeField(blank=True, null=True)),
                ("erro", models.TextField(blank=True, default="")),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("produto", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="mensagens", to="core.produto")),
            ],
            options={"ordering":["-criado_em"]},
        ),
        migrations.CreateModel(
            name="LogExecucao",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("nivel", models.CharField(choices=[("INFO","Info"),("OK","OK"),("WARNING","Warning"),("ERROR","Error")], default="INFO", max_length=20)),
                ("mensagem", models.CharField(max_length=2000)),
                ("criado_em", models.DateTimeField(auto_now_add=True)),
                ("execucao", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="logs", to="core.execucao")),
            ],
            options={"ordering":["id"]},
        ),
    ]
