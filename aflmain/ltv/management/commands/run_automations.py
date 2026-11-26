import time
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.conf import settings
from ltv.models import AutomationSettings
from ltv.automation.tasks import run_user_maintenance

class Command(BaseCommand):
    help = "Executa snapshots e manutenção analítica dos usuários com automação ativada."

    def add_arguments(self, parser):
        parser.add_argument("--loop", action="store_true", help="Mantém o processo ativo.")
        parser.add_argument("--interval", type=int, default=settings.AUTOMATION_INTERVAL_SECONDS, help="Intervalo em segundos (mínimo 60).")
        parser.add_argument("--once", action="store_true", help="Executa uma rodada e encerra.")

    def handle(self, *args, **options):
        interval = max(60, options["interval"])
        self.stdout.write(self.style.SUCCESS("LTV Manager — rotina de manutenção iniciada."))
        while True:
            now = timezone.now()
            users = get_user_model().objects.filter(ltv_automation_settings__enabled=True).select_related("ltv_automation_settings")
            ran = 0
            for user in users.iterator():
                settings = user.ltv_automation_settings
                due = not settings.last_run_at or (now - settings.last_run_at).total_seconds() >= settings.interval_seconds
                if due:
                    run = run_user_maintenance(user)
                    ran += 1
                    self.stdout.write(f"{user.username}: {run.status} — {run.details}")
            if not ran:
                self.stdout.write("Nenhuma rotina habilitada precisava ser executada nesta rodada.")
            if options["once"] or not options["loop"]:
                break
            active_intervals = list(AutomationSettings.objects.filter(enabled=True).values_list("interval_seconds", flat=True))
            sleep_seconds = min([interval] + active_intervals) if active_intervals else interval
            self.stdout.write(f"Próxima verificação em {sleep_seconds} segundos. Ctrl+C para interromper.")
            try:
                time.sleep(sleep_seconds)
            except KeyboardInterrupt:
                self.stdout.write(self.style.WARNING("Rotina interrompida pelo usuário."))
                break
