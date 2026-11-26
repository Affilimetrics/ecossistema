import hashlib
import hmac
from urllib.parse import parse_qsl, urlencode, urlsplit

import requests
from django.conf import settings


class MetaAPIError(RuntimeError):
    def __init__(self, message, code=None, subcode=None, fbtrace_id=None, http_status=None):
        super().__init__(message)
        self.code = code
        self.subcode = subcode
        self.fbtrace_id = fbtrace_id
        self.http_status = http_status


class MetaClient:
    """Cliente HTTP pequeno para a Graph/Marketing API da Meta."""

    def __init__(self, access_token: str, timeout: int = 25):
        if not access_token:
            raise ValueError("Access token não informado.")
        self.access_token = access_token
        self.timeout = timeout
        self.base_url = f"https://graph.facebook.com/{settings.META_API_VERSION.strip('/')}/"
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": "TrafegoPagoBase/0.1"})

    def _params(self, params=None):
        result = dict(params or {})
        result["access_token"] = self.access_token
        if settings.META_APPSECRET_PROOF and settings.META_APP_SECRET:
            result["appsecret_proof"] = hmac.new(
                settings.META_APP_SECRET.encode("utf-8"),
                self.access_token.encode("utf-8"),
                hashlib.sha256,
            ).hexdigest()
        return result

    def request(self, method: str, path: str, params=None, data=None):
        url = path if path.startswith("https://") else self.base_url + path.lstrip("/")
        try:
            response = self.session.request(
                method=method.upper(), url=url,
                params=self._params(params), data=data,
                timeout=self.timeout,
            )
        except requests.Timeout as exc:
            raise MetaAPIError("A Meta demorou para responder. Tente novamente.") from exc
        except requests.RequestException as exc:
            raise MetaAPIError("Não foi possível conectar à API da Meta.") from exc

        try:
            payload = response.json()
        except ValueError as exc:
            raise MetaAPIError("A Meta retornou uma resposta que não pôde ser interpretada.", http_status=response.status_code) from exc

        if not response.ok or "error" in payload:
            error = payload.get("error", {})
            message = error.get("error_user_msg") or error.get("message") or "A Meta recusou a solicitação."
            raise MetaAPIError(
                message=message,
                code=error.get("code"),
                subcode=error.get("error_subcode"),
                fbtrace_id=error.get("fbtrace_id"),
                http_status=response.status_code,
            )
        return payload

    def get_all(self, path: str, params=None, max_pages: int = 10):
        """Percorre páginas sem expor a URL de paginação/token em logs."""
        items = []
        payload = self.request("GET", path, params=params)
        items.extend(payload.get("data", []))
        pages = 1
        next_url = payload.get("paging", {}).get("next")
        while next_url and pages < max_pages:
            # Só seguimos paginação do host oficial. O token da URL recebida é
            # removido e reaplicado pela camada de autenticação deste cliente.
            parsed = urlsplit(next_url)
            if parsed.scheme != "https" or parsed.netloc != "graph.facebook.com":
                raise MetaAPIError("A Meta retornou um endereço de paginação inesperado.")
            page_params = {
                key: value for key, value in parse_qsl(parsed.query, keep_blank_values=True)
                if key not in {"access_token", "appsecret_proof"}
            }
            clean_url = f"https://graph.facebook.com{parsed.path}"
            payload = self.request("GET", clean_url, params=page_params)
            items.extend(payload.get("data", []))
            next_url = payload.get("paging", {}).get("next")
            pages += 1
        if next_url:
            raise MetaAPIError(
                "A Meta retornou mais páginas do que o limite seguro desta consulta. "
                "O sincronismo foi interrompido para preservar os dados já salvos."
            )
        return items

    def me(self):
        return self.request("GET", "me", {"fields": "id,name"})

    def permissions(self):
        return self.get_all("me/permissions", {"limit": 100})

    def businesses(self):
        return self.get_all("me/businesses", {"fields": "id,name", "limit": 100})

    def ad_accounts(self):
        return self.get_all(
            "me/adaccounts",
            {"fields": "id,name,account_status,currency,timezone_name,disable_reason", "limit": 100},
        )

    def pages(self):
        return self.get_all(
            "me/accounts",
            {"fields": "id,name,instagram_business_account{id,username}", "limit": 100},
        )

    def campaigns(self, ad_account_id: str):
        account_id = ad_account_id if ad_account_id.startswith("act_") else f"act_{ad_account_id}"
        return self.get_all(
            f"{account_id}/campaigns",
            {"fields": "id,name,objective,status,effective_status,daily_budget,lifetime_budget,created_time", "limit": 100},
            max_pages=100,
        )

    def insights(self, ad_account_id: str, date_preset: str = "last_30d"):
        account_id = ad_account_id if ad_account_id.startswith("act_") else f"act_{ad_account_id}"
        return self.request(
            "GET", f"{account_id}/insights",
            {
                "fields": "impressions,reach,clicks,spend,cpc,cpm,ctr,actions",
                "date_preset": date_preset,
                "level": "account",
            },
        ).get("data", [])


def build_oauth_url(state: str) -> str:
    if not settings.META_APP_ID or not settings.META_APP_SECRET:
        raise RuntimeError("Configure META_APP_ID e META_APP_SECRET no arquivo .env.")
    params = {
        "client_id": settings.META_APP_ID,
        "redirect_uri": settings.META_REDIRECT_URI,
        "state": state,
        "response_type": "code",
        "scope": ",".join(settings.META_SCOPES),
    }
    return "https://www.facebook.com/" + settings.META_API_VERSION + "/dialog/oauth?" + urlencode(params)


def exchange_code_for_token(code: str) -> dict:
    """Troca o código OAuth por token de usuário e tenta obter token de longa duração."""
    if not settings.META_APP_ID or not settings.META_APP_SECRET:
        raise RuntimeError("Configure META_APP_ID e META_APP_SECRET no arquivo .env.")

    base = f"https://graph.facebook.com/{settings.META_API_VERSION}/oauth/access_token"
    try:
        first = requests.get(base, params={
            "client_id": settings.META_APP_ID,
            "client_secret": settings.META_APP_SECRET,
            "redirect_uri": settings.META_REDIRECT_URI,
            "code": code,
        }, timeout=25)
        first.raise_for_status()
        token_data = first.json()
        short_token = token_data["access_token"]
    except (requests.RequestException, ValueError, KeyError) as exc:
        raise MetaAPIError("Não foi possível concluir a autenticação OAuth com a Meta.") from exc

    try:
        long_response = requests.get(base, params={
            "grant_type": "fb_exchange_token",
            "client_id": settings.META_APP_ID,
            "client_secret": settings.META_APP_SECRET,
            "fb_exchange_token": short_token,
        }, timeout=25)
        long_response.raise_for_status()
        long_data = long_response.json()
        return long_data if long_data.get("access_token") else token_data
    except (requests.RequestException, ValueError):
        # Não descartamos uma autenticação válida só porque a troca opcional falhou.
        return token_data
