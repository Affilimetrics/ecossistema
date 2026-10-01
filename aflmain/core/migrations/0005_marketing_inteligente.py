from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [("core", "0004_execucao_keywords_loop")]
    operations = [
        migrations.AddField(model_name="produto", name="imagem_url", field=models.URLField(blank=True, default="", max_length=3000)),
        migrations.CreateModel(
            name="HistoricoPreco",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("preco", models.DecimalField(blank=True, decimal_places=2, max_digits=12, null=True)),
                ("registrado_em", models.DateTimeField(auto_now_add=True)),
                ("produto", models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="historico_precos", to="core.produto")),
            ],
            options={"ordering": ["-registrado_em"]},
        ),
    ]
