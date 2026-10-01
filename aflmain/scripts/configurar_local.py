"""Prepara o .env para desenvolvimento local sem sobrescrever segredos existentes."""
from pathlib import Path
import secrets

BASE_DIR = Path(__file__).resolve().parent.parent
ENV = BASE_DIR / ".env"
EXAMPLE = BASE_DIR / ".env.example"


def gerar_chave():
    return secrets.token_urlsafe(50)


def carregar_linhas():
    if ENV.exists():
        return ENV.read_text(encoding="utf-8").splitlines()
    if EXAMPLE.exists():
        return EXAMPLE.read_text(encoding="utf-8").splitlines()
    return []


def garantir_valor(linhas, nome, gerador):
    prefixo = nome + "="
    for i, linha in enumerate(linhas):
        if linha.startswith(prefixo):
            valor = linha[len(prefixo):].strip()
            if not valor or valor == "change-me":
                linhas[i] = prefixo + gerador()
            return
    linhas.insert(0, prefixo + gerador())


linhas = carregar_linhas()
garantir_valor(linhas, "SECRET_KEY", gerar_chave)
garantir_valor(linhas, "CREDENTIAL_ENCRYPTION_KEY", gerar_chave)

# Garante configuração local mínima caso o .env ainda não tenha essas opções.
existentes = {l.split("=", 1)[0] for l in linhas if "=" in l and not l.lstrip().startswith("#")}
for nome, valor in (
    ("DEBUG", "True"),
    ("ALLOWED_HOSTS", "127.0.0.1,localhost"),
    ("TIME_ZONE", "America/Sao_Paulo"),
    ("DATABASE_URL", "sqlite:///db.sqlite3"),
):
    if nome not in existentes:
        linhas.append(f"{nome}={valor}")

ENV.write_text("\n".join(linhas).rstrip() + "\n", encoding="utf-8")
print("[OK] .env local pronto. Segredos existentes foram preservados.")
