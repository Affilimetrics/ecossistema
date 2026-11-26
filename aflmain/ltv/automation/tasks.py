from decimal import Decimal
from django.db.models import Sum
from django.utils import timezone
from ltv.analytics.metrics import ZERO
from ltv.models import Acquisition, Commission, LTVSnapshot, AutomationRun, AutomationSettings


def run_user_maintenance(user):
    run = AutomationRun.objects.create(user=user, run_type="maintenance", status="running", details="Iniciando manutenção analítica.")
    try:
        approved = Commission.objects.filter(user=user, status="approved").aggregate(total=Sum("amount"))["total"] or ZERO
        attributed = Commission.objects.filter(user=user, status="approved", acquisition__isnull=False).aggregate(total=Sum("amount"))["total"] or ZERO
        pending = Commission.objects.filter(user=user, status="pending").aggregate(total=Sum("amount"))["total"] or ZERO
        acquisitions = Acquisition.objects.filter(user=user).count()
        average = (attributed / acquisitions).quantize(Decimal("0.01")) if acquisitions else ZERO
        LTVSnapshot.objects.update_or_create(
            user=user, snapshot_date=timezone.localdate(),
            defaults={"approved_total": approved, "pending_total": pending,
                      "acquisition_count": acquisitions, "average_ltv": average}
        )
        settings, _ = AutomationSettings.objects.get_or_create(user=user)
        settings.last_run_at = timezone.now()
        settings.save(update_fields=["last_run_at", "updated_at"])
        run.status = "success"
        run.processed = acquisitions + Commission.objects.filter(user=user).count()
        run.details = "Snapshot diário e indicadores-base atualizados. Conectores de marketplace externos ainda não estão configurados nesta versão."
    except Exception as exc:
        run.status = "failed"
        run.details = f"Falha na manutenção: {type(exc).__name__}: {exc}"
    run.finished_at = timezone.now()
    run.save(update_fields=["status", "processed", "details", "finished_at", "updated_at"])
    return run
