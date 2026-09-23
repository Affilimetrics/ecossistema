from __future__ import annotations
<<<<<<< HEAD
import base64, hashlib
from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.db import models
LEGACY_PREFIX="enc::"
CURRENT_PREFIX="enc2::"
def _f(v): return Fernet(base64.urlsafe_b64encode(hashlib.sha256(v.encode()).digest()))
def _credential_fernet():
    key=str(getattr(settings,"CREDENTIAL_ENCRYPTION_KEY","") or "").strip()
    if not key: raise ImproperlyConfigured("CREDENTIAL_ENCRYPTION_KEY não configurada no .env.")
    return _f(key)
def _legacy_fernet(): return _f(settings.SECRET_KEY)
class EncryptedTextField(models.TextField):
    prefix=CURRENT_PREFIX
    def _decrypt(self,value):
        if value in (None,""): return value
        value=str(value)
        try:
            if value.startswith(CURRENT_PREFIX): return _credential_fernet().decrypt(value[len(CURRENT_PREFIX):].encode()).decode()
            if value.startswith(LEGACY_PREFIX): return _legacy_fernet().decrypt(value[len(LEGACY_PREFIX):].encode()).decode()
            return value
        except (InvalidToken,ValueError,TypeError,ImproperlyConfigured): return ""
    def from_db_value(self,value,expression,connection): return self._decrypt(value)
    def to_python(self,value): return self._decrypt(value)
    def get_prep_value(self,value):
        value=super().get_prep_value(value)
        if value in (None,""): return value
        value=str(value)
        if value.startswith(CURRENT_PREFIX): return value
        if value.startswith(LEGACY_PREFIX):
            value=self._decrypt(value)
            if not value: return ""
        return CURRENT_PREFIX+_credential_fernet().encrypt(value.encode()).decode()
=======

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
>>>>>>> origin/main
