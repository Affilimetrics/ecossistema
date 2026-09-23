from __future__ import annotations

import base64
import hashlib
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.db import models


def _fernet():
    digest = hashlib.sha256(settings.SECRET_KEY.encode("utf-8")).digest()
    return Fernet(base64.urlsafe_b64encode(digest))


class EncryptedTextField(models.TextField):
    """Campo simples criptografado em repouso usando a SECRET_KEY do Django.

    Valores legados em texto puro continuam legíveis e serão criptografados no
    próximo save. Trocar SECRET_KEY sem migrar os dados torna os segredos antigos
    indisponíveis, como esperado para criptografia baseada na chave da aplicação.
    """

    prefix = "enc::"

    def _decrypt(self, value):
        if value in (None, ""):
            return value
        value = str(value)
        if not value.startswith(self.prefix):
            return value
        try:
            token = value[len(self.prefix):].encode("utf-8")
            return _fernet().decrypt(token).decode("utf-8")
        except (InvalidToken, ValueError, TypeError):
            return ""

    def from_db_value(self, value, expression, connection):
        return self._decrypt(value)

    def to_python(self, value):
        return self._decrypt(value)

    def get_prep_value(self, value):
        value = super().get_prep_value(value)
        if value in (None, ""):
            return value
        value = str(value)
        if value.startswith(self.prefix):
            return value
        encrypted = _fernet().encrypt(value.encode("utf-8")).decode("utf-8")
        return self.prefix + encrypted
