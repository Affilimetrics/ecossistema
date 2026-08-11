import time
import random
import urllib.parse

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from openpyxl import Workbook


# ============================================================
# CONFIGURAÇÃO
# ============================================================

CHROME_DEBUGGER = "127.0.0.1:9222"

MINHA_LOJA = "magazineblackriseco"

BASE_URL = f"https://www.magazinevoce.com.br/{MINHA_LOJA}"

CATEGORIAS = [
    "acessórios",
    "cozinha",
    "banheiro",
    "sala de estar",
    "eletrodomesticos",
]

LIMITE_POR_CATEGORIA = 20

ARQUIVO_SAIDA = "links_afiliados_magalu.xlsx"


# ============================================================
# CONECTAR AO CHROME
# ============================================================

print("=" * 70)
print("        MAGALU - COLETOR DE LINKS DE AFILIADO")
print("=" * 70)

options = Options()
options.add_experimental_option("debuggerAddress", CHROME_DEBUGGER)

driver = webdriver.Chrome(options=options)

wait = WebDriverWait(driver, 15)

print("[OK] Chrome conectado.")
print("[INFO] Página atual:")
print(driver.current_url)


# ============================================================
# ABRIR VITRINE
# ============================================================

print("\n[1] Abrindo sua vitrine...")

driver.get(BASE_URL)

time.sleep(3)

print("[OK] Vitrine aberta.")


# ============================================================
# FUNÇÃO: ROLAGEM
# ============================================================

def rolar_pagina(driver, passos=7):

    altura_anterior = 0

    for _ in range(passos):

        altura = driver.execute_script(
            "return document.body.scrollHeight"
        )

        driver.execute_script(
            "window.scrollTo(0, arguments[0]);",
            altura
        )

        time.sleep(random.uniform(0.8, 1.4))

        # Se a página não aumentou, provavelmente já carregou tudo
        if altura == altura_anterior:
            break

        altura_anterior = altura


# ============================================================
# FUNÇÃO: COLETAR PRODUTOS DA CATEGORIA
# ============================================================

def coletar_produtos_categoria(categoria):

    print("\n" + "-" * 70)
    print(f"COLETANDO PRODUTOS: {categoria.upper()}")
    print("-" * 70)

    categoria_url = urllib.parse.quote(
        categoria,
        safe=""
    )

    url = f"{BASE_URL}/busca/{categoria_url}/"

    print("[INFO] Abrindo:")
    print(url)

    driver.get(url)

    time.sleep(random.uniform(3, 4))

    # Rola para carregar produtos
    rolar_pagina(driver)

    links = []
    links_set = set()

    elementos = driver.find_elements(
        By.CSS_SELECTOR,
        "a[href*='/p/']"
    )

    print(f"[INFO] Elementos encontrados: {len(elementos)}")

    for elemento in elementos:

        try:

            link = elemento.get_attribute("href")

            if not link:
                continue

            if "/p/" not in link:
                continue

            # Remove possíveis parâmetros desnecessários
            link = link.split("?")[0]

            if link not in links_set:

                links_set.add(link)
                links.append(link)

            if len(links) >= LIMITE_POR_CATEGORIA:
                break

        except Exception:
            continue

    print(
        f"[OK] {len(links)} produtos encontrados "
        f"para '{categoria}'."
    )

    return links


# ============================================================
# FUNÇÃO: GERAR LINK DE AFILIADO
# ============================================================

def gerar_link_afiliado(url_produto):

    print("\n" + "-" * 70)
    print("ABRINDO PRODUTO")
    print("-" * 70)

    print(url_produto)

    driver.get(url_produto)

    # Aguarda a página carregar
    time.sleep(random.uniform(2.5, 4))

    try:

        # ----------------------------------------------------
        # LOCALIZA O BOTÃO "GERAR LINK"
        # ----------------------------------------------------

        botao = wait.until(
            EC.element_to_be_clickable(
                (
                    By.XPATH,
                    "//*[self::button or self::a]"
                    "[contains(normalize-space(.), 'Gerar link')]"
                )
            )
        )

        print("[OK] Botão 'Gerar link' encontrado.")

        # Coloca o botão no centro da tela
        driver.execute_script(
            "arguments[0].scrollIntoView({block: 'center'});",
            botao
        )

        time.sleep(0.5)

        # Clica
        driver.execute_script(
            "arguments[0].click();",
            botao
        )

        print("[OK] Botão 'Gerar link' clicado.")

    except Exception as erro:

        print("[ERRO] Não foi possível clicar em 'Gerar link'.")
        print(erro)

        return None


    # --------------------------------------------------------
    # AGUARDA O MODAL
    # --------------------------------------------------------

    try:

        # O campo mostrado na imagem é um INPUT.
        #
        # Procuramos um input visível que possua valor.
        #
        def encontrar_input_link(driver):

            inputs = driver.find_elements(
                By.CSS_SELECTOR,
                "input"
            )

            for campo in inputs:

                try:

                    if not campo.is_displayed():
                        continue

                    valor = campo.get_attribute("value")

                    if not valor:
                        continue

                    # O link gerado pelo Magalu aparece
                    # como URL dentro desse campo.
                    if (
                        "http://" in valor
                        or "https://" in valor
                    ):
                        return campo

                except Exception:
                    continue

            return False


        campo_link = WebDriverWait(
            driver,
            10
        ).until(encontrar_input_link)

        link_afiliado = campo_link.get_attribute("value")

        print("[OK] Link de afiliado obtido:")
        print(link_afiliado)

        return link_afiliado

    except Exception as erro:

        print("[ERRO] Não consegui encontrar o link no modal.")
        print(erro)

        return None


# ============================================================
# COLETA
# ============================================================

resultados = []

total_produtos = 0
total_links = 0


for numero_categoria, categoria in enumerate(
    CATEGORIAS,
    start=1
):

    print("\n")
    print("=" * 70)
    print(
        f"CATEGORIA {numero_categoria}/{len(CATEGORIAS)}: "
        f"{categoria.upper()}"
    )
    print("=" * 70)

    # --------------------------------------------------------
    # 1. COLETAR OS 20 PRODUTOS
    # --------------------------------------------------------

    produtos = coletar_produtos_categoria(categoria)

    total_produtos += len(produtos)

    # --------------------------------------------------------
    # 2. ENTRAR EM CADA PRODUTO
    # --------------------------------------------------------

    for numero_produto, url_produto in enumerate(
        produtos,
        start=1
    ):

        print(
            f"\n[{categoria}] "
            f"Produto {numero_produto}/{len(produtos)}"
        )

        link_afiliado = gerar_link_afiliado(
            url_produto
        )

        # ----------------------------------------------------
        # SALVAR RESULTADO
        # ----------------------------------------------------

        resultados.append(
            {
                "categoria": categoria,
                "produto_numero": numero_produto,
                "link_produto": url_produto,
                "link_afiliado": link_afiliado
            }
        )

        if link_afiliado:
            total_links += 1
            print("[OK] Produto processado com sucesso.")
        else:
            print("[AVISO] Produto sem link de afiliado.")

        # Pequena pausa antes do próximo produto
        time.sleep(random.uniform(2, 4))


# ============================================================
# GERAR EXCEL
# ============================================================

print("\n")
print("=" * 70)
print("GERANDO ARQUIVO EXCEL")
print("=" * 70)

wb = Workbook()

ws = wb.active
ws.title = "Links Afiliados"


# Cabeçalho

ws.append(
    [
        "Categoria",
        "Produto Nº",
        "Link do Produto",
        "Link de Afiliado"
    ]
)


# Dados

for resultado in resultados:

    ws.append(
        [
            resultado["categoria"],
            resultado["produto_numero"],
            resultado["link_produto"],
            resultado["link_afiliado"]
        ]
    )


# Ajustar largura das colunas

ws.column_dimensions["A"].width = 25
ws.column_dimensions["B"].width = 12
ws.column_dimensions["C"].width = 80
ws.column_dimensions["D"].width = 80


# Salvar

wb.save(ARQUIVO_SAIDA)


# ============================================================
# RELATÓRIO FINAL
# ============================================================

print("\n")
print("=" * 70)
print("                    COLETA FINALIZADA")
print("=" * 70)

for categoria in CATEGORIAS:

    dados_categoria = [
        x for x in resultados
        if x["categoria"] == categoria
    ]

    links_categoria = [
        x for x in dados_categoria
        if x["link_afiliado"]
    ]

    print(
        f"{categoria.upper():25} "
        f"Produtos: {len(dados_categoria):2} | "
        f"Links: {len(links_categoria):2}"
    )


print("-" * 70)

print(f"TOTAL DE PRODUTOS PROCESSADOS: {total_produtos}")
print(f"TOTAL DE LINKS DE AFILIADO:    {total_links}")
print(f"ARQUIVO GERADO:                {ARQUIVO_SAIDA}")

print("=" * 70)

input("\nPressione ENTER para encerrar...")