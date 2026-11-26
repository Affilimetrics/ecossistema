from collections import defaultdict
from datetime import timedelta
from decimal import Decimal
from django.db.models import Sum, Count, F, Value, CharField
from django.db.models.functions import TruncMonth, Coalesce
from django.utils import timezone
from ltv.models import Acquisition, Commission

ZERO = Decimal("0.00")
HORIZONS = (7, 30, 60, 90, 180, 365)


def money(value):
    return value if value is not None else ZERO


def dashboard_metrics(user):
    now = timezone.now()
    acquisitions = Acquisition.objects.filter(user=user)
    commissions = Commission.objects.filter(user=user)
    approved = commissions.filter(status="approved")
    pending = commissions.filter(status="pending")
    acquisition_count = acquisitions.count()
    approved_total = money(approved.aggregate(total=Sum("amount"))["total"])
    attributed_approved = approved.filter(acquisition__isnull=False)
    attributed_total = money(attributed_approved.aggregate(total=Sum("amount"))["total"])
    pending_total = money(pending.aggregate(total=Sum("amount"))["total"])
    average = (attributed_total / acquisition_count).quantize(Decimal("0.01")) if acquisition_count else ZERO

    this_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    previous_end = this_start - timedelta(microseconds=1)
    previous_start = (this_start - timedelta(days=1)).replace(day=1)
    current_total = money(attributed_approved.filter(sale_date__gte=this_start).aggregate(total=Sum("amount"))["total"])
    previous_total = money(attributed_approved.filter(sale_date__gte=previous_start, sale_date__lte=previous_end).aggregate(total=Sum("amount"))["total"])
    if previous_total > 0:
        growth = ((current_total - previous_total) / previous_total * Decimal("100")).quantize(Decimal("0.1"))
    else:
        growth = None

    monthly = attributed_approved.annotate(month=TruncMonth("sale_date")).values("month").annotate(total=Sum("amount")).order_by("month")
    monthly_map = {row["month"].strftime("%Y-%m"): float(row["total"] or 0) for row in monthly}
    labels, values = [], []
    cursor = (now.replace(day=1) - timedelta(days=335)).replace(day=1)
    for offset in range(12):
        month = cursor.month + offset
        year = cursor.year + (month - 1) // 12
        month = (month - 1) % 12 + 1
        key = f"{year:04d}-{month:02d}"
        labels.append(f"{month:02d}/{year}")
        values.append(monthly_map.get(key, 0))

    def dimension_rows(field, empty_label):
        return (
            attributed_approved
            .annotate(dimension=Coalesce(
                F(f"{field}__name"), F(f"acquisition__{field}__name"),
                Value(empty_label), output_field=CharField(),
            ))
            .values("dimension")
            .annotate(total=Sum("amount"), commission_count=Count("id"), acquisition_count=Count("acquisition", distinct=True))
            .order_by("-total")[:6]
        )

    product_rows = dimension_rows("product", "Sem produto")
    channel_rows = dimension_rows("channel", "Sem canal")
    marketplace_rows = dimension_rows("marketplace", "Sem marketplace")
    campaign_rows = dimension_rows("campaign", "Sem campanha")

    return {
        "acquisition_count": acquisition_count,
        "approved_total": approved_total,
        "attributed_total": attributed_total,
        "pending_total": pending_total,
        "average_ltv": average,
        "approved_count": approved.count(),
        "pending_count": pending.count(),
        "current_month_total": current_total,
        "growth": growth,
        "monthly_labels": labels,
        "monthly_values": values,
        "product_labels": [r["dimension"] for r in product_rows],
        "product_values": [float(r["total"] or 0) for r in product_rows],
        "channel_labels": [r["dimension"] for r in channel_rows],
        "channel_values": [float(r["total"] or 0) for r in channel_rows],
        "marketplace_labels": [r["dimension"] for r in marketplace_rows],
        "marketplace_values": [float(r["total"] or 0) for r in marketplace_rows],
        "campaign_labels": [r["dimension"] for r in campaign_rows],
        "campaign_values": [float(r["total"] or 0) for r in campaign_rows],
    }


def cohort_matrix(user, limit=18):
    now = timezone.now()
    acqs = list(Acquisition.objects.filter(user=user).order_by("acquired_at"))
    if not acqs:
        return []
    acq_ids = [a.pk for a in acqs]
    commission_rows = Commission.objects.filter(user=user, acquisition_id__in=acq_ids, status="approved").values_list("acquisition_id", "sale_date", "amount")
    by_acq = defaultdict(list)
    for acq_id, sale_date, amount in commission_rows:
        by_acq[acq_id].append((sale_date, amount))
    groups = defaultdict(list)
    for acq in acqs:
        groups[acq.acquired_at.strftime("%Y-%m")].append(acq)
    rows = []
    for cohort_key, members in sorted(groups.items(), reverse=True)[:limit]:
        row = {"cohort": cohort_key, "count": len(members)}
        for days in HORIZONS:
            eligible = [a for a in members if a.acquired_at <= now - timedelta(days=days)]
            if not eligible:
                row[f"d{days}"] = None
                continue
            total = ZERO
            for acq in eligible:
                cutoff = acq.acquired_at + timedelta(days=days)
                total += sum((amount for sale_date, amount in by_acq.get(acq.pk, []) if acq.acquired_at <= sale_date <= cutoff), ZERO)
            row[f"d{days}"] = (total / len(eligible)).quantize(Decimal("0.01"))
            row[f"d{days}_n"] = len(eligible)
        rows.append(row)
    return rows


def build_projection(user, horizon_months=12, minimum_sample=5):
    """Cohort forecast from historical commission value per acquisition-age month.

    A monthly age bucket is used only when the reference acquisitions have fully
    observed that 30-day interval. If evidence is insufficient, no forecast is returned.
    """
    now = timezone.now()
    acquisitions = list(Acquisition.objects.filter(user=user).order_by("acquired_at"))
    if len(acquisitions) < minimum_sample * 2:
        return {"available": False, "reason": "Histórico insuficiente para uma projeção confiável.", "labels": [], "observed": [], "projected": []}
    latest_month = max(a.acquired_at for a in acquisitions).strftime("%Y-%m")
    target = [a for a in acquisitions if a.acquired_at.strftime("%Y-%m") == latest_month]
    reference = [a for a in acquisitions if a.acquired_at.strftime("%Y-%m") != latest_month]
    if len(target) < 2 or len(reference) < minimum_sample:
        return {"available": False, "reason": "A coorte mais recente ou o histórico comparável ainda é pequeno.", "labels": [], "observed": [], "projected": []}
    refs = {a.pk: a for a in reference}
    target_ids = [a.pk for a in target]
    ref_ids = list(refs)
    all_ids = target_ids + ref_ids
    rows = Commission.objects.filter(user=user, acquisition_id__in=all_ids, status="approved").values_list("acquisition_id", "sale_date", "amount")
    by_acq = defaultdict(list)
    for acq_id, sale_date, amount in rows:
        by_acq[acq_id].append((sale_date, amount))
    age_days = max(0, (now - min(a.acquired_at for a in target)).days)
    current_age = min(horizon_months, age_days // 30)
    elapsed_in_bucket = age_days % 30
    remaining_fraction = Decimal(str((30 - elapsed_in_bucket) / 30))
    actual_total = ZERO
    for acq in target:
        actual_total += sum((v for dt, v in by_acq.get(acq.pk, []) if acq.acquired_at <= dt <= now), ZERO)
    actual_per_acq = (actual_total / len(target)).quantize(Decimal("0.01"))
    labels = ["Hoje"]
    observed = [float(actual_per_acq)]
    projected = [None]
    accumulated = actual_per_acq
    confidence_low = [None]
    confidence_high = [None]
    cumulative_variance = 0.0
    for bucket in range(current_age, horizon_months):
        samples = []
        for acq in reference:
            if now < acq.acquired_at + timedelta(days=(bucket + 1) * 30):
                continue
            start = acq.acquired_at + timedelta(days=bucket * 30)
            end = acq.acquired_at + timedelta(days=(bucket + 1) * 30)
            amount = sum((v for dt, v in by_acq.get(acq.pk, []) if start < dt <= end), ZERO)
            samples.append(float(amount))
        if len(samples) < minimum_sample:
            return {"available": False, "reason": f"Não há pelo menos {minimum_sample} aquisições maduras para estimar o mês de vida {bucket + 1}.", "labels": [], "observed": [], "projected": []}
        mean = sum(samples) / len(samples)
        variance = sum((x - mean) ** 2 for x in samples) / max(1, len(samples) - 1)
        fraction = float(remaining_fraction) if bucket == current_age else 1.0
        accumulated += Decimal(str(mean * fraction))
        cumulative_variance += (variance / len(samples)) * (fraction ** 2)
        margin = 1.96 * (cumulative_variance ** 0.5)
        labels.append(f"Mês {bucket + 1} (parcial)" if bucket == current_age and fraction < 1 else f"Mês {bucket + 1}")
        observed.append(None)
        projected.append(float(accumulated.quantize(Decimal("0.01"))))
        confidence_low.append(float(max(Decimal("0"), accumulated - Decimal(str(margin)))))
        confidence_high.append(float(accumulated) + margin)
    return {"available": True, "cohort": latest_month, "cohort_size": len(target), "labels": labels, "observed": observed, "projected": projected, "confidence_low": confidence_low, "confidence_high": confidence_high, "method": "Média histórica por faixa de idade da aquisição; intervalo aproximado de 95% sobre a média."}


def build_alerts(user):
    from ltv.models import AutomationSettings
    settings, _ = AutomationSettings.objects.get_or_create(user=user)
    cutoff = timezone.now() - timedelta(days=settings.pending_alert_days)
    old_pending = Commission.objects.filter(user=user, status="pending", sale_date__lt=cutoff).count()
    alerts = []
    if old_pending:
        alerts.append({"level": "warning", "title": "Comissões aguardando aprovação", "message": f"{old_pending} comissão(ões) pendente(s) há mais de {settings.pending_alert_days} dias."})
    if Acquisition.objects.filter(user=user).count() == 0:
        alerts.append({"level": "info", "title": "Comece registrando aquisições", "message": "Cadastre ou importe dados para habilitar as análises de coorte e LTV."})
    unassigned = Commission.objects.filter(user=user, status="approved", acquisition__isnull=True).count()
    if unassigned:
        alerts.append({"level": "danger", "title": "Comissões sem atribuição", "message": f"{unassigned} comissão(ões) aprovada(s) ainda não possuem vínculo comprovado com uma aquisição."})
    return alerts
