from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0009_produto_indicadores_e_progresso_coleta"),
    ]

    operations = [
        migrations.AddField(
            model_name="perfilusuario",
            name="data_nascimento",
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="perfilusuario",
            name="telefone",
            field=models.CharField(blank=True, default="", max_length=30),
        ),
        migrations.AddField(
            model_name="perfilusuario",
            name="foto",
            field=models.ImageField(blank=True, null=True, upload_to="perfis/"),
        ),
        migrations.AddField(
            model_name="perfilusuario",
            name="meta_investimento_mensal",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True),
        ),
        migrations.AddField(
            model_name="perfilusuario",
            name="meta_retorno_mensal",
            field=models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True),
        ),
        migrations.AddField(
            model_name="perfilusuario",
            name="plataformas_divulgacao",
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name="perfilusuario",
            name="nicho",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
    ]
