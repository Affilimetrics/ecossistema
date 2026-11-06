from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings

class Migration(migrations.Migration):
    dependencies = [("core", "0006_configuracoes_templates_alertas_produtos_quentes"), migrations.swappable_dependency(settings.AUTH_USER_MODEL)]
    operations = [
        migrations.AddField(model_name="execucao", name="categorias_loop", field=models.JSONField(blank=True, default=list)),
        migrations.CreateModel(
            name="PerfilUsuario",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("pais", models.CharField(blank=True, default="Brasil", max_length=80)),
                ("estado", models.CharField(blank=True, default="", max_length=100)),
                ("cidade", models.CharField(blank=True, default="", max_length=120)),
                ("timezone", models.CharField(default="America/Sao_Paulo", max_length=80)),
                ("atualizado_em", models.DateTimeField(auto_now=True)),
                ("owner", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="perfil_local", to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
