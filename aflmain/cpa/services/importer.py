import csv, io, re
import hashlib
from datetime import datetime, date
from decimal import Decimal, InvalidOperation
from openpyxl import load_workbook

ALIASES = {
    "date": ["data", "date", "dia", "data_referencia", "reference_date"],
    "campaign": ["campanha", "campaign", "nome_campanha", "campaign_name"],
    "platform": ["plataforma", "platform", "origem", "ad_platform"],
    "channel": ["canal", "channel", "placement"],
    "spend": ["gasto", "valor_gasto", "spend", "cost", "amount_spent", "investimento"],
    "clicks": ["cliques", "clicks", "link_clicks"],
    "conversions": ["conversoes", "conversões", "conversions", "results", "acoes"],
    "impressions": ["impressoes", "impressões", "impressions"],
    "external_id": ["id", "id_externo", "external_id", "row_id", "report_id"],
    "conversion_label": ["tipo_conversao", "tipo de conversao", "conversion_type", "conversion_label"],
    "objective": ["objetivo", "objective", "campaign_objective"],
}

def normalize_header(value):
    value = str(value or "").strip().lower()
    value = re.sub(r"[^a-z0-9áéíóúãõç]+", "_", value)
    return value.strip("_")

def parse_decimal(value):
    if isinstance(value, (int, float, Decimal)) and not isinstance(value, bool):
        try:
            numeric = Decimal(str(value))
            if not numeric.is_finite() or numeric < 0:
                raise ValueError("O gasto deve ser um número finito e não negativo.")
            return numeric.quantize(Decimal("0.01"))
        except InvalidOperation:
            raise ValueError(f"Valor monetário inválido: {value}")
    raw = str(value or "0").strip().replace("R$", "").replace(" ", "")
    if not raw: return Decimal("0")
    if "," in raw and "." in raw:
        if raw.rfind(",") > raw.rfind("."):
            raw = raw.replace(".", "").replace(",", ".")
        else:
            raw = raw.replace(",", "")
    elif "," in raw:
        raw = raw.replace(".", "").replace(",", ".")
    elif re.fullmatch(r"\d{1,3}(?:\.\d{3})+", raw):
        # No padrão brasileiro, um ponto seguido por grupos de três dígitos
        # representa separador de milhar (ex.: 1.234 -> 1234,00).
        raw = raw.replace(".", "")
    try:
        result = Decimal(raw)
        if result < 0: raise ValueError("O gasto não pode ser negativo.")
        return result.quantize(Decimal("0.01"))
    except InvalidOperation:
        raise ValueError(f"Valor monetário inválido: {value}")

def parse_date(value):
    if isinstance(value, datetime): return value.date()
    if isinstance(value, date): return value
    raw = str(value or "").strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try: return datetime.strptime(raw, fmt).date()
        except ValueError: pass
    raise ValueError(f"Data inválida: {value}")

def parse_int(value, field):
    if value in (None, ""): return 0
    if isinstance(value, (int,)):
        result = value
    elif isinstance(value, float) and value.is_integer():
        result = int(value)
    else:
        raw = str(value).strip().replace(" ", "")
        if not raw: return 0
        if any(sep in raw for sep in (".", ",")):
            if not re.fullmatch(r"\d{1,3}(?:[.,]\d{3})+", raw):
                raise ValueError(f"{field} deve ser um número inteiro.")
            raw = raw.replace(".", "").replace(",", "")
        try: result = int(raw)
        except ValueError: raise ValueError(f"{field} deve ser um número inteiro.")
    if result < 0: raise ValueError(f"{field} não pode ser negativo.")
    return result

def read_rows(uploaded_file):
    content = uploaded_file.read()
    filename = uploaded_file.name.lower()
    if filename.endswith(".xlsx"):
        wb = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
        try:
            ws = wb.active
            data = list(ws.iter_rows(values_only=True))
        finally:
            wb.close()
        if not data: return []
        headers = [normalize_header(x) for x in data[0]]
        raw_rows = [dict(zip(headers, row)) for row in data[1:]]
    elif filename.endswith(".csv"):
        decoded = None
        for enc in ("utf-8-sig", "cp1252", "latin-1"):
            try: decoded = content.decode(enc); break
            except UnicodeDecodeError: continue
        if decoded is None: raise ValueError("Não foi possível decodificar o CSV.")
        try: dialect = csv.Sniffer().sniff(decoded[:4096], delimiters=";,	")
        except csv.Error: dialect = csv.excel
        reader = csv.DictReader(io.StringIO(decoded), dialect=dialect)
        raw_rows = [{normalize_header(k): v for k, v in row.items()} for row in reader]
    else:
        raise ValueError("Formato não suportado. Envie CSV ou XLSX.")
    aliases = {key: {normalize_header(x) for x in vals} for key, vals in ALIASES.items()}
    output = []
    for idx, row in enumerate(raw_rows, start=2):
        if not any(v not in (None, "") for v in row.values()): continue
        normalized = {}
        for key, names in aliases.items():
            found = next((row.get(alias) for alias in names if alias in row and row.get(alias) not in (None, "")), None)
            normalized[key] = found
        errors = []
        try:
            required = {"date": "Data", "campaign": "Campanha", "spend": "Gasto", "clicks": "Cliques", "conversions": "Conversões"}
            missing = [label for key, label in required.items() if normalized.get(key) in (None, "")]
            if missing: raise ValueError("Campos obrigatórios ausentes: " + ", ".join(missing) + ".")
            normalized["campaign"] = str(normalized["campaign"]).strip()
            if not normalized["campaign"]:
                raise ValueError("O nome da campanha não pode ficar vazio.")
            if len(normalized["campaign"]) > 160:
                raise ValueError("O nome da campanha excede 160 caracteres.")
            for field, label in (("platform", "Plataforma"), ("channel", "Canal")):
                if normalized.get(field) not in (None, "") and len(str(normalized[field]).strip()) > 100:
                    raise ValueError(f"{label} excede 100 caracteres.")
            if normalized.get("external_id") not in (None, "") and len(str(normalized["external_id"]).strip()) > 140:
                raise ValueError("O ID externo excede 140 caracteres.")
            if normalized.get("conversion_label") not in (None, "") and len(str(normalized["conversion_label"]).strip()) > 60:
                raise ValueError("O rótulo de conversão excede 60 caracteres.")
            normalized["date"] = parse_date(normalized["date"])
            normalized["spend"] = parse_decimal(normalized["spend"])
            if normalized["spend"] > Decimal("999999999999.99"):
                raise ValueError("O gasto excede o limite suportado de R$ 999.999.999.999,99.")
            normalized["clicks"] = parse_int(normalized["clicks"], "Cliques")
            normalized["conversions"] = parse_int(normalized["conversions"], "Conversões")
            if normalized["clicks"] > 2147483647 or normalized["conversions"] > 2147483647:
                raise ValueError("Cliques e conversões devem ser menores ou iguais a 2.147.483.647.")
            normalized["impressions"] = parse_int(normalized["impressions"], "Impressões") if normalized["impressions"] not in (None, "") else None
            if normalized["impressions"] is not None and normalized["impressions"] > 2147483647:
                raise ValueError("Impressões devem ser menores ou iguais a 2.147.483.647.")
            objective_raw = normalize_header(normalized.get("objective") or "other")
            objective_map = {
                "purchase": "purchase", "compra": "purchase", "compras": "purchase",
                "lead": "lead", "leads": "lead",
                "signup": "signup", "cadastro": "signup", "cadastros": "signup",
                "click": "click", "clique": "click", "clique_qualificado": "click",
                "other": "other", "outro": "other", "outra": "other", "outra_conversao": "other",
            }
            if objective_raw not in objective_map:
                raise ValueError("Objetivo inválido. Use purchase, lead, signup, click ou other.")
            normalized["objective"] = objective_map[objective_raw]
        except (ValueError, TypeError) as exc:
            errors.append(str(exc))
        normalized["row_number"] = idx
        normalized["errors"] = errors
        output.append(normalized)
    if not output: raise ValueError("O arquivo não contém linhas de dados.")
    if len(output) > 2000: raise ValueError("O limite é de 2.000 linhas por arquivo.")
    return output

def json_safe_rows(rows):
    safe = []
    for row in rows:
        item = dict(row)
        value = item.get("date")
        if isinstance(value, (datetime, date)):
            item["date"] = value.isoformat()
        elif value is not None:
            # Mantém o texto inválido na prévia para que o erro seja exibido
            # na linha, sem interromper a análise do arquivo inteiro.
            item["date"] = str(value)
        if item.get("spend") is not None:
            item["spend"] = str(item["spend"])
        safe.append(item)
    return safe


def imported_dimension(model, user, raw_name):
    """Resolve uma dimensão pelo nome e gera código estável sem colisões comuns."""
    name = str(raw_name or "").strip()[:100]
    existing = model.objects.filter(user=user, name__iexact=name).first()
    if existing:
        return existing
    base = re.sub(r"[^a-z0-9-]+", "-", name.lower()).strip("-") or "item"
    digest = hashlib.sha256(name.casefold().encode("utf-8")).hexdigest()[:8]
    code = f"imp-{base[:26]}-{digest}"[:40]
    dimension, _ = model.objects.get_or_create(
        user=user,
        code=code,
        defaults={"name": name},
    )
    return dimension
