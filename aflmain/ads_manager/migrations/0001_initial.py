import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
import django.utils.timezone


class Migration(migrations.Migration):
    initial = True

    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="ConnectedAccount",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("provider", models.CharField(choices=[("META", "Meta Ads"), ("GOOGLE", "Google Ads"), ("TIKTOK", "TikTok Ads"), ("LINKEDIN", "LinkedIn Ads")], default="META", max_length=20)),
                ("external_user_id", models.CharField(max_length=120)),
                ("display_name", models.CharField(blank=True, max_length=180)),
                ("encrypted_access_token", models.TextField()),
                ("token_expires_at", models.DateTimeField(blank=True, null=True)),
                ("granted_scopes", models.JSONField(blank=True, default=list)),
                ("connected_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("last_checked_at", models.DateTimeField(blank=True, null=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="ad_connections", to=settings.AUTH_USER_MODEL)),
            ],
            options={"ordering": ["-connected_at"]},
        ),
        migrations.CreateModel(
            name="AdAccount",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("external_id", models.CharField(max_length=120)),
                ("name", models.CharField(blank=True, max_length=220)),
                ("account_status", models.CharField(blank=True, max_length=40)),
                ("currency", models.CharField(blank=True, max_length=12)),
                ("timezone_name", models.CharField(blank=True, max_length=100)),
                ("disable_reason", models.CharField(blank=True, max_length=120)),
                ("synced_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("connection", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="ad_accounts", to="ads_manager.connectedaccount")),
            ],
            options={"ordering": ["name", "external_id"]},
        ),
        migrations.CreateModel(
            name="Campaign",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("external_id", models.CharField(max_length=120)),
                ("name", models.CharField(max_length=220)),
                ("objective", models.CharField(blank=True, max_length=60)),
                ("status", models.CharField(blank=True, max_length=40)),
                ("effective_status", models.CharField(blank=True, max_length=60)),
                ("daily_budget", models.CharField(blank=True, max_length=40)),
                ("lifetime_budget", models.CharField(blank=True, max_length=40)),
                ("external_created_at", models.DateTimeField(blank=True, null=True)),
                ("synced_at", models.DateTimeField(default=django.utils.timezone.now)),
                ("ad_account", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="campaigns", to="ads_manager.adaccount")),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.AddConstraint(
            model_name="connectedaccount",
            constraint=models.UniqueConstraint(fields=("user", "provider", "external_user_id"), name="uniq_user_provider_external"),
        ),
        migrations.AddConstraint(
            model_name="adaccount",
            constraint=models.UniqueConstraint(fields=("connection", "external_id"), name="uniq_connection_ad_account"),
        ),
        migrations.AddConstraint(
            model_name="campaign",
            constraint=models.UniqueConstraint(fields=("ad_account", "external_id"), name="uniq_account_campaign"),
        ),
    ]
