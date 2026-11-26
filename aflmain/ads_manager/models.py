from django.conf import settings
from django.db import models
from django.utils import timezone


class ConnectedAccount(models.Model):
    PROVIDERS = [("META", "Meta Ads"), ("GOOGLE", "Google Ads"), ("TIKTOK", "TikTok Ads"), ("LINKEDIN", "LinkedIn Ads")]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="ad_connections")
    provider = models.CharField(max_length=20, choices=PROVIDERS, default="META")
    external_user_id = models.CharField(max_length=120)
    display_name = models.CharField(max_length=180, blank=True)
    encrypted_access_token = models.TextField()
    token_expires_at = models.DateTimeField(null=True, blank=True)
    granted_scopes = models.JSONField(default=list, blank=True)
    connected_at = models.DateTimeField(default=timezone.now)
    last_checked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["user", "provider", "external_user_id"], name="uniq_user_provider_external")]
        ordering = ["-connected_at"]

    def __str__(self):
        return f"{self.get_provider_display()} — {self.display_name or self.external_user_id}"


class AdAccount(models.Model):
    connection = models.ForeignKey(ConnectedAccount, on_delete=models.CASCADE, related_name="ad_accounts")
    external_id = models.CharField(max_length=120)
    name = models.CharField(max_length=220, blank=True)
    account_status = models.CharField(max_length=40, blank=True)
    currency = models.CharField(max_length=12, blank=True)
    timezone_name = models.CharField(max_length=100, blank=True)
    disable_reason = models.CharField(max_length=120, blank=True)
    synced_at = models.DateTimeField(default=timezone.now)
    last_campaign_sync_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["connection", "external_id"], name="uniq_connection_ad_account")]
        ordering = ["name", "external_id"]

    @property
    def normalized_id(self):
        return self.external_id if self.external_id.startswith("act_") else f"act_{self.external_id}"

    def __str__(self):
        return self.name or self.external_id


class Campaign(models.Model):
    ad_account = models.ForeignKey(AdAccount, on_delete=models.CASCADE, related_name="campaigns")
    external_id = models.CharField(max_length=120)
    name = models.CharField(max_length=220)
    objective = models.CharField(max_length=60, blank=True)
    status = models.CharField(max_length=40, blank=True)
    effective_status = models.CharField(max_length=60, blank=True)
    daily_budget = models.CharField(max_length=40, blank=True)
    lifetime_budget = models.CharField(max_length=40, blank=True)
    external_created_at = models.DateTimeField(null=True, blank=True)
    synced_at = models.DateTimeField(default=timezone.now)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["ad_account", "external_id"], name="uniq_account_campaign")]
        ordering = ["name"]

    def __str__(self):
        return self.name
