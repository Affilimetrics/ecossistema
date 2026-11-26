import csv
import json
from datetime import timedelta
from decimal import Decimal
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.http import HttpResponse, JsonResponse, Http404
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.utils import timezone
from django.utils.text import slugify
from django.views.decorators.http import require_POST
from .analytics.metrics import dashboard_metrics, cohort_matrix, build_projection, build_alerts
from .forms import (AcquisitionForm, CommissionForm, ProductForm,
                    CampaignForm, ChannelForm, MarketplaceForm, AutomationSettingsForm, ImportFileForm)
from .models import (Acquisition, Commission, Product, Campaign, Channel, Marketplace,
                     AutomationSettings, AutomationRun, ImportBatch, AttributionHistory)
from .services.importer import preview_import, commit_import



@login_required
def dashboard(request):
    metrics = dashboard_metrics(request.user)
    recent_commissions = Commission.objects.filter(user=request.user).select_related("marketplace", "product", "acquisition")[:7]
    recent_acquisitions = Acquisition.objects.filter(user=request.user).select_related("marketplace", "product", "campaign", "channel")[:5]
    alerts = build_alerts(request.user)
    chart_payload = {
        "monthly": {"labels": metrics["monthly_labels"], "values": metrics["monthly_values"]},
        "products": {"labels": metrics["product_labels"], "values": metrics["product_values"]},
        "channels": {"labels": metrics["channel_labels"], "values": metrics["channel_values"]},
        "marketplaces": {"labels": metrics["marketplace_labels"], "values": metrics["marketplace_values"]},
        "campaigns": {"labels": metrics["campaign_labels"], "values": metrics["campaign_values"]},
    }
    return render(request, "ltv/dashboard.html", {
        "metrics": metrics, "recent_commissions": recent_commissions,
        "recent_acquisitions": recent_acquisitions, "alerts": alerts,
        "chart_payload": chart_payload,
    })


@login_required
def acquisition_list(request):
    qs = Acquisition.objects.filter(user=request.user).select_related("marketplace", "product", "campaign", "channel")
    query = request.GET.get("q", "").strip()
    if query:
        qs = qs.filter(external_reference__icontains=query) | qs.filter(source__icontains=query)
    return render(request, "ltv/acquisition_list.html", {"items": qs[:300], "query": query})


@login_required
def acquisition_form(request, pk=None):
    instance = get_object_or_404(Acquisition, pk=pk, user=request.user) if pk else None
    form = AcquisitionForm(request.POST or None, instance=instance, user=request.user)
    if request.method == "POST" and form.is_valid():
        obj = form.save(commit=False)
        obj.user = request.user
        obj.save()
        messages.success(request, "Aquisição salva com sucesso.")
        return redirect("ltv:acquisition_list")
    return render(request, "ltv/form_page.html", {"form": form, "page_title": "Editar aquisição" if instance else "Nova aquisição", "back_href": reverse("ltv:acquisition_list"), "submit_label": "Salvar alterações" if instance else "Criar aquisição"})


@login_required
@require_POST
def acquisition_delete(request, pk):
    obj = get_object_or_404(Acquisition, pk=pk, user=request.user)
    with transaction.atomic():
        linked = Commission.objects.select_for_update().filter(user=request.user, acquisition=obj)
        for commission in linked:
            AttributionHistory.objects.create(
                commission=commission, previous_acquisition=obj, new_acquisition=None,
                changed_by=request.user,
                reason=f"Aquisição {obj.external_reference or obj.pk} removida pelo usuário; o vínculo foi encerrado e a comissão permaneceu sem atribuição."
            )
        linked.update(acquisition=None)
        obj.delete()
    messages.success(request, "Aquisição removida. Os vínculos foram registrados no histórico e as comissões foram preservadas sem atribuição.")
    return redirect("ltv:acquisition_list")


@login_required
def commission_list(request):
    qs = Commission.objects.filter(user=request.user).select_related("marketplace", "product", "campaign", "channel", "acquisition")
    status = request.GET.get("status", "")
    query = request.GET.get("q", "").strip()
    if status in dict(Commission.STATUS_CHOICES):
        qs = qs.filter(status=status)
    if query:
        qs = qs.filter(external_id__icontains=query)
    return render(request, "ltv/commission_list.html", {"items": qs[:400], "status_filter": status, "query": query, "statuses": Commission.STATUS_CHOICES})


@login_required
def commission_form(request, pk=None):
    instance = get_object_or_404(Commission, pk=pk, user=request.user) if pk else None
    previous_acquisition = instance.acquisition if instance else None
    form = CommissionForm(request.POST or None, instance=instance, user=request.user)
    if request.method == "POST" and form.is_valid():
        obj = form.save(commit=False)
        obj.user = request.user
        with transaction.atomic():
            obj.save()
            if previous_acquisition != obj.acquisition:
                AttributionHistory.objects.create(
                    commission=obj, previous_acquisition=previous_acquisition,
                    new_acquisition=obj.acquisition, changed_by=request.user,
                    reason=(obj.attribution_evidence or "Alteração manual registrada pelo usuário.")
                )
        messages.success(request, "Comissão salva com sucesso.")
        return redirect("ltv:commission_list")
    return render(request, "ltv/form_page.html", {"form": form, "page_title": "Editar comissão" if instance else "Nova comissão", "back_href": reverse("ltv:commission_list"), "submit_label": "Salvar alterações" if instance else "Criar comissão"})


@login_required
@require_POST
def commission_delete(request, pk):
    obj = get_object_or_404(Commission, pk=pk, user=request.user)
    if obj.status != "reversed":
        obj.status = "reversed"
        stamp = timezone.localtime().strftime("%d/%m/%Y %H:%M")
        obj.notes = (obj.notes + "\n" if obj.notes else "") + f"Marcada como revertida pelo usuário em {stamp}."
        obj.save(update_fields=["status", "notes", "updated_at"])
    messages.success(request, "Comissão preservada no histórico e marcada como revertida; ela não integra o LTV realizado.")
    return redirect("ltv:commission_list")


RESOURCE_CONFIG = {
    "marketplaces": {"model": Marketplace, "form": MarketplaceForm, "title": "Marketplaces", "singular": "marketplace", "fields": ["name", "code", "active"], "list_url_name": "ltv:marketplaces", "create_url_name": "ltv:marketplace_create", "edit_url_name": "ltv:marketplace_edit", "delete_url_name": "ltv:marketplace_delete"},
    "products": {"model": Product, "form": ProductForm, "title": "Produtos", "singular": "produto", "fields": ["name", "marketplace", "category", "external_id", "active"], "list_url_name": "ltv:products", "create_url_name": "ltv:product_create", "edit_url_name": "ltv:product_edit", "delete_url_name": "ltv:product_delete"},
    "campaigns": {"model": Campaign, "form": CampaignForm, "title": "Campanhas", "singular": "campanha", "fields": ["name", "marketplace", "channel", "start_date", "end_date", "status"], "list_url_name": "ltv:campaigns", "create_url_name": "ltv:campaign_create", "edit_url_name": "ltv:campaign_edit", "delete_url_name": "ltv:campaign_delete"},
    "channels": {"model": Channel, "form": ChannelForm, "title": "Canais", "singular": "canal", "fields": ["name", "code", "active"], "list_url_name": "ltv:channels", "create_url_name": "ltv:channel_create", "edit_url_name": "ltv:channel_edit", "delete_url_name": "ltv:channel_delete"},
}


def _resource_config(kind):
    config = RESOURCE_CONFIG.get(kind)
    if not config:
        raise Http404("Recurso inexistente")
    return config


@login_required
def resource_list(request, kind):
    config = _resource_config(kind)
    items = config["model"].objects.filter(user=request.user)
    return render(request, "ltv/resource_list.html", {"items": items, "resource": config, "kind": kind})


@login_required
def resource_form(request, kind, pk=None):
    config = _resource_config(kind)
    instance = get_object_or_404(config["model"], pk=pk, user=request.user) if pk else None
    form = config["form"](request.POST or None, instance=instance, user=request.user)
    if request.method == "POST" and form.is_valid():
        obj = form.save(commit=False)
        obj.user = request.user
        obj.save()
        messages.success(request, f"{config['singular'].capitalize()} salvo com sucesso.")
        return redirect(config["list_url_name"])
    return render(request, "ltv/form_page.html", {"form": form, "page_title": f"Editar {config['singular']}" if instance else f"Novo {config['singular']}", "back_href": reverse(config["list_url_name"]), "submit_label": "Salvar alterações" if instance else "Criar registro"})


@login_required
@require_POST
def resource_delete(request, kind, pk):
    config = _resource_config(kind)
    obj = get_object_or_404(config["model"], pk=pk, user=request.user)
    obj.delete()
    messages.success(request, f"{config['singular'].capitalize()} removido.")
    return redirect(config["list_url_name"])


@login_required
def analysis(request):
    metrics = dashboard_metrics(request.user)
    cohorts = cohort_matrix(request.user)
    projection = build_projection(request.user)
    chart_payload = {
        "monthly": {"labels": metrics["monthly_labels"], "values": metrics["monthly_values"]},
        "products": {"labels": metrics["product_labels"], "values": metrics["product_values"]},
        "channels": {"labels": metrics["channel_labels"], "values": metrics["channel_values"]},
        "marketplaces": {"labels": metrics["marketplace_labels"], "values": metrics["marketplace_values"]},
        "campaigns": {"labels": metrics["campaign_labels"], "values": metrics["campaign_values"]},
        "projection": projection,
    }
    return render(request, "ltv/analysis.html", {"metrics": metrics, "cohorts": cohorts, "projection": projection, "chart_payload": chart_payload})


@login_required
def cohorts_page(request):
    return render(request, "ltv/cohorts.html", {"cohorts": cohort_matrix(request.user)})


@login_required
def import_view(request):
    batch = None
    if request.method == "POST" and request.POST.get("action") == "commit":
        batch = get_object_or_404(ImportBatch, pk=request.POST.get("batch_id"), user=request.user, status="preview")
        result = commit_import(batch, request.user)
        messages.success(request, batch.summary)
        return redirect("ltv:commission_list")
    form = ImportFileForm(request.POST or None, request.FILES or None)
    if request.method == "POST" and request.POST.get("action") != "commit" and form.is_valid():
        uploaded = form.cleaned_data["file"]
        try:
            preview = preview_import(uploaded)
            batch = ImportBatch.objects.create(
                user=request.user, filename=uploaded.name, total_rows=len(preview),
                preview_json=preview, status="preview"
            )
        except Exception as exc:
            form.add_error("file", str(exc))
    batches = ImportBatch.objects.filter(user=request.user)[:8]
    return render(request, "ltv/import.html", {"form": form, "batch": batch, "batches": batches})


@login_required
def automation(request):
    settings_obj, _ = AutomationSettings.objects.get_or_create(user=request.user)
    form = AutomationSettingsForm(request.POST or None, instance=settings_obj)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Configurações de automação atualizadas.")
        return redirect("ltv:automation")
    runs = AutomationRun.objects.filter(user=request.user)[:15]
    return render(request, "ltv/automation.html", {"form": form, "runs": runs, "enabled": settings_obj.enabled})


@login_required
@require_POST
def run_automation_now(request):
    from .automation.tasks import run_user_maintenance
    run = run_user_maintenance(request.user)
    if run.status == "success":
        messages.success(request, "Rotina de manutenção concluída. Consulte o histórico para ver os detalhes.")
    else:
        messages.error(request, "A rotina de manutenção encontrou uma falha. Consulte o histórico para ver o diagnóstico.")
    return redirect("ltv:automation")


@login_required
def reports(request):
    metrics = dashboard_metrics(request.user)
    return render(request, "ltv/reports.html", {"metrics": metrics})


@login_required
def export_commissions(request):
    status = request.GET.get("status", "")
    qs = Commission.objects.filter(user=request.user).select_related("acquisition", "marketplace", "product", "campaign", "channel")
    if status in dict(Commission.STATUS_CHOICES):
        qs = qs.filter(status=status)
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = 'attachment; filename="ltv_comissoes.csv"'
    response.write("\ufeff")
    writer = csv.writer(response, delimiter=";")
    writer.writerow(["id_externo", "valor", "data_venda", "data_aprovacao", "status", "marketplace", "produto", "campanha", "canal", "aquisicao", "fonte"])
    for obj in qs.iterator():
        writer.writerow([obj.external_id, obj.amount, obj.sale_date.isoformat(), obj.approved_at.isoformat() if obj.approved_at else "", obj.get_status_display(), obj.marketplace.name if obj.marketplace else "", obj.product.name if obj.product else "", obj.campaign.name if obj.campaign else "", obj.channel.name if obj.channel else "", obj.acquisition.external_reference if obj.acquisition else "", obj.source])
    return response


@login_required
def chart_data(request):
    metrics = dashboard_metrics(request.user)
    payload = {
        "monthly": {"labels": metrics["monthly_labels"], "values": metrics["monthly_values"]},
        "products": {"labels": metrics["product_labels"], "values": metrics["product_values"]},
        "channels": {"labels": metrics["channel_labels"], "values": metrics["channel_values"]},
        "marketplaces": {"labels": metrics["marketplace_labels"], "values": metrics["marketplace_values"]},
        "campaigns": {"labels": metrics["campaign_labels"], "values": metrics["campaign_values"]},
    }
    return JsonResponse(payload)
