from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("core", "0002_user_ownership")]

    operations = [
        migrations.AddField(
            model_name="produto",
            name="marketplace",
            field=models.CharField(default="MAGALU", max_length=40, db_index=True),
        ),
    ]
