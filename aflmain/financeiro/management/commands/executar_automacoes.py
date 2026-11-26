import time
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from financeiro.models import AutomationSettings
from financeiro.services.automacao import process_inbox, generate_recurring_expenses, event

class Command(BaseCommand):
    help = "Executa importação automática de CSV e despesas recorrentes."
    def add_arguments(self, parser):
        parser.add_argument("--loop", action="store_true", help="Mantém o processo ativo")
        parser.add_argument("--interval", type=int, default=0, help="Intervalo em segundos; padrão usa a preferência do usuário")
    def handle(self, *args, **opts):
        while True:
            for user in get_user_model().objects.filter(is_active=True):
                cfg, _ = AutomationSettings.objects.get_or_create(user=user)
                if not cfg.enabled: continue
                try:
                    if cfg.auto_import:
                        folder = cfg.inbox_path or str(Path(settings.ROI_INBOX_DIR) / str(user.pk))
                        process_inbox(user, folder)
                    if cfg.auto_recurring_expenses: generate_recurring_expenses(user)
                except Exception as exc:
                    event(user, "error", "Falha na rotina automática", str(exc))
            if not opts["loop"]: break
            interval = opts["interval"] or max(300, min([c.interval_minutes for c in AutomationSettings.objects.filter(enabled=True)] or [15]) * 60)
            time.sleep(interval)
