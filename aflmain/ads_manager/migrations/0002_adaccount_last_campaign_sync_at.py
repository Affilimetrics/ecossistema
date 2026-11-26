from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("ads_manager", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="adaccount",
            name="last_campaign_sync_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
