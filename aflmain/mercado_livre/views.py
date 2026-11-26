import csv
import json
from decimal import Decimal

from django.conf import settings as django_settings
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ImproperlyConfigured
from django.http import HttpResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST
from django.utils import timezone

from core.models import Produto

from .forms import AffiliateLinkForm, AffiliateMappingUploadForm, SearchForm, SettingsForm
from .models import MarketplaceItem, MercadoLivreSettings, SearchRun
from .services import (
    MercadoLivreAPI, MercadoLivreAPIError, apply_affiliate_mapping,
    persist_search_results, save_affiliate_link,
)


def _settings_for(user):
    return MercadoLivreSettings.objects.filter(user=user).first()


@login_required
def dashboard(request):
    user_settings = _settings_for(request.user)
    configured_token = bool(
        (user_settings and user_settings.access_token)
        or getattr(django_settings, "ML_ACCESS_TOKEN", "")
    )
    site_id = user_settings.site_id if user_settings else getattr(django_settings, "ML_SITE_ID", "MLB")
    settings_form = SettingsForm(initial={
        "site_id": site_id or "MLB",
        "affiliate_id": user_settings.affiliate_id if user_settings else getattr(django_settings, "ML_AFFILIATE_ID", ""),
        "request_timeout": user_settings.request_timeout if user_settings else getattr(django_settings, "ML_REQUEST_TIMEOUT", 20),
    })
    items = (
        MarketplaceItem.objects.filter(user=request.user)
        .select_related("product", "product__afiliado")
        .order_by("-updated_at")[:100]
    )
    products_count = Produto.objects.filter(owner=request.user, marketplace="MERCADO_LIVRE").count()
    links_count = Produto.objects.filter(
        owner=request.user,
        marketplace="MERCADO_LIVRE",
        afiliado__link_afiliado__isnull=False,
    ).exclude(afiliado__link_afiliado="").count()
    context = {
        "search_form": SearchForm(),
        "settings_form": settings_form,
        "mapping_form": AffiliateMappingUploadForm(),
        "items": items,
        "recent_searches": SearchRun.objects.filter(user=request.user)[:8],
        "products_count": products_count,
        "links_count": links_count,
        "configured_token": configured_token,
        "token_source": "conta" if user_settings and user_settings.access_token else ("ambiente" if getattr(django_settings, "ML_ACCESS_TOKEN", "") else "nenhum"),
        "site_id": site_id or "MLB",
    }
    return render(request, "mercado_livre/dashboard.html", context)


@login_required
@require_POST
def search(request):
    form = SearchForm(request.POST)
    if not form.is_valid():
        for errors in form.errors.values():
            for error in errors:
                messages.error(request, error)
        return redirect("mercado_livre:dashboard")

    query = form.cleaned_data["query"]
    quantity = form.cleaned_data["quantity"]
    try:
        api = MercadoLivreAPI(_settings_for(request.user))
        raw_products = api.search(query, quantity)
        # A persistência ocorre em transação; falhas não deixam catálogo parcialmente atualizado.
        run = persist_search_results(request.user, query, quantity, raw_products)
        if run.status == "EMPTY":
            messages.warning(request, "A busca não retornou anúncios válidos do Mercado Livre.")
        else:
            messages.success(
                request,
                f"Busca concluída: {run.returned_count} produto(s) atualizado(s); "
                f"{run.affiliate_count} com link oficial de afiliado.",
            )
    except (MercadoLivreAPIError, ValueError) as exc:
        SearchRun.objects.create(
            user=request.user, query=query, requested_limit=quantity,
            status="ERROR", error=str(exc)[:1000],
        )
        messages.error(request, str(exc))
    except ImproperlyConfigured:
        SearchRun.objects.create(
            user=request.user, query=query, requested_limit=quantity,
            status="ERROR", error="CREDENTIAL_ENCRYPTION_KEY não configurada.",
        )
        messages.error(request, "Configure CREDENTIAL_ENCRYPTION_KEY no .env para salvar credenciais criptografadas.")
    return redirect("mercado_livre:dashboard")


@login_required
@require_POST
def save_settings(request):
    form = SettingsForm(request.POST)
    if not form.is_valid():
        for errors in form.errors.values():
            for error in errors:
                messages.error(request, error)
        return redirect("mercado_livre:dashboard")
    obj, _ = MercadoLivreSettings.objects.get_or_create(user=request.user)
    obj.site_id = form.cleaned_data["site_id"]
    obj.affiliate_id = form.cleaned_data["affiliate_id"].strip()
    obj.request_timeout = form.cleaned_data["request_timeout"]
    update_fields = ["site_id", "affiliate_id", "request_timeout", "updated_at"]
    if form.cleaned_data["clear_access_token"]:
        obj.access_token = ""
        update_fields.append("access_token")
    elif form.cleaned_data["access_token"]:
        obj.access_token = form.cleaned_data["access_token"]
        update_fields.append("access_token")
    try:
        obj.save(update_fields=update_fields)
    except ImproperlyConfigured:
        messages.error(request, "Configure CREDENTIAL_ENCRYPTION_KEY no .env antes de armazenar o Access Token.")
    else:
        messages.success(request, "Configurações do Mercado Livre salvas.")
    return redirect("mercado_livre:dashboard")


@login_required
@require_POST
def update_affiliate_link(request, item_id):
    item = get_object_or_404(MarketplaceItem.objects.select_related("product"), pk=item_id, user=request.user)
    form = AffiliateLinkForm(request.POST)
    if not form.is_valid():
        for errors in form.errors.values():
            for error in errors:
                messages.error(request, error)
        return redirect("mercado_livre:dashboard")
    try:
        save_affiliate_link(request.user, item, form.cleaned_data["affiliate_url"])
    except (PermissionError, ValueError) as exc:
        messages.error(request, str(exc))
    else:
        messages.success(request, "Link oficial de afiliado atualizado e sincronizado com o catálogo do ecossistema.")
    return redirect("mercado_livre:dashboard")


@login_required
@require_POST
def import_affiliate_mapping(request):
    form = AffiliateMappingUploadForm(request.POST, request.FILES)
    if not form.is_valid():
        for errors in form.errors.values():
            for error in errors:
                messages.error(request, error)
        return redirect("mercado_livre:dashboard")

    uploaded = form.cleaned_data["mapping_file"]
    try:
        mapping = json.loads(uploaded.read().decode("utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError):
        messages.error(request, "O arquivo enviado não contém um JSON UTF-8 válido.")
        return redirect("mercado_livre:dashboard")
    if not isinstance(mapping, dict):
        messages.error(request, "O JSON deve ser um objeto com ID/URL como chave e link oficial como valor.")
        return redirect("mercado_livre:dashboard")

    result = apply_affiliate_mapping(request.user, mapping)
    if result["updated"]:
        messages.success(request, f"Importação concluída: {result['updated']} link(s) associado(s) ao catálogo.")
    else:
        messages.warning(request, "Nenhum mapeamento correspondeu a um produto do seu catálogo.")
    if result["unknown"]:
        messages.info(request, f"{result['unknown']} chave(s) não correspondem a anúncios cadastrados nesta conta.")
    if result["invalid"]:
        messages.warning(request, f"{result['invalid']} entrada(s) foram ignoradas por chave vazia ou URL inválida.")
    return redirect("mercado_livre:dashboard")


def _export_rows(user):
    items = MarketplaceItem.objects.filter(user=user).select_related("product", "product__afiliado").order_by("-updated_at")
    rows = []
    for item in items.iterator(chunk_size=500):
        product = item.product
        current = product.preco_atual
        original = product.preco_anterior
        discount = None
        if current is not None and original is not None and original > current > 0:
            discount = round(float((original - current) / original * Decimal("100")), 2)
        affiliate = item.affiliate_url or (product.afiliado.link_afiliado if hasattr(product, "afiliado") else "")
        rows.append({
            "product_id": item.external_id,
            "title": product.nome,
            "current_price": float(current) if current is not None else None,
            "original_price_price": float(original) if original is not None else None,
            "discount_percent": discount,
            "original_url": item.original_url,
            "affiliate_url": affiliate or "",
            "affiliate_status": "Configurado" if affiliate else "Pendente: gere o link no portal oficial e cadastre-o no produto",
        })
    return rows


@login_required
def export_csv(request):
    fields = [
        "product_id", "title", "current_price", "original_price_price",
        "discount_percent", "original_url", "affiliate_url", "affiliate_status",
    ]
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    response["Content-Disposition"] = 'attachment; filename="mercado_livre_produtos.csv"'
    response.write("\ufeff")
    writer = csv.DictWriter(response, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    writer.writerows(_export_rows(request.user))
    return response


@login_required
def export_json(request):
    rows = _export_rows(request.user)
    payload = {
        "generated_at": timezone.now().isoformat(),
        "count": len(rows),
        "products": rows,
    }
    response = HttpResponse(json.dumps(payload, ensure_ascii=False, indent=2), content_type="application/json; charset=utf-8")
    response["Content-Disposition"] = 'attachment; filename="mercado_livre_produtos.json"'
    return response
