from __future__ import annotations

from urllib.parse import urlparse
import requests


class APIError(RuntimeError):
    pass


class APIClient:
    def __init__(self, base_url: str, token: str | None = None, timeout: int = 12):
        self.base_url = base_url.rstrip("/")
        self.token = token
        self.timeout = timeout
        parsed = urlparse(self.base_url)
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise APIError("Informe uma URL válida, incluindo http:// ou https://.")
        local_hosts = {"localhost", "127.0.0.1", "::1"}
        if parsed.scheme != "https" and parsed.hostname not in local_hosts:
            raise APIError("Por segurança, URLs remotas precisam usar HTTPS.")

    def request(self, method: str, path: str, *, json_data=None, params=None):
        headers = {"Accept": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        try:
            response = requests.request(
                method,
                f"{self.base_url}{path}",
                json=json_data,
                params=params,
                headers=headers,
                timeout=self.timeout,
            )
        except requests.RequestException as exc:
            raise APIError(f"Não foi possível conectar ao Skallora: {exc}") from exc
        try:
            data = response.json()
        except ValueError as exc:
            raise APIError(f"O servidor respondeu com conteúdo inválido (HTTP {response.status_code}).") from exc
        if not response.ok or data.get("sucesso") is False:
            message = data.get("erro") or data.get("detail") or f"Falha HTTP {response.status_code}"
            raise APIError(str(message))
        return data

    def login(self, username: str, password: str):
        data = self.request("POST", "/api/desktop/login/", json_data={"username": username, "password": password})
        self.token = data["token"]
        return data

    def get(self, path: str, params=None):
        return self.request("GET", path, params=params)

    def post(self, path: str, payload=None):
        return self.request("POST", path, json_data=payload or {})
