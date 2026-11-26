from datetime import timedelta
from decimal import Decimal

from django.db.models import Sum
from django.utils import timezone

from .models import PerformanceRecord

ZERO = Decimal("0.00")


def safe_ratio(numerator, denominator):
    if not denominator:
        return None
    return (Decimal(numerator) / Decimal(denominator)).quantize(Decimal("0.01"))


def aggregate_metrics(records):
    totals = records.aggregate(
        spend=Sum("spend"),
        clicks=Sum("clicks"),
        conversions=Sum("conversions"),
        impressions=Sum("impressions"),
    )
    spend = totals["spend"] or ZERO
    clicks = totals["clicks"] or 0
    conversions = totals["conversions"] or 0
    impressions = totals["impressions"] or 0
    return {
        "spend": spend,
        "clicks": clicks,
        "conversions": conversions,
        "impressions": impressions,
        "cpc": safe_ratio(spend, clicks),
        "cpa": safe_ratio(spend, conversions),
        "conversion_rate": (Decimal(conversions) * 100 / Decimal(clicks)).quantize(Decimal("0.01")) if clicks else None,
        "ctr": (Decimal(clicks) * 100 / Decimal(impressions)).quantize(Decimal("0.01")) if impressions else None,
    }


def build_dashboard_data(user, start_date=None, end_date=None, *, include_details=True):
    """Agrega métricas no banco; limita o volume transferido ao Python.

    CPC/CPA usam razão entre somas, nunca média dos custos individuais.
    """
    today = timezone.localdate()
    start_date = start_date or (today - timedelta(days=29))
    end_date = end_date or today
    qs = PerformanceRecord.objects.filter(
        user=user, date__gte=start_date, date__lte=end_date
    )

    totals = aggregate_metrics(qs)
    if not include_details:
        # A Home só precisa dos totais: evita GROUP BY diário/campanha e COUNT
        # de registros detalhados em cada acesso ao Workspace.
        return {
            "start_date": start_date,
            "end_date": end_date,
            "totals": totals,
            "daily": [],
            "campaigns": [],
            "record_count": None,
        }

    daily_data = {
        row["date"].isoformat(): row
        for row in qs.values("date").annotate(
            spend=Sum("spend"),
            clicks=Sum("clicks"),
            conversions=Sum("conversions"),
        ).order_by("date")
    }
    daily_rows = []
    current_day = start_date
    while current_day <= end_date:
        key = current_day.isoformat()
        vals = daily_data.get(key) or {"spend": ZERO, "clicks": 0, "conversions": 0}
        spend = vals["spend"] or ZERO
        clicks = vals["clicks"] or 0
        conversions = vals["conversions"] or 0
        daily_rows.append({
            "date": key,
            "spend": float(spend),
            "clicks": clicks,
            "conversions": conversions,
            "cpc": float(safe_ratio(spend, clicks)) if clicks else None,
            "cpa": float(safe_ratio(spend, conversions)) if conversions else None,
        })
        current_day += timedelta(days=1)

    campaign_rows = qs.values(
        "campaign__id",
        "campaign__name",
        "campaign__integration_key",
        "campaign__external_id",
        "campaign__platform__name",
        "campaign__channel__name",
        "campaign__objective",
        "campaign__conversion_label",
    ).annotate(
        spend=Sum("spend"),
        clicks=Sum("clicks"),
        conversions=Sum("conversions"),
    ).order_by("-spend", "campaign__name")

    campaigns = []
    for row in campaign_rows:
        spend = row["spend"] or ZERO
        clicks = row["clicks"] or 0
        conversions = row["conversions"] or 0
        campaigns.append({
            "id": row["campaign__id"],
            "name": row["campaign__name"],
            "integration_key": row["campaign__integration_key"],
            "external_id": row["campaign__external_id"],
            "platform": row["campaign__platform__name"],
            "channel": row["campaign__channel__name"],
            "objective": row["campaign__objective"],
            "conversion_label": row["campaign__conversion_label"],
            "spend": float(spend),
            "clicks": clicks,
            "conversions": conversions,
            "cpc": float(safe_ratio(spend, clicks)) if clicks else None,
            "cpa": float(safe_ratio(spend, conversions)) if conversions else None,
        })

    return {
        "start_date": start_date,
        "end_date": end_date,
        "totals": totals,
        "daily": daily_rows,
        "campaigns": campaigns,
        "record_count": qs.count(),
    }
