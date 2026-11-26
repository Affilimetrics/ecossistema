import csv
from datetime import date
from decimal import Decimal, InvalidOperation
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError, transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from .forms import ExpenseForm, CommissionForm, ProductForm, CampaignForm
from .models import Expense, Commission, Product, Campaign, Marketplace, Channel, FinancialAudit, AutomationSettings, RecurringExpense, AutomationEvent
from .services.indicadores import dashboard_metrics
from .services.relatorios import csv_response


DEFAULT_MARKETPLACES = ("Magalu", "Mercado Livre", "Amazon", "Shopee", "Outros")
DEFAULT_CHANNELS = ("Telegram", "WhatsApp", "Instagram", "TikTok", "YouTube", "Facebook", "Site/Blog", "Outros")

def ensure_user_defaults(user):
    """Garante dimensões padrão em duas leituras e no máximo dois INSERTs em lote."""
    existing_marketplaces = set(
        Marketplace.objects.filter(user=user, name__in=DEFAULT_MARKETPLACES)
        .values_list("name", flat=True)
    )
    missing_marketplaces = [
        Marketplace(user=user, name=name)
        for name in DEFAULT_MARKETPLACES if name not in existing_marketplaces
    ]
    if missing_marketplaces:
        Marketplace.objects.bulk_create(missing_marketplaces, ignore_conflicts=True)

    existing_channels = set(
        Channel.objects.filter(user=user, name__in=DEFAULT_CHANNELS)
        .values_list("name", flat=True)
    )
    missing_channels = [
        Channel(user=user, name=name)
        for name in DEFAULT_CHANNELS if name not in existing_channels
    ]
    if missing_channels:
        Channel.objects.bulk_create(missing_channels, ignore_conflicts=True)


@login_required
def dashboard(request):
    ensure_user_defaults(request.user)
    start = request.GET.get("inicio") or None
    end = request.GET.get("fim") or None
    marketplace = request.GET.get("marketplace") or None
    data = dashboard_metrics(request.user, start, end, marketplace)
    context = {
        **data,
        "expenses": Expense.objects.filter(user=request.user)[:8],
        "commissions": Commission.objects.filter(user=request.user)[:8],
        "marketplaces": Marketplace.objects.filter(user=request.user),
        "start": start, "end": end, "selected_marketplace": marketplace,
    }
    return render(request, "roi/dashboard/index.html", context)

@login_required
def expense_list(request):
    ensure_user_defaults(request.user)
    qs = Expense.objects.filter(user=request.user).select_related("marketplace", "product", "campaign", "channel")
    category = request.GET.get("categoria", "")
    marketplace = request.GET.get("marketplace", "")
    if category: qs = qs.filter(category=category)
    if marketplace: qs = qs.filter(marketplace_id=marketplace)
    return render(request, "roi/financeiro/list.html", {
        "title": "Investimentos", "items": qs, "kind": "expense",
        "categories": Expense.CATEGORIES, "marketplaces": Marketplace.objects.filter(user=request.user),
        "selected_category": category, "selected_marketplace": marketplace,
    })

@login_required
def expense_create(request):
    ensure_user_defaults(request.user)
    return save_form(request, ExpenseForm, "roi/financeiro/expense_form.html", "Investimento", "roi:expenses")

@login_required
def commission_list(request):
    ensure_user_defaults(request.user)
    qs = Commission.objects.filter(user=request.user).select_related("marketplace", "product", "campaign", "channel")
    status = request.GET.get("status", "")
    marketplace = request.GET.get("marketplace", "")
    product = request.GET.get("produto", "")
    if status: qs = qs.filter(status=status)
    if marketplace: qs = qs.filter(marketplace_id=marketplace)
    if product: qs = qs.filter(product_id=product)
    return render(request, "roi/financeiro/list.html", {
        "title": "Comissões", "items": qs, "kind": "commission",
        "statuses": Commission.STATUS, "marketplaces": Marketplace.objects.filter(user=request.user),
        "products": Product.objects.filter(user=request.user), "selected_status": status,
        "selected_marketplace": marketplace, "selected_product": product,
    })

@login_required
def commission_create(request):
    ensure_user_defaults(request.user)
    return save_form(request, CommissionForm, "roi/financeiro/commission_form.html", "Comissão", "roi:commissions")

@login_required
def product_list(request):
    return render(request, "roi/financeiro/list.html", {"title":"Produtos", "items":Product.objects.filter(user=request.user), "kind":"product"})

@login_required
def product_create(request):
    ensure_user_defaults(request.user)
    return save_form(request, ProductForm, "roi/financeiro/product_form.html", "Produto", "roi:products")

@login_required
def campaign_list(request):
    return render(request, "roi/financeiro/list.html", {"title":"Campanhas", "items":Campaign.objects.filter(user=request.user), "kind":"campaign"})

@login_required
def campaign_create(request):
    ensure_user_defaults(request.user)
    return save_form(request, CampaignForm, "roi/financeiro/campaign_form.html", "Campanha", "roi:campaigns")

def save_form(request, form_class, template, title, list_name):
    if request.method == "POST":
        form = form_class(request.POST, user=request.user)
        if form.is_valid():
            obj = form.save(commit=False)
            obj.user = request.user
            try:
                obj.save()
                if hasattr(form, "save_m2m"): form.save_m2m()
                messages.success(request, f"{title} salvo com sucesso.")
                return redirect(list_name)
            except IntegrityError:
                form.add_error(None, "Registro duplicado ou relacionamento inválido.")
    else:
        form = form_class(user=request.user)
    return render(request, template, {"form":form, "title":f"Novo {title.lower()}"})

@login_required
def expense_delete(request, pk):
    obj = get_object_or_404(Expense, pk=pk, user=request.user)
    if request.method == "POST":
        FinancialAudit.objects.create(user=request.user, entity="expense", object_id=obj.pk, action="deleted",
                                      before={"description":obj.description, "amount":str(obj.amount), "date":str(obj.date)})
        obj.delete()
        messages.success(request, "Investimento excluído. O evento foi registrado no histórico.")
    return redirect("roi:expenses")

@login_required
def export_expenses(request):
    qs = Expense.objects.filter(user=request.user).select_related("marketplace","product","campaign","channel")
    rows = ([x.date, x.description, x.category, x.amount, x.marketplace or "", x.product or "", x.campaign or "", x.channel or ""] for x in qs)
    return csv_response("investimentos.csv", ["data","descricao","categoria","valor","marketplace","produto","campanha","canal"], rows)

@login_required
def export_commissions(request):
    qs = Commission.objects.filter(user=request.user).select_related("marketplace","product","campaign","channel")
    rows = ([x.commission_date,x.order_id,x.transaction_id,x.marketplace,x.product or "",x.campaign or "",x.channel or "",x.amount,x.status,x.sale_value or ""] for x in qs)
    return csv_response("comissoes.csv", ["data","pedido","transacao","marketplace","produto","campanha","canal","comissao","status","valor_venda"], rows)

@login_required
def import_expenses(request):
    report = None
    session_key = "roi_expense_import_preview"

    if request.method == "POST" and request.POST.get("confirmar") == "1":
        preview_rows = request.session.get(session_key, [])
        if not preview_rows:
            messages.error(request, "A prévia expirou. Envie o arquivo novamente.")
        else:
            objects = [
                Expense(
                    user=request.user,
                    description=row["descricao"],
                    amount=Decimal(row["valor"]),
                    date=date.fromisoformat(row["data"]),
                    category=row["categoria"],
                )
                for row in preview_rows
            ]
            with transaction.atomic():
                Expense.objects.bulk_create(objects)
            request.session.pop(session_key, None)
            messages.success(request, f"{len(objects)} investimento(s) importado(s) com sucesso.")
            return redirect("roi:expenses")

    elif request.method == "POST" and request.FILES.get("arquivo"):
        uploaded = request.FILES["arquivo"]
        if uploaded.size > 2_000_000:
            messages.error(request, "Arquivo excede o limite de 2 MB.")
        else:
            try:
                decoded = uploaded.read().decode("utf-8-sig")
                first_line = decoded.splitlines()[0] if decoded.splitlines() else ""
                delimiter = ";" if first_line.count(";") >= first_line.count(",") else ","
                reader = csv.DictReader(decoded.splitlines(), delimiter=delimiter)
                required = {"descricao", "valor", "data", "categoria"}
                headers = {str(name or "").strip().lower() for name in (reader.fieldnames or [])}
                if not required.issubset(headers):
                    raise ValueError("Colunas obrigatórias: descricao;valor;data;categoria")

                valid_rows, errors = [], []
                valid_categories = {value for value, _label in Expense.CATEGORIES}
                for line, original_row in enumerate(reader, start=2):
                    row = {str(key or "").strip().lower(): (value or "").strip() for key, value in original_row.items()}
                    try:
                        amount = Decimal(row.get("valor", "").replace("R$", "").replace(" ", "").replace(",", "."))
                        parsed_date = date.fromisoformat(row.get("data", ""))
                        description = row.get("descricao", "").strip()
                        category = row.get("categoria", "").strip().lower()
                        if not description:
                            raise ValueError("descrição não pode ficar vazia")
                        if amount <= 0:
                            raise ValueError("valor deve ser maior que zero")
                        if category not in valid_categories:
                            raise ValueError("categoria inválida; use os códigos exibidos na tela de investimentos")
                        valid_rows.append({
                            "descricao": description[:180],
                            "valor": str(amount.quantize(Decimal("0.01"))),
                            "data": parsed_date.isoformat(),
                            "categoria": category,
                        })
                    except (InvalidOperation, ValueError, KeyError) as exc:
                        errors.append(f"Linha {line}: {exc}")

                request.session[session_key] = valid_rows
                report = {
                    "validos": len(valid_rows),
                    "erros": errors,
                    "preview": valid_rows[:20],
                    "total_validos": len(valid_rows),
                }
            except (UnicodeDecodeError, ValueError, IndexError) as exc:
                request.session.pop(session_key, None)
                messages.error(request, f"Não foi possível validar o CSV: {exc}")

    return render(request, "roi/financeiro/import.html", {"report": report})

@login_required
def automation_dashboard(request):
    settings_obj, _ = AutomationSettings.objects.get_or_create(user=request.user)
    if request.method == "POST":
        settings_obj.enabled = request.POST.get("enabled") == "on"
        settings_obj.auto_import = request.POST.get("auto_import") == "on"
        settings_obj.auto_recurring_expenses = request.POST.get("auto_recurring_expenses") == "on"
        settings_obj.interval_minutes = max(5, min(1440, int(request.POST.get("interval_minutes", 15))))
        settings_obj.inbox_path = request.POST.get("inbox_path", "").strip()
        settings_obj.notify_roi_negative = request.POST.get("notify_roi_negative") == "on"
        settings_obj.save()
        messages.success(request, "Preferências de automação atualizadas.")
        return redirect("roi:automation")
    return render(request, "roi/automation/index.html", {"settings_obj":settings_obj, "rules":RecurringExpense.objects.filter(user=request.user), "events":AutomationEvent.objects.filter(user=request.user)[:30]})

@login_required
def recurring_expense_create(request):
    if request.method == "POST":
        try:
            RecurringExpense.objects.create(user=request.user, description=request.POST["description"], amount=Decimal(request.POST["amount"].replace(",", ".")), category=request.POST["category"], frequency=request.POST["frequency"], next_date=date.fromisoformat(request.POST["next_date"]))
            messages.success(request, "Regra recorrente cadastrada.")
        except Exception as exc: messages.error(request, f"Não foi possível salvar: {exc}")
    return redirect("roi:automation")

@login_required
def recurring_expense_toggle(request, pk):
    rule = get_object_or_404(RecurringExpense, pk=pk, user=request.user)
    if request.method == "POST": rule.active = not rule.active; rule.save(update_fields=["active"])
    return redirect("roi:automation")
