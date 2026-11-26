from __future__ import annotations

from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
import re
from urllib.parse import urlsplit

import requests
from django.conf import settings
from django.db import transaction
from django.db.models import Q
from django.utils import timezone

from core.models import Afiliado, Produto

from .models import MarketplaceItem, MercadoLivreSettings, SearchRun


class MercadoLivreAPIError(RuntimeError):
    """Falha tratável na comunicação com a API do Mercado Livre."""


class MercadoLivreAPI:
    BASE_URL = "https://api.mercadolibre.com"
    USER_AGENT = "SkalloraAffiliateManager/1.0 (Django)"
    ALLOWED_HOSTS = ("mercadolivre.com.br", "mercadolibre.com", "meli.la")

    def __init__(self, user_settings: MercadoLivreSettings | None = None):
        self.user_settings = user_settings
        self.site_id = (getattr(user_settings, "site_id", "") or getattr(settings, "ML_SITE_ID", "MLB")).strip().upper()
        self.access_token = (getattr(user_settings, "access_token", "") or getattr(settings, "ML_ACCESS_TOKEN", "")).strip()
        try:
            configured_timeout = int(getattr(user_settings, "request_timeout", 0) or getattr(settings, "ML_REQUEST_TIMEOUT", 20))
        except (TypeError, ValueError):
            configured_timeout = 20
        self.timeout = min(max(configured_timeout, 5), 60)

    @classmethod
    def valid_marketplace_url(cls, value: str) -> bool:
        try:
            parsed = urlsplit(value or "")
            host = (parsed.hostname or "").lower()
        except ValueError:
            return False
        host_valid = any(host == domain or host.endswith("." + domain) for domain in cls.ALLOWED_HOSTS)
        return parsed.scheme in {"http", "https"} and host_valid

    def search(self, query: str, limit: int = 10) -> list[dict]:
        query = (query or "").strip()
        if not query:
            raise ValueError("O termo de busca não pode ficar vazio.")
        limit = min(max(int(limit), 1), 50)
        if not re.fullmatch(r"[A-Z]{2,8}", self.site_id):
            raise MercadoLivreAPIError("Código de site inválido. Use, por exemplo, MLB.")

        headers = {"Accept": "application/json", "User-Agent": self.USER_AGENT}
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"
        try:
            response = requests.get(
                f"{self.BASE_URL}/sites/{self.site_id}/search",
                params={"q": query, "limit": limit},
                headers=headers,
                timeout=self.timeout,
            )
        except requests.Timeout as exc:
            raise MercadoLivreAPIError("A API demorou para responder. Tente novamente.") from exc
        except requests.RequestException as exc:
            raise MercadoLivreAPIError(f"Falha de conexão ({exc.__class__.__name__}). Verifique sua internet.") from exc

        if response.status_code in (401, 403):
            raise MercadoLivreAPIError(
                f"HTTP {response.status_code}: acesso recusado. Confira o Access Token e as permissões da aplicação."
            )
        if response.status_code == 429:
            raise MercadoLivreAPIError("HTTP 429: limite de requisições atingido. Aguarde antes de pesquisar novamente.")
        if not response.ok:
            detail = (response.text or "")[:250].replace("\n", " ")
            raise MercadoLivreAPIError(f"HTTP {response.status_code}: {detail}")
        try:
            payload = response.json()
        except ValueError as exc:
            raise MercadoLivreAPIError("A API retornou JSON inválido.") from exc
        results = payload.get("results", []) if isinstance(payload, dict) else None
        if not isinstance(results, list):
            raise MercadoLivreAPIError("Formato inesperado na resposta da API.")
        return results[:limit]


def _to_decimal(value):
    if value in (None, ""):
        return None
    try:
        result = Decimal(str(value))
        if not result.is_finite() or result < 0 or result > Decimal("9999999999.99"):
            return None
        return result.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError, TypeError):
        return None


def normalize_product(raw: dict) -> dict | None:
    if not isinstance(raw, dict):
        return None
    external_id = str(raw.get("id") or "").strip()[:64]
    original_url = str(raw.get("permalink") or "").strip()
    if not external_id or len(original_url) > 2000 or not MercadoLivreAPI.valid_marketplace_url(original_url):
        return None
    current = _to_decimal(raw.get("price"))
    original = _to_decimal(raw.get("original_price"))
    discount = None
    if current is not None and original is not None and original > current > 0:
        discount = ((original - current) / original * Decimal("100")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
    return {
        "external_id": external_id,
        "title": str(raw.get("title") or "Título não informado")[:500],
        "current_price": current,
        "original_price": original,
        "discount_percent": discount,
        "original_url": original_url,
        "image_url": str(raw.get("thumbnail") or "")[:3000],
    }


@transaction.atomic
def persist_search_results(user, query: str, requested_limit: int, raw_products: list[dict]) -> SearchRun:
    normalized_by_id = {}
    for raw in raw_products:
        item = normalize_product(raw)
        if item:
            normalized_by_id[item["external_id"]] = item
    # Uma API pode repetir URLs sob IDs distintos; Produto possui chave única
    # por usuário/URL, então removemos esses duplicados antes da transação.
    normalized = []
    seen_urls = set()
    for item in normalized_by_id.values():
        if item["original_url"] in seen_urls:
            continue
        seen_urls.add(item["original_url"])
        normalized.append(item)
    search = SearchRun.objects.create(
        user=user,
        query=query[:180],
        requested_limit=requested_limit,
        status="EMPTY" if not normalized else "SUCCESS",
        returned_count=len(normalized),
    )
    if not normalized:
        return search

    ids = [item["external_id"] for item in normalized]
    urls = [item["original_url"] for item in normalized]
    existing = MarketplaceItem.objects.filter(user=user).filter(
        Q(external_id__in=ids) | Q(original_url__in=urls)
    ).select_related("product", "product__afiliado")
    by_id = {item.external_id: item for item in existing}
    by_url = {item.original_url: item for item in existing}
    # Carrega em lote produtos pré-existentes que ainda não tenham MarketplaceItem.
    catalog_products = (
        Produto.objects.filter(owner=user, url_produto__in=urls)
        .select_related("afiliado")
    )
    products_by_url = {product.url_produto: product for product in catalog_products}

    linked_count = 0
    for item_data in normalized:
        existing_item = by_id.get(item_data["external_id"]) or by_url.get(item_data["original_url"])
        product = existing_item.product if existing_item else products_by_url.get(item_data["original_url"])
        product_was_existing = product is not None
        defaults = {
            "marketplace": "MERCADO_LIVRE",
            "categoria": f"ML: {query}"[:120],
            "nome": item_data["title"],
            "preco_atual": item_data["current_price"],
            "preco_anterior": item_data["original_price"],
            "imagem_url": item_data["image_url"],
        }
        if product:
            # Reutiliza o mesmo Produto quando o anúncio já foi encontrado antes.
            for field, value in defaults.items():
                setattr(product, field, value)
            product.url_produto = item_data["original_url"]
            product.save()
        else:
            product = Produto.objects.create(
                owner=user,
                url_produto=item_data["original_url"],
                **defaults,
            )

        # A identidade primária é o ID do anúncio; a URL também serve como fallback
        # para anúncios que mudam de ID/URL entre consultas.
        ml_item = existing_item
        if ml_item is None:
            ml_item = MarketplaceItem.objects.create(
                user=user,
                product=product,
                external_id=item_data["external_id"],
                original_url=item_data["original_url"],
            )
        else:
            ml_item.product = product
            ml_item.external_id = item_data["external_id"]
            ml_item.original_url = item_data["original_url"]
            ml_item.save(update_fields=["product", "external_id", "original_url", "updated_at"])
        if ml_item.affiliate_url:
            affiliate = None
            if product_was_existing:
                try:
                    affiliate = product.afiliado  # select_related no carregamento em lote
                except Afiliado.DoesNotExist:
                    affiliate = None
            if affiliate is None:
                Afiliado.objects.create(
                    produto=product, link_afiliado=ml_item.affiliate_url, status="OK"
                )
            else:
                affiliate.link_afiliado = ml_item.affiliate_url
                affiliate.status = "OK"
                affiliate.save(update_fields=["link_afiliado", "status", "atualizado_em"])
            linked_count += 1
        elif product_was_existing:
            # Não apaga um link válido anteriormente configurado.
            try:
                existing_affiliate_url = product.afiliado.link_afiliado
            except Afiliado.DoesNotExist:
                existing_affiliate_url = ""
            if existing_affiliate_url:
                ml_item.affiliate_url = existing_affiliate_url
                ml_item.save(update_fields=["affiliate_url", "updated_at"])
                linked_count += 1
    search.affiliate_count = linked_count
    search.save(update_fields=["affiliate_count"])
    return search


def save_affiliate_link(user, item: MarketplaceItem, affiliate_url: str):
    if item.user_id != user.pk or item.product.owner_id != user.pk:
        raise PermissionError("Este produto não pertence ao usuário autenticado.")
    try:
        parsed = urlsplit(affiliate_url) if affiliate_url else None
    except ValueError as exc:
        raise ValueError("O link de afiliado precisa ser uma URL HTTP ou HTTPS válida.") from exc
    if affiliate_url and (
        len(affiliate_url) > 3000
        or parsed.scheme not in {"https", "http"}
        or not parsed.netloc
    ):
        raise ValueError("O link de afiliado precisa ser uma URL HTTP ou HTTPS válida de até 3.000 caracteres.")
    with transaction.atomic():
        item.affiliate_url = affiliate_url
        item.save(update_fields=["affiliate_url", "updated_at"])
        Afiliado.objects.update_or_create(
            produto=item.product,
            defaults={
                "link_afiliado": affiliate_url or None,
                "status": "OK" if affiliate_url else "REVISAR",
            },
        )
    return item


def apply_affiliate_mapping(user, mapping: dict[str, str]) -> dict[str, int]:
    """Aplica mapeamentos oficiais por ID externo ou URL original, isolados por usuário."""
    valid_mapping = {}
    invalid_count = 0
    for raw_key, raw_url in mapping.items():
        key = str(raw_key or "").strip()
        affiliate_url = str(raw_url or "").strip()
        try:
            parsed = urlsplit(affiliate_url)
        except ValueError:
            invalid_count += 1
            continue
        if not key or len(affiliate_url) > 3000 or parsed.scheme not in {"http", "https"} or not parsed.netloc:
            invalid_count += 1
            continue
        valid_mapping[key] = affiliate_url

    if not valid_mapping:
        return {"updated": 0, "unknown": 0, "invalid": invalid_count}

    keys = list(valid_mapping)
    matches = list(
        MarketplaceItem.objects.filter(user=user)
        .filter(Q(external_id__in=keys) | Q(original_url__in=keys))
        .select_related("product")
    )
    updated_items = {}
    matched_keys = set()
    unknown_count = 0
    with transaction.atomic():
        # Segue a regra do resolver original: quando ID e URL estão presentes,
        # o mapeamento por ID tem prioridade sobre o mapeamento por URL.
        for item in matches:
            affiliate_url = valid_mapping.get(item.external_id) or valid_mapping.get(item.original_url)
            if not affiliate_url:
                continue
            if item.external_id in valid_mapping:
                matched_keys.add(item.external_id)
            if item.original_url in valid_mapping:
                matched_keys.add(item.original_url)
            if item.user_id != user.pk or item.product.owner_id != user.pk:
                # Defesa em profundidade: o queryset já restringe por usuário.
                continue
            item.affiliate_url = affiliate_url
            item.updated_at = timezone.now()
            updated_items[item.pk] = item

        unknown_count = sum(1 for key in valid_mapping if key not in matched_keys)
        if updated_items:
            items_to_update = list(updated_items.values())
            MarketplaceItem.objects.bulk_update(items_to_update, ["affiliate_url", "updated_at"])

            product_ids = [item.product_id for item in items_to_update]
            affiliate_by_product = {
                affiliate.produto_id: affiliate
                for affiliate in Afiliado.objects.filter(produto_id__in=product_ids)
            }
            affiliates_to_create = []
            affiliates_to_update = []
            now = timezone.now()
            for item in items_to_update:
                affiliate = affiliate_by_product.get(item.product_id)
                if affiliate is None:
                    affiliates_to_create.append(Afiliado(
                        produto=item.product,
                        link_afiliado=item.affiliate_url,
                        status="OK",
                    ))
                else:
                    affiliate.link_afiliado = item.affiliate_url
                    affiliate.status = "OK"
                    affiliate.atualizado_em = now
                    affiliates_to_update.append(affiliate)
            if affiliates_to_update:
                Afiliado.objects.bulk_update(
                    affiliates_to_update, ["link_afiliado", "status", "atualizado_em"]
                )
            if affiliates_to_create:
                Afiliado.objects.bulk_create(affiliates_to_create)

    return {"updated": len(updated_items), "unknown": unknown_count, "invalid": invalid_count}
