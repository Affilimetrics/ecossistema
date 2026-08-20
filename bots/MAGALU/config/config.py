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

# Usada apenas como referência/teste durante a fase atual.
# O bot NÃO deve depender dela para descobrir a conta.
MINHA_LOJA = "magazineblackriseco"

BASE_URL = f"https://www.magazinevoce.com.br/{MINHA_LOJA}"


# =========================================================
# COLETA
# =========================================================

LIMITE_POR_CATEGORIA = 20

ARQUIVO_SAIDA = "links_afiliados_magalu.xlsx"


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