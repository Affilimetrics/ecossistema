import csv, secrets
from datetime import datetime, timedelta
from decimal import Decimal
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.hashers import make_password, check_password
from django.db import transaction
from django.db.models import Q
from django.http import HttpResponse, JsonResponse, HttpResponseBadRequest
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.utils.text import slugify
from django.views.decorators.http import require_POST, require_GET
from .analytics import build_dashboard_data
from .forms import CampaignForm, PerformanceRecordForm, ImportUploadForm, IntegrationTokenForm
from .models import Campaign, PerformanceRecord, ImportBatch, Platform, Channel, IntegrationToken
from .services.importer import read_rows, json_safe_rows, imported_dimension


@login_required
def dashboard(request):
    today = timezone.localdate()
    default_start = today - timedelta(days=29)
    try: start = datetime.strptime(request.GET.get("start", ""), "%Y-%m-%d").date() if request.GET.get("start") else default_start
    except ValueError: start = default_start
    try: end = datetime.strptime(request.GET.get("end", ""), "%Y-%m-%d").date() if request.GET.get("end") else today
    except ValueError: end = today
    if start > end: start, end = end, start
    if (end - start).days > 3660:
        start = end - timedelta(days=3660)
        messages.warning(request, "O período do painel foi limitado aos últimos 10 anos.")
    data = build_dashboard_data(request.user, start, end)
    recent = PerformanceRecord.objects.filter(user=request.user).select_related("campaign")[:8]
    return render(request, "cpa/dashboard.html", {"data": data, "recent": recent, "start": start, "end": end, "chart_data": {"daily": data["daily"], "campaigns": data["campaigns"]}})

@login_required
def campaign_list(request):
    return render(request, "cpa/campaign_list.html", {"campaigns": Campaign.objects.filter(user=request.user).select_related("platform", "channel")})

@login_required
def campaign_create(request):
    form = CampaignForm(request.POST or None, user=request.user)
    if request.method == "POST" and form.is_valid():
        obj = form.save(commit=False); obj.user = request.user
        if obj.platform_id and obj.platform.user_id != request.user.id: return HttpResponseBadRequest("Plataforma inválida.")
        if obj.channel_id and obj.channel.user_id != request.user.id: return HttpResponseBadRequest("Canal inválido.")
        obj.save(); messages.success(request, "Campanha cadastrada."); return redirect("cpa:campaign_list")
    return render(request, "cpa/form_page.html", {"form": form, "page_title": "Nova campanha", "back_url": "cpa:campaign_list"})

@login_required
def campaign_edit(request, pk):
    obj = get_object_or_404(Campaign, pk=pk, user=request.user)
    form = CampaignForm(request.POST or None, instance=obj, user=request.user)
    if request.method == "POST" and form.is_valid():
        updated = form.save(commit=False)
        if updated.platform_id and updated.platform.user_id != request.user.id: return HttpResponseBadRequest("Plataforma inválida.")
        if updated.channel_id and updated.channel.user_id != request.user.id: return HttpResponseBadRequest("Canal inválido.")
        updated.save(); messages.success(request, "Campanha atualizada."); return redirect("cpa:campaign_list")
    return render(request, "cpa/form_page.html", {"form": form, "page_title": "Editar campanha", "back_url": "cpa:campaign_list"})

@login_required
@require_POST
def campaign_delete(request, pk):
    obj = get_object_or_404(Campaign, pk=pk, user=request.user)
    obj.is_active = False
    obj.save(update_fields=["is_active", "updated_at"])
    messages.success(request, "Campanha arquivada. Os registros históricos foram preservados.")
    return redirect("cpa:campaign_list")

@login_required
def record_list(request):
    records = list(PerformanceRecord.objects.filter(user=request.user).select_related("campaign", "campaign__platform")[:300])
    for record in records:
        record.cpc = (record.spend / record.clicks).quantize(Decimal("0.01")) if record.clicks else None
        record.cpa = (record.spend / record.conversions).quantize(Decimal("0.01")) if record.conversions else None
    return render(request, "cpa/record_list.html", {"records": records, "count": PerformanceRecord.objects.filter(user=request.user).count()})

@login_required
def record_create(request):
    form = PerformanceRecordForm(request.POST or None, user=request.user)
    if request.method == "POST" and form.is_valid():
        obj = form.save(commit=False); obj.user = request.user
        if obj.campaign.user_id != request.user.id: return HttpResponseBadRequest("Campanha inválida.")
        obj.source = "manual"; obj.save(); messages.success(request, "Desempenho registrado."); return redirect("cpa:record_list")
    return render(request, "cpa/form_page.html", {"form": form, "page_title": "Novo registro de desempenho", "back_url": "cpa:record_list"})

@login_required
def record_edit(request, pk):
    obj = get_object_or_404(PerformanceRecord, pk=pk, user=request.user)
    form = PerformanceRecordForm(request.POST or None, instance=obj, user=request.user)
    if request.method == "POST" and form.is_valid():
        updated = form.save(commit=False)
        if updated.campaign.user_id != request.user.id: return HttpResponseBadRequest("Campanha inválida.")
        updated.save(); messages.success(request, "Registro atualizado."); return redirect("cpa:record_list")
    return render(request, "cpa/form_page.html", {"form": form, "page_title": "Editar registro", "back_url": "cpa:record_list"})

@login_required
@require_POST
def record_delete(request, pk):
    obj = get_object_or_404(PerformanceRecord, pk=pk, user=request.user); obj.delete()
    messages.success(request, "Registro removido."); return redirect("cpa:record_list")

@login_required
def import_view(request):
    if request.method == "POST" and request.POST.get("action") == "confirm":
        batch = get_object_or_404(ImportBatch, pk=request.POST.get("batch_id"), user=request.user, status="preview")
        imported = updated = ignored = errors = 0
        campaign_cache = {}
        platform_cache = {}
        channel_cache = {}

        with transaction.atomic():
            # Pré-carrega IDs externos em lotes para evitar uma consulta por linha.
            external_ids_by_source = {}
            campaign_names = set()
            for preview_row in batch.preview:
                if preview_row.get("errors"):
                    continue
                campaign_names.add(str(preview_row["campaign"]).strip())
                platform_name = str(preview_row.get("platform") or "").strip()
                channel_name = str(preview_row.get("channel") or "").strip()
                if platform_name:
                    key = platform_name.casefold()
                    if key not in platform_cache:
                        platform_cache[key] = imported_dimension(Platform, request.user, platform_name)
                if channel_name:
                    key = channel_name.casefold()
                    if key not in channel_cache:
                        channel_cache[key] = imported_dimension(Channel, request.user, channel_name)
                ext_id = str(preview_row.get("external_id") or "").strip()
                if ext_id:
                    source = "import:" + (slugify(platform_name or "generic") or "generic")[:65]
                    external_ids_by_source.setdefault(source, set()).add(ext_id)

            # Busca campanhas existentes por blocos de nomes (comparação case-insensitive),
            # evitando uma consulta individual para cada campanha nova no arquivo.
            unique_campaign_names = sorted(campaign_names, key=str.casefold)
            for offset in range(0, len(unique_campaign_names), 50):
                name_query = Q()
                for name in unique_campaign_names[offset:offset + 50]:
                    name_query |= Q(name__iexact=name)
                for existing_campaign in Campaign.objects.filter(
                    user=request.user
                ).filter(name_query).only("id", "name", "platform_id", "channel_id").order_by("id"):
                    key = (existing_campaign.name.casefold(), existing_campaign.platform_id, existing_campaign.channel_id)
                    campaign_cache.setdefault(key, existing_campaign)

            existing_records = {}
            for source, ids in external_ids_by_source.items():
                sorted_ids = sorted(ids)
                for offset in range(0, len(sorted_ids), 500):
                    chunk = sorted_ids[offset:offset + 500]
                    for existing in PerformanceRecord.objects.filter(
                        user=request.user, source=source, external_id__in=chunk
                    ).select_related("campaign"):
                        existing_records[(source, existing.external_id)] = existing

            for row in batch.preview:
                if row.get("errors"):
                    errors += 1; continue
                platform_name = str(row.get("platform") or "").strip()
                platform = platform_cache.get(platform_name.casefold()) if platform_name else None
                channel_name = str(row.get("channel") or "").strip()
                channel = channel_cache.get(channel_name.casefold()) if channel_name else None
                campaign_key = (str(row["campaign"]).casefold(), platform.pk if platform else None, channel.pk if channel else None)
                campaign = campaign_cache.get(campaign_key)
                if campaign is None:
                    # O pré-carregamento já consultou todas as campanhas dos nomes deste lote.
                    # Se a combinação exata não está no cache, cria uma vez e reutiliza nas linhas seguintes.
                    campaign = Campaign.objects.create(
                        user=request.user,
                        name=row["campaign"],
                        platform=platform,
                        channel=channel,
                        objective=row.get("objective") or "other",
                        conversion_label=row.get("conversion_label") or "Conversões",
                    )
                    campaign_cache[campaign_key] = campaign
                ext = str(row.get("external_id") or "").strip()
                source_key = "import:" + (slugify(str(row.get("platform") or "generic")) or "generic")[:65]
                record = existing_records.get((source_key, ext)) if ext else None
                values = {"campaign": campaign, "date": datetime.strptime(row["date"], "%Y-%m-%d").date(), "spend": Decimal(row["spend"]), "clicks": int(row["clicks"]), "conversions": int(row["conversions"]), "impressions": row.get("impressions"), "notes": "Importado via arquivo"}
                if record:
                    changed = any(getattr(record, key) != value for key, value in values.items())
                    if changed:
                        for key, value in values.items(): setattr(record, key, value)
                        record.save(); updated += 1
                    else: ignored += 1
                else:
                    new_record = PerformanceRecord.objects.create(user=request.user, source=source_key, external_id=ext, **values)
                    if ext:
                        # Mantém a semântica de reimportação mesmo se o mesmo ID aparecer duas vezes no arquivo.
                        existing_records[(source_key, ext)] = new_record
                    imported += 1
            batch.rows_imported=imported; batch.rows_updated=updated; batch.rows_ignored=ignored; batch.rows_error=errors
            batch.status="confirmed"; batch.confirmed_at=timezone.now(); batch.save()
        messages.success(request, f"Importação concluída: {imported} novos, {updated} atualizados, {ignored} sem alteração e {errors} com erro.")
        return redirect("cpa:import_data")
    form = ImportUploadForm()
    batch = None
    if request.method == "POST" and request.POST.get("action") == "analyze":
        form = ImportUploadForm(request.POST, request.FILES)
        if form.is_valid():
            file = form.cleaned_data["file"]
            if file.size > 10 * 1024 * 1024:
                messages.error(request, "O limite de tamanho é 10 MB.")
            else:
                try:
                    rows = read_rows(file)
                    batch = ImportBatch.objects.create(user=request.user, filename=file.name[:255], rows_total=len(rows), rows_error=sum(bool(r["errors"]) for r in rows), preview=json_safe_rows(rows))
                except Exception as exc: messages.error(request, str(exc))
    history = ImportBatch.objects.filter(user=request.user)[:10]
    return render(request, "cpa/import.html", {"form": form, "batch": batch, "preview_rows": batch.preview[:30] if batch else [], "history": history})

@login_required
def export_csv(request):
    records = PerformanceRecord.objects.filter(user=request.user).select_related("campaign", "campaign__platform", "campaign__channel")
    response = HttpResponse(content_type="text/csv; charset=utf-8-sig")
    response["Content-Disposition"] = 'attachment; filename="cpa_desempenho.csv"'
    writer = csv.writer(response, delimiter=";")
    writer.writerow(["data", "campanha", "plataforma", "canal", "objetivo", "tipo_conversao", "gasto", "cliques", "conversoes", "impressoes", "fonte", "id_externo"])
    for r in records:
        writer.writerow([r.date.isoformat(), r.campaign.name, r.campaign.platform.name if r.campaign.platform else "", r.campaign.channel.name if r.campaign.channel else "", r.campaign.objective, r.campaign.conversion_label, str(r.spend).replace(".", ","), r.clicks, r.conversions, r.impressions if r.impressions is not None else "", r.source, r.external_id])
    return response

@login_required
def integration_settings(request):
    form = IntegrationTokenForm()
    new_token = None
    if request.method == "POST" and request.POST.get("action") == "create":
        form = IntegrationTokenForm(request.POST)
        if form.is_valid():
            raw_token = secrets.token_urlsafe(36)
            prefix = raw_token[:12]
            IntegrationToken.objects.create(user=request.user, name=form.cleaned_data["name"], prefix=prefix, token_hash=make_password(raw_token))
            new_token = raw_token
            form = IntegrationTokenForm()
            messages.success(request, "Chave criada. Copie-a agora: ela não será exibida novamente.")
    elif request.method == "POST" and request.POST.get("action") == "revoke":
        token = get_object_or_404(IntegrationToken, pk=request.POST.get("token_id"), user=request.user, revoked_at__isnull=True)
        token.revoked_at = timezone.now()
        token.save(update_fields=["revoked_at"])
        messages.success(request, "Chave revogada. As próximas chamadas com ela serão recusadas.")
        return redirect("cpa:integration_settings")
    tokens = IntegrationToken.objects.filter(user=request.user)
    response = render(request, "cpa/integration_settings.html", {"form": form, "tokens": tokens, "new_token": new_token})
    if new_token:
        response["Cache-Control"] = "no-store, max-age=0"
    return response


def api_user_from_request(request):
    authorization = request.headers.get("Authorization", "").strip()
    if authorization:
        scheme, _, raw_token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not raw_token:
            return None
        prefix = raw_token[:12]
        token = IntegrationToken.objects.select_related("user").filter(prefix=prefix, revoked_at__isnull=True).first()
        if token and check_password(raw_token, token.token_hash):
            IntegrationToken.objects.filter(pk=token.pk).update(last_used_at=timezone.now())
            return token.user
        return None
    if request.user.is_authenticated:
        return request.user
    return None


@require_GET
def api_metrics(request):
    api_user = api_user_from_request(request)
    if api_user is None:
        response = JsonResponse({"error": "Autenticação necessária. Use Authorization: Bearer <token>."}, status=401)
        response["Cache-Control"] = "private, no-store"
        response["WWW-Authenticate"] = "Bearer"
        return response

    today = timezone.localdate()
    try: start = datetime.strptime(request.GET.get("start", ""), "%Y-%m-%d").date() if request.GET.get("start") else today - timedelta(days=29)
    except ValueError: return JsonResponse({"error": "Parâmetro start inválido; use YYYY-MM-DD."}, status=400)
    try: end = datetime.strptime(request.GET.get("end", ""), "%Y-%m-%d").date() if request.GET.get("end") else today
    except ValueError: return JsonResponse({"error": "Parâmetro end inválido; use YYYY-MM-DD."}, status=400)
    if end < start: return JsonResponse({"error": "A data final deve ser igual ou posterior à data inicial."}, status=400)
    if (end - start).days > 3660: return JsonResponse({"error": "Intervalo máximo: 10 anos."}, status=400)
    data = build_dashboard_data(api_user, start, end)
    totals = data["totals"]
    money = lambda value: f"{value:.2f}" if value is not None else None
    daily_rows = [{**row, "spend": money(row["spend"]), "cpc": money(row["cpc"]), "cpa": money(row["cpa"])} for row in data["daily"]]
    campaign_rows = [
        {key: value for key, value in row.items() if key != "id"}
        for row in data["campaigns"]
    ]
    campaign_rows = [{**row, "spend": money(row["spend"]), "cpc": money(row["cpc"]), "cpa": money(row["cpa"])} for row in campaign_rows]
    payload = {"schema_version": "1.0", "currency": "BRL", "period": {"start": start.isoformat(), "end": end.isoformat()}, "totals": {"spend": str(totals["spend"]), "clicks": totals["clicks"], "conversions": totals["conversions"], "impressions": totals["impressions"], "cpc": str(totals["cpc"]) if totals["cpc"] is not None else None, "cpa": str(totals["cpa"]) if totals["cpa"] is not None else None, "conversion_rate_percent": str(totals["conversion_rate"]) if totals["conversion_rate"] is not None else None}, "daily": daily_rows, "campaigns": campaign_rows}
    response = JsonResponse(payload)
    response["Cache-Control"] = "private, no-store"
    return response
