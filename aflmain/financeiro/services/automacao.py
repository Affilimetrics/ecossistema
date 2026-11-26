import csv, hashlib, os, shutil
from datetime import timedelta
from decimal import Decimal
from pathlib import Path
from django.db import transaction
from django.utils import timezone
from financeiro.models import (AutomationSettings, AutomationEvent, ImportedFile,
    Marketplace, Expense, Commission, RecurringExpense)

def event(user, level, title, message=""):
    AutomationEvent.objects.create(user=user, level=level, title=title, message=message)

def _money(value):
    value = str(value).replace("R$", "").replace(" ", "").strip()
    if "," in value:
        value = value.replace(".", "").replace(",", ".")
    return Decimal(value)

def _date(value, fallback):
    from datetime import date
    return date.fromisoformat(value) if value else fallback

def _advance(rule):
    d = rule.next_date
    if rule.frequency == "weekly": return d + timedelta(days=7)
    if rule.frequency == "yearly":
        try: return d.replace(year=d.year + 1)
        except ValueError: return d.replace(month=2, day=28, year=d.year + 1)
    # mensal: mantém o dia sempre que possível
    import calendar
    month = d.month + 1; year = d.year + (month > 12); month = 1 if month > 12 else month
    return d.replace(year=year, month=month, day=min(d.day, calendar.monthrange(year, month)[1]))

def generate_recurring_expenses(user, today=None):
    today = today or timezone.localdate(); created = 0
    for rule in RecurringExpense.objects.filter(user=user, active=True, next_date__lte=today):
        # proteção contra repetição em reexecuções do processo
        while rule.next_date <= today:
            with transaction.atomic():
                Expense.objects.get_or_create(user=user, description=f"{rule.description} [{rule.next_date:%Y-%m-%d}]",
                    date=rule.next_date, amount=rule.amount, defaults={"category":rule.category, "marketplace":rule.marketplace, "channel":rule.channel})
                rule.last_generated = rule.next_date
                rule.next_date = _advance(rule)
                rule.save(update_fields=["last_generated", "next_date"])
                created += 1
    if created: event(user, "success", "Despesas recorrentes geradas", f"{created} lançamento(s) criado(s) automaticamente.")
    return created

def import_inbox_file(user, path, kind):
    path = Path(path); raw = path.read_bytes(); digest = hashlib.sha256(raw).hexdigest()
    if ImportedFile.objects.filter(user=user, sha256=digest).exists():
        return 0, "Arquivo já processado anteriormente."
    text = raw.decode("utf-8-sig")
    delimiter = ";" if text.splitlines() and text.splitlines()[0].count(";") >= text.splitlines()[0].count(",") else ","
    reader = csv.DictReader(text.splitlines(), delimiter=delimiter)
    rows = list(reader); imported = 0
    with transaction.atomic():
        for row in rows:
            row = {str(k or "").strip().lower(): (v or "").strip() for k,v in row.items()}
            if kind == "investimentos":
                required = ["descricao", "valor", "data", "categoria"]
                if any(not row.get(k) for k in required): raise ValueError("Colunas obrigatórias: descricao, valor, data, categoria")
                amount = _money(row["valor"])
                Expense.objects.get_or_create(user=user, description=row["descricao"], date=_date(row["data"], timezone.localdate()), amount=amount, defaults={"category":row["categoria"]})
            elif kind == "comissoes":
                if not row.get("marketplace") or not row.get("comissao"): raise ValueError("Colunas obrigatórias: marketplace e comissao")
                market, _ = Marketplace.objects.get_or_create(user=user, name=row["marketplace"][:80])
                amount = _money(row["comissao"])
                order = row.get("pedido", "")
                tx = row.get("transacao", "")
                if order and Commission.objects.filter(user=user, marketplace=market, order_id=order).exists(): continue
                if tx and Commission.objects.filter(user=user, marketplace=market, transaction_id=tx).exists(): continue
                Commission.objects.create(user=user, marketplace=market, order_id=order, transaction_id=tx,
                    commission_date=_date(row.get("data"), timezone.localdate()), amount=amount,
                    status={"pendente":"pending", "aprovada":"approved", "aprovado":"approved", "cancelada":"cancelled", "reembolsada":"refunded"}.get((row.get("status") or "pending").lower(), (row.get("status") or "pending").lower()), sale_value=_money(row["valor_venda"]) if row.get("valor_venda") else None, source="importacao_automatica")
            imported += 1
        ImportedFile.objects.create(user=user, sha256=digest, filename=path.name, kind=kind, imported_count=imported)
    return imported, "Importação concluída."

def process_inbox(user, inbox):
    inbox = Path(inbox); totals = {"investimentos":0, "comissoes":0, "erros":0}
    for kind in ("investimentos", "comissoes"):
        source = inbox / kind; done = source / "processados"; failed = source / "com_erros"
        source.mkdir(parents=True, exist_ok=True); done.mkdir(exist_ok=True); failed.mkdir(exist_ok=True)
        for file in source.glob("*.csv"):
            try:
                count, msg = import_inbox_file(user, file, kind); totals[kind] += count
                shutil.move(str(file), str(done / file.name))
                event(user, "success", f"Arquivo {kind} processado", f"{file.name}: {count} registro(s). {msg}")
            except Exception as exc:
                totals["erros"] += 1; shutil.move(str(file), str(failed / file.name))
                event(user, "error", f"Falha ao importar {file.name}", str(exc))
    return totals
