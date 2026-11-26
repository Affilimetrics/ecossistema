from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings


class TokenEncryptionError(RuntimeError):
    """Erro quando não é possível proteger um token antes de persistir."""


def _fernet() -> Fernet:
    key = settings.TOKEN_ENCRYPTION_KEY
    if not key or key == "COLE_A_CHAVE_FERNET_AQUI":
        raise TokenEncryptionError(
            "Configure TOKEN_ENCRYPTION_KEY no arquivo .env antes de conectar a Meta."
        )
    try:
        return Fernet(key.encode("utf-8"))
    except (ValueError, TypeError) as exc:
        raise TokenEncryptionError("TOKEN_ENCRYPTION_KEY não é uma chave Fernet válida.") from exc


def encrypt_token(token: str) -> str:
    if not token:
        raise TokenEncryptionError("Token vazio não pode ser armazenado.")
    return _fernet().encrypt(token.encode("utf-8")).decode("utf-8")


def decrypt_token(encrypted_token: str) -> str:
    try:
        return _fernet().decrypt(encrypted_token.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        raise TokenEncryptionError("Não foi possível descriptografar o token salvo.") from exc
