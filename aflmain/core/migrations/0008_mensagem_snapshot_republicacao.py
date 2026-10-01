from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0007_perfil_usuario_timezone")]

    operations = [
        migrations.AddField(model_name="mensagem", name="preco_anterior", field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
        migrations.AddField(model_name="mensagem", name="preco_atual", field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
        migrations.AddField(model_name="mensagem", name="desconto_percentual", field=models.DecimalField(blank=True, decimal_places=2, max_digits=6, null=True)),
        migrations.AlterField(model_name="mensagem", name="status", field=models.CharField(choices=[("PENDENTE", "Pendente"), ("ENVIADO", "Enviado"), ("ERRO", "Erro"), ("FALHOU", "Falhou")], default="PENDENTE", max_length=20)),
    ]
