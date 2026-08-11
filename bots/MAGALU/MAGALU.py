from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


# ============================================================
# CONFIGURAÇÃO
# ============================================================

CHROME_DEBUGGER = "127.0.0.1:9222"

MINHA_LOJA = "magazineblackriseco"

URL_LOJA = (
    f"https://www.magazinevoce.com.br/{MINHA_LOJA}/"
)


# ============================================================
# CONECTAR AO CHROME
# ============================================================

options = Options()

options.add_experimental_option(
    "debuggerAddress",
    CHROME_DEBUGGER
)

print("=" * 60)
print("             MAGALU - TESTE")
print("=" * 60)

print("\n[1] Conectando ao Chrome :9222...")

driver = webdriver.Chrome(options=options)

print("[OK] Chrome conectado.")
print("[OK] URL atual:", driver.current_url)


# ============================================================
# ABRIR A LOJA
# ============================================================

print("\n[2] Abrindo sua loja...")

driver.get(URL_LOJA)

print("[OK] Loja aberta:")
print(URL_LOJA)


# ============================================================
# ESCOLHA MANUAL DO PRODUTO
# ============================================================

print("\n" + "=" * 60)
print("Agora faça manualmente no Chrome:")
print("1. Pesquise um produto")
print("2. Abra o produto")
print("3. Aguarde a página carregar")
print("=" * 60)

input("\nQuando estiver na página do produto, pressione ENTER...")


# ============================================================
# PROCURAR BOTÃO GERAR LINK
# ============================================================

print("\n[3] Procurando botão 'Gerar link'...")

seletores = [
    "//button[contains(., 'Gerar link')]",
    "//div[contains(., 'Gerar link')]",
    "//*[contains(text(), 'Gerar link')]",
]

botao = None

for seletor in seletores:

    try:

        botao = WebDriverWait(
            driver,
            5
        ).until(
            EC.element_to_be_clickable(
                (By.XPATH, seletor)
            )
        )

        if botao:
            print("[OK] Botão 'Gerar link' encontrado.")
            break

    except Exception:
        pass


# ============================================================
# SE NÃO ENCONTROU
# ============================================================

if not botao:

    print("\n[ERRO] Não encontrei o botão 'Gerar link'.")

    print("\nURL atual:")
    print(driver.current_url)

    input("\nPressione ENTER para sair...")

    driver.quit()

    raise SystemExit


# ============================================================
# CLICAR
# ============================================================

print("[4] Clicando em 'Gerar link'...")

driver.execute_script(
    "arguments[0].click();",
    botao
)

print("[OK] Botão clicado.")


# ============================================================
# PEGAR LINK
# ============================================================

print("\n[5] Procurando o link gerado...")

seletores_link = [
    '[data-testid="copy-to-clipboard-input"]',
    'input[readonly]',
    'input[type="text"]'
]

link = None

for seletor in seletores_link:

    try:

        campo = WebDriverWait(
            driver,
            10
        ).until(
            EC.presence_of_element_located(
                (By.CSS_SELECTOR, seletor)
            )
        )

        valor = campo.get_attribute("value")

        if valor and "http" in valor:

            link = valor
            break

    except Exception:
        pass


# ============================================================
# RESULTADO
# ============================================================

print("\n" + "=" * 60)

if link:

    print("              LINK ENCONTRADO")
    print("=" * 60)

    print(link)

    print("=" * 60)

    if MINHA_LOJA.lower() in link.lower():

        print("[OK] Link pertence à sua loja:")
        print(MINHA_LOJA)

    else:

        print("[ATENÇÃO] O link não contém o identificador")
        print("esperado da sua loja.")

else:

    print("[ERRO] Não consegui capturar o link.")

print("=" * 60)

input("\nPressione ENTER para encerrar...")
