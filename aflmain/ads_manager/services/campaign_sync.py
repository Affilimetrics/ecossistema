from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from ads_manager.models import Campaign
from ads_manager.providers.meta_provider import MetaAdsProvider
from ads_manager.services.encryption import decrypt_token


CAMPAIGN_SYNC_INTERVAL = timedelta(minutes=10)


def synchronize_campaigns(connection, account, *, force=False):
    """Synchronize a selected account once per interval and return its DB rows.

    The dashboard and the dedicated campaigns page intentionally share this
    persisted source of truth. Errors are propagated so callers can continue
    showing the last successful snapshot without corrupting it.
    """
    now = timezone.now()
    last_sync = account.last_campaign_sync_at
    if not force and last_sync and (now - last_sync) < CAMPAIGN_SYNC_INTERVAL:
        return Campaign.objects.filter(ad_account=account)

    token = decrypt_token(connection.encrypted_access_token)
    provider = MetaAdsProvider(token)
    remote_campaigns = provider.list_campaigns(account.normalized_id)
    synchronized_ids = []

    with transaction.atomic():
        for item in remote_campaigns:
            external_id = str(item.get("id") or "").strip()
            if not external_id:
                continue
            synchronized_ids.append(external_id)
            Campaign.objects.update_or_create(
                ad_account=account,
                external_id=external_id,
                defaults={
                    "name": item.get("name") or "Campanha sem nome",
                    "objective": item.get("objective") or "",
                    "status": item.get("status") or "",
                    "effective_status": item.get("effective_status") or "",
                    "daily_budget": item.get("daily_budget") or "",
                    "lifetime_budget": item.get("lifetime_budget") or "",
                    "external_created_at": parse_datetime(item.get("created_time") or "") if item.get("created_time") else None,
                    "synced_at": now,
                },
            )

        existing = Campaign.objects.filter(ad_account=account)
        if synchronized_ids:
            existing.exclude(external_id__in=synchronized_ids).delete()
        else:
            existing.delete()
        account.last_campaign_sync_at = now
        account.save(update_fields=["last_campaign_sync_at"])

    return Campaign.objects.filter(ad_account=account)
