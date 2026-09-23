from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0003_produto_marketplace")]

    operations = [
        migrations.AddField(
            model_name="execucao",
            name="keywords_loop",
            field=models.JSONField(blank=True, default=list),
        ),
    ]
