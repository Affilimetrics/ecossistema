import csv
import io
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from django.utils import timezone
from django.utils.text import slugify
from openpyxl import load_workbook
from ltv.models import Acquisition, AttributionHistory, Campaign, Channel, Commission, Marketplace, Product

ALIASES = {
    "external_id": {"id", "id_externo", "external_id", "commission_id", "pedido_id", "order_id", "transacao"},
    "amount": {"valor", "comissao", "comissão", "amount", "commission", "commission_amount", "valor_comissao"},
    "sale_date": {"data", "data_venda", "sale_date", "date", "created_at", "data_pedido"},
    "approved_at": {"data_aprovacao", "approved_at", "approval_date"},
    "status": {"status", "situacao", "situação", "commission_status"},
    "marketplace": {"marketplace", "origem", "plataforma"},
    "product": {"produto", "product", "item"},
    "campaign": {"campanha", "campaign"},
    "channel": {"canal", "channel", "origem_trafego"},
    "acquisition_external_id": {"aquisicao_id", "acquisition_id", "acquisition_external_id", "tracking_id", "referencia_aquisicao"},
    "attribution_evidence": {"evidencia", "attribution_evidence", "tracking_code"},
    "notes": {"observacoes", "observações", "notes", "descricao", "description"},
}

STATUS_MAP = {
    "aprovada": "approved", "aprovado": "approved", "approved": "approved", "confirmada": "approved",
    "pendente": "pending", "pending": "pending", "aguardando": "pending",
    "cancelada": "cancelled", "cancelado": "cancelled", "cancelled": "cancelled",
    "reembolsada": "refunded", "reembolsado": "refunded", "refunded": "refunded",
    "revertida": "reversed", "revertido": "reversed", "reversed": "reversed",
}


def _normal(value):
    return str(value or "").strip().lower().replace(" ", "_").replace("-", "_")


def _parse_money(raw):
    text = str(raw or "").strip().replace("R$", "").replace(" ", "")
    if not text:
        raise ValueError("valor ausente")
    if "," in text and "." in text:
        if text.rfind(",") > text.rfind("."):
            text = text.replace(".", "").replace(",", ".")
        else:
            text = text.replace(",", "")
    elif "," in text:
        text = text.replace(".", "").replace(",", ".")
    try:
        value = Decimal(text).quantize(Decimal("0.01"))
    except InvalidOperation as exc:
        raise ValueError("valor monetário inválido") from exc
    if not value.is_finite():
        raise ValueError("valor monetário precisa ser um número finito")
    if value < 0 or value > Decimal("999999999999.99"):
        raise ValueError("valor fora do limite permitido (0 a 999.999.999.999,99)")
    return value


def _parse_date(raw, default_now=False):
    if raw in (None, ""):
        return timezone.now() if default_now else None
    if isinstance(raw, datetime):
        value = raw
    elif isinstance(raw, date):
        value = datetime.combine(raw, datetime.min.time())
    else:
        text = str(raw).strip()
        value = None
        for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M", "%Y-%m-%d", "%d/%m/%Y %H:%M", "%d/%m/%Y", "%d-%m-%Y"):
            try:
                value = datetime.strptime(text, fmt)
                break
            except ValueError:
                continue
        if value is None:
            try:
                value = datetime.fromisoformat(text.replace("Z", "+00:00"))
            except ValueError as exc:
                raise ValueError("data inválida; use DD/MM/AAAA ou AAAA-MM-DD") from exc
    if timezone.is_naive(value):
        value = timezone.make_aware(value, timezone.get_current_timezone())
    return value


def _read_rows(uploaded_file):
    filename = uploaded_file.name.lower()
    if filename.endswith(".xlsx"):
        workbook = load_workbook(uploaded_file, read_only=True, data_only=True)
        try:
            sheet = workbook.active
            iterator = sheet.iter_rows(values_only=True)
            headers = next(iterator, None)
            return list(headers or []), list(iterator)
        finally:
            workbook.close()
    raw = uploaded_file.read()
    text = None
    for encoding in ("utf-8-sig", "cp1252", "latin-1"):
        try:
            text = raw.decode(encoding)
            break
        except UnicodeDecodeError:
            continue
    if text is None:
        raise ValueError("Não foi possível interpretar a codificação do CSV.")
    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=";,\t")
    except csv.Error:
        dialect = csv.excel
    reader = csv.reader(io.StringIO(text), dialect)
    headers = next(reader, [])
    return headers, list(reader)


def preview_import(uploaded_file, max_rows=2000):
    headers, rows = _read_rows(uploaded_file)
    normalized_headers = [_normal(h) for h in headers]
    mapping = {}
    for field, aliases in ALIASES.items():
        for index, header in enumerate(normalized_headers):
            if header in aliases or header == _normal(field):
                mapping[field] = index
                break
    missing = [field for field in ("amount", "sale_date") if field not in mapping]
    if missing:
        raise ValueError("Não encontrei as colunas obrigatórias: valor da comissão e data da venda.")
    nonblank_count = sum(1 for row in rows if any(value not in (None, "") for value in row))
    if nonblank_count == 0:
        raise ValueError("O arquivo não contém registros abaixo do cabeçalho.")
    if nonblank_count > max_rows:
        raise ValueError(f"Arquivo com {nonblank_count} linhas. O limite por importação é {max_rows} registros.")

    preview = []
    for line_number, raw_row in enumerate(rows, start=2):
        if not any(value not in (None, "") for value in raw_row):
            continue
        raw = {key: (raw_row[index] if index < len(raw_row) else "") for key, index in mapping.items()}
        errors = []
        try:
            amount = _parse_money(raw.get("amount"))
            if amount < 0:
                raise ValueError("a comissão não pode ser negativa")
        except ValueError as exc:
            amount = None
            errors.append(str(exc))
        try:
            sale_date = _parse_date(raw.get("sale_date"), default_now=False)
            if sale_date is None:
                raise ValueError("data da venda ausente")
        except ValueError as exc:
            sale_date = None
            errors.append(str(exc))
        approved_at = None
        if raw.get("approved_at"):
            try:
                approved_at = _parse_date(raw.get("approved_at"))
            except ValueError as exc:
                errors.append(f"data de aprovação: {exc}")
        status_raw = _normal(raw.get("status", "pending"))
        status = STATUS_MAP.get(status_raw or "pending")
        if status is None:
            errors.append(f"status não reconhecido: {raw.get('status')}")
            status = "pending"

        text_limits = {
            "external_id": 180, "marketplace": 100, "product": 180,
            "campaign": 180, "channel": 100,
            "acquisition_external_id": 180, "attribution_evidence": 240,
        }
        for field, limit in text_limits.items():
            value = str(raw.get(field) or "").strip()
            if len(value) > limit:
                errors.append(f"campo {field} excede o limite de {limit} caracteres")

        row = {
            "line": line_number,
            "external_id": str(raw.get("external_id") or "").strip(),
            "amount": str(amount) if amount is not None else "",
            "sale_date": sale_date.isoformat() if sale_date else "",
            "approved_at": approved_at.isoformat() if approved_at else "",
            "status": status,
            "marketplace": str(raw.get("marketplace") or "").strip(),
            "product": str(raw.get("product") or "").strip(),
            "campaign": str(raw.get("campaign") or "").strip(),
            "channel": str(raw.get("channel") or "").strip(),
            "acquisition_external_id": str(raw.get("acquisition_external_id") or "").strip(),
            "attribution_evidence": str(raw.get("attribution_evidence") or "").strip(),
            "notes": str(raw.get("notes") or "").strip(),
            "errors": errors,
        }
        preview.append(row)
    return preview


def _unique_code(model, user, name, fallback):
    base = slugify(name)[:70] or fallback
    candidate = base
    suffix = 2
    while model.objects.filter(user=user, code=candidate).exists():
        candidate = f"{base[:70 - len(str(suffix)) - 1]}-{suffix}"
        suffix += 1
    return candidate


def _get_related(model, user, name, extra=None):
    if not name:
        return None
    extra = extra or {}

    # Match existing dimensions by their displayed name first. This prevents
    # repeated imports from creating duplicate products/campaigns and avoids
    # confusing two names that happen to produce the same slug.
    lookup = model.objects.filter(user=user, name__iexact=name)
    if model in (Product, Campaign):
        if "marketplace" in extra:
            lookup = lookup.filter(marketplace=extra["marketplace"])
        if model is Campaign and extra.get("channel"):
            lookup = lookup.filter(channel=extra["channel"])
    obj = lookup.first()
    if obj:
        return obj

    if model is Marketplace:
        return Marketplace.objects.create(user=user, name=name, code=_unique_code(Marketplace, user, name, "marketplace"))
    if model is Channel:
        return Channel.objects.create(user=user, name=name, code=_unique_code(Channel, user, name, "canal"))
    if model is Product:
        return Product.objects.create(user=user, name=name, **extra)
    if model is Campaign:
        return Campaign.objects.create(user=user, name=name, **extra)
    return None


def commit_import(batch, user):
    from django.db import transaction
    imported = updated = skipped = errors = 0
    with transaction.atomic():
        for row in batch.preview_json:
            if row.get("errors"):
                errors += 1
                continue
            source_market = row.get("marketplace") or "geral"
            source = f"import:{slugify(source_market)[:90]}"
            external_id = row.get("external_id", "")
            existing = Commission.objects.filter(user=user, source=source, external_id=external_id).first() if external_id else None
            marketplace = _get_related(Marketplace, user, row.get("marketplace"))
            product = _get_related(Product, user, row.get("product"), {"marketplace": marketplace})
            channel = _get_related(Channel, user, row.get("channel"))
            campaign = _get_related(Campaign, user, row.get("campaign"), {"marketplace": marketplace, "channel": channel})
            reference = row.get("acquisition_external_id")
            matched_acquisition = Acquisition.objects.filter(user=user, external_reference=reference).first() if reference else None
            sale_date = datetime.fromisoformat(row["sale_date"])
            approved_at = datetime.fromisoformat(row["approved_at"]) if row.get("approved_at") else None
            if row["status"] == "approved" and approved_at is None:
                approved_at = sale_date
            amount = Decimal(row["amount"])
            if existing:
                new_acquisition = matched_acquisition or existing.acquisition
                changed = any([
                    existing.amount != amount,
                    existing.sale_date != sale_date,
                    existing.status != row["status"],
                    existing.approved_at != approved_at,
                    bool(row.get("marketplace")) and existing.marketplace_id != getattr(marketplace, "pk", None),
                    bool(row.get("product")) and existing.product_id != getattr(product, "pk", None),
                    bool(row.get("campaign")) and existing.campaign_id != getattr(campaign, "pk", None),
                    bool(row.get("channel")) and existing.channel_id != getattr(channel, "pk", None),
                    bool(matched_acquisition) and existing.acquisition_id != matched_acquisition.pk,
                ])
                if not changed:
                    skipped += 1
                    continue
                previous_acquisition = existing.acquisition
                existing.amount = amount
                existing.sale_date = sale_date
                existing.status = row["status"]
                existing.approved_at = approved_at
                if marketplace: existing.marketplace = marketplace
                if product: existing.product = product
                if campaign: existing.campaign = campaign
                if channel: existing.channel = channel
                existing.acquisition = new_acquisition
                if row.get("attribution_evidence"):
                    existing.attribution_evidence = row["attribution_evidence"]
                if row.get("notes"):
                    existing.notes = row["notes"]
                existing.save()
                if previous_acquisition != existing.acquisition and existing.acquisition:
                    AttributionHistory.objects.create(
                        commission=existing, previous_acquisition=previous_acquisition,
                        new_acquisition=existing.acquisition, changed_by=user,
                        reason=row.get("attribution_evidence") or "Vínculo por correspondência exata da referência externa de aquisição."
                    )
                updated += 1
                continue

            commission = Commission.objects.create(
                user=user, external_id=external_id, source=source, acquisition=matched_acquisition,
                marketplace=marketplace, product=product, campaign=campaign, channel=channel,
                amount=amount, sale_date=sale_date, approved_at=approved_at,
                status=row["status"], attribution_evidence=row.get("attribution_evidence", ""), notes=row.get("notes", "")
            )
            if matched_acquisition:
                AttributionHistory.objects.create(
                    commission=commission, new_acquisition=matched_acquisition, changed_by=user,
                    reason=row.get("attribution_evidence") or "Vínculo por correspondência exata da referência externa de aquisição."
                )
            imported += 1
        batch.imported_rows = imported
        batch.updated_rows = updated
        batch.skipped_rows = skipped
        batch.error_rows = errors
        batch.status = "completed"
        batch.summary = f"{imported} importada(s), {updated} atualizada(s), {skipped} sem alteração ignorada(s), {errors} linha(s) com erro."
        batch.save(update_fields=["imported_rows", "updated_rows", "skipped_rows", "error_rows", "status", "summary", "updated_at"])
    return {"imported": imported, "updated": updated, "skipped": skipped, "errors": errors}
