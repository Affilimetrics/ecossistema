from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[2]

CHROME_DEBUGGER = "127.0.0.1:9222"

# =========================================================
# IDENTIDADE / LOGIN
# =========================================================

LOGIN_URL = "https://www.magazinevoce.com.br/login"

# Tempo máximo aguardando o usuário fazer login manualmente.
LOGIN_TIMEOUT = 300


# =========================================================
# LOJA
# =========================================================

# Fallback público; a execução autenticada sempre substitui este valor
# pela vitrine validada da sessão do usuário.
BASE_URL = "https://www.magazinevoce.com.br"


# =========================================================
# COLETA
# =========================================================

LIMITE_POR_CATEGORIA = 20

ARQUIVO_SAIDA = str(PROJECT_ROOT / "links_afiliados_magalu.xlsx")


# =========================================================
# CATEGORIAS
# =========================================================

CATEGORIAS_PRINCIPAIS = {
    "1": "cozinha",
    "2": "quarto",
    "3": "sala",
    "4": "banheiro",
    "5": "acessórios",
}