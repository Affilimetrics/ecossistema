import os
import random
import time
import urllib.parse

from openpyxl import Workbook, load_workbook

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


# ============================================================
# CONFIGURAÇÃO
# ============================================================

CHROME_DEBUGGER = "127.0.0.1:9222"

MINHA_LOJA = "magazineblackriseco"

BASE_URL = (
    f"https://www.magazinevoce.com.br/{MINHA_LOJA}"
)

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

print()
print("[INFO] Conectando ao Chrome...")

options = Options()

options.add_experimental_option(
    "debuggerAddress",
    CHROME_DEBUGGER
)

driver = webdriver.Chrome(
    options=options
)

wait = WebDriverWait(
    driver,
    15
)

print("[OK] Chrome conectado.")
print("[INFO] Página atual:")
print(driver.current_url)


# ============================================================
# FUNÇÃO: SALVAR EXCEL
# ============================================================

def salvar_excel(resultados):

    wb = Workbook()

    ws = wb.active
    ws.title = "Links Afiliados"

    # Cabeçalho
    ws.append(
        [
            "Categoria",
            "Produto Nº",
            "Link do Produto",
            "Link de Afiliado",
            "Status"
        ]
    )

    # Dados
    for resultado in resultados:

        ws.append(
            [
                resultado["categoria"],
                resultado["produto_numero"],
                resultado["link_produto"],
                resultado["link_afiliado"],
                resultado["status"]
            ]
        )

    # Largura das colunas
    ws.column_dimensions["A"].width = 25
    ws.column_dimensions["B"].width = 12
    ws.column_dimensions["C"].width = 80
    ws.column_dimensions["D"].width = 80
    ws.column_dimensions["E"].width = 15

    wb.save(ARQUIVO_SAIDA)


# ============================================================
# FUNÇÃO: CARREGAR PROGRESSO
# ============================================================

def carregar_progresso():

    resultados = []

    # --------------------------------------------------------
    # NÃO EXISTE EXCEL
    # --------------------------------------------------------

    if not os.path.exists(ARQUIVO_SAIDA):

        print()
        print("=" * 70)
        print("                         NOVA EXECUÇÃO")
        print("=" * 70)

        print(
            "[INFO] Nenhum progresso anterior encontrado."
        )

        print(
            "[INFO] A coleta começará do primeiro produto."
        )

        print("=" * 70)

        return resultados

    # --------------------------------------------------------
    # CARREGAR EXCEL
    # --------------------------------------------------------

    try:

        wb = load_workbook(
            ARQUIVO_SAIDA,
            read_only=True
        )

        if "Links Afiliados" not in wb.sheetnames:

            wb.close()

            print()
            print(
                "[AVISO] A planilha não possui "
                "a aba 'Links Afiliados'."
            )

            return resultados

        ws = wb["Links Afiliados"]

        for linha in ws.iter_rows(
            min_row=2,
            values_only=True
        ):

            if not linha:
                continue

            categoria = (
                linha[0]
                if len(linha) > 0
                else None
            )

            produto_numero = (
                linha[1]
                if len(linha) > 1
                else None
            )

            link_produto = (
                linha[2]
                if len(linha) > 2
                else None
            )

            link_afiliado = (
                linha[3]
                if len(linha) > 3
                else None
            )

            # ------------------------------------------------
            # COMPATIBILIDADE COM EXCEL ANTIGO
            # ------------------------------------------------

            if len(linha) > 4:

                status = linha[4]

            else:

                if link_afiliado:

                    status = "OK"

                else:

                    status = "ERRO"

            if not categoria:
                continue

            resultados.append(
                {
                    "categoria": categoria,
                    "produto_numero": produto_numero,
                    "link_produto": link_produto,
                    "link_afiliado": link_afiliado,
                    "status": status
                }
            )

        wb.close()

    except Exception as erro:

        print()
        print("=" * 70)
        print("                    ERRO AO LER O EXCEL")
        print("=" * 70)

        print(erro)

        print("=" * 70)

        return resultados

    # --------------------------------------------------------
    # ESTATÍSTICAS
    # --------------------------------------------------------

    total_registros = len(resultados)

    total_ok = sum(
        1
        for resultado in resultados
        if resultado["status"] == "OK"
    )

    total_erros = sum(
        1
        for resultado in resultados
        if resultado["status"] != "OK"
    )

    # --------------------------------------------------------
    # ENCONTRAR PRIMEIRO PENDENTE
    # --------------------------------------------------------

    proximo_pendente = None

    for categoria in CATEGORIAS:

        for numero_produto in range(
            1,
            LIMITE_POR_CATEGORIA + 1
        ):

            encontrado = False

            for resultado in resultados:

                mesma_categoria = (
                    resultado["categoria"]
                    == categoria
                )

                mesmo_produto = (
                    resultado["produto_numero"]
                    == numero_produto
                )

                concluido = (
                    resultado["status"]
                    == "OK"
                )

                if (
                    mesma_categoria
                    and
                    mesmo_produto
                    and
                    concluido
                ):

                    encontrado = True

                    break

            if not encontrado:

                proximo_pendente = (
                    categoria,
                    numero_produto
                )

                break

        if proximo_pendente:
            break

    # --------------------------------------------------------
    # EXIBIR RETOMADA
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print("              RETOMANDO EXECUÇÃO ANTERIOR")
    print("=" * 70)

    print(
        f"[OK] Excel encontrado: "
        f"{ARQUIVO_SAIDA}"
    )

    print(
        f"[OK] Registros carregados: "
        f"{total_registros}"
    )

    print(
        f"[INFO] Produtos concluídos: "
        f"{total_ok}"
    )

    print(
        f"[INFO] Produtos com erro: "
        f"{total_erros}"
    )

    if proximo_pendente:

        categoria_proxima = (
            proximo_pendente[0]
        )

        numero_proximo = (
            proximo_pendente[1]
        )

        print(
            f"[INFO] Próximo produto pendente: "
            f"{categoria_proxima} "
            f"#{numero_proximo}"
        )

    else:

        print(
            "[INFO] Não existem produtos "
            "pendentes identificados."
        )

    print("=" * 70)

    return resultados


# ============================================================
# FUNÇÃO: VERIFICAR SE JÁ FOI PROCESSADO
# ============================================================

def produto_ja_processado(
    resultados,
    categoria,
    numero_produto
):

    for resultado in resultados:

        if (
            resultado["categoria"] == categoria
            and
            resultado["produto_numero"]
            == numero_produto
            and
            resultado["status"] == "OK"
        ):

            return True

    return False


# ============================================================
# FUNÇÃO: ROLAGEM
# ============================================================

def rolar_pagina(
    driver,
    passos=7
):

    altura_anterior = 0

    for _ in range(passos):

        altura = driver.execute_script(
            "return document.body.scrollHeight"
        )

        driver.execute_script(
            "window.scrollTo(0, arguments[0]);",
            altura
        )

        time.sleep(
            random.uniform(
                0.8,
                1.4
            )
        )

        if altura == altura_anterior:
            break

        altura_anterior = altura


# ============================================================
# FUNÇÃO: COLETAR PRODUTOS DA CATEGORIA
# ============================================================

def coletar_produtos_categoria(
    categoria
):

    print()
    print("-" * 70)
    print(
        f"COLETANDO PRODUTOS: "
        f"{categoria.upper()}"
    )
    print("-" * 70)

    categoria_url = urllib.parse.quote(
        categoria,
        safe=""
    )

    url = (
        f"{BASE_URL}/busca/"
        f"{categoria_url}/"
    )

    print("[INFO] Abrindo:")
    print(url)

    driver.get(url)

    time.sleep(
        random.uniform(
            3,
            4
        )
    )

    rolar_pagina(driver)

    links = []
    links_set = set()

    elementos = driver.find_elements(
        By.CSS_SELECTOR,
        "a[href*='/p/']"
    )

    print(
        f"[INFO] Elementos encontrados: "
        f"{len(elementos)}"
    )

    for elemento in elementos:

        try:

            link = elemento.get_attribute(
                "href"
            )

            if not link:
                continue

            if "/p/" not in link:
                continue

            link = link.split("?")[0]

            if link in links_set:
                continue

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

def gerar_link_afiliado(
    url_produto
):

    print()
    print("-" * 70)
    print("ABRINDO PRODUTO")
    print("-" * 70)

    print(url_produto)

    driver.get(url_produto)

    time.sleep(
        random.uniform(
            2.5,
            4
        )
    )

    # --------------------------------------------------------
    # BOTÃO GERAR LINK
    # --------------------------------------------------------

    try:

        botao = wait.until(
            EC.element_to_be_clickable(
                (
                    By.XPATH,
                    "//*[self::button or self::a]"
                    "[contains("
                    "normalize-space(.), "
                    "'Gerar link'"
                    ")]"
                )
            )
        )

        print(
            "[OK] Botão 'Gerar link' encontrado."
        )

        driver.execute_script(
            "arguments[0].scrollIntoView("
            "{block: 'center'}"
            ");",
            botao
        )

        time.sleep(0.5)

        driver.execute_script(
            "arguments[0].click();",
            botao
        )

        print(
            "[OK] Botão 'Gerar link' clicado."
        )

    except Exception as erro:

        print(
            "[ERRO] Não foi possível clicar "
            "em 'Gerar link'."
        )

        print(erro)

        return None

    # --------------------------------------------------------
    # ENCONTRAR LINK NO MODAL
    # --------------------------------------------------------

    try:

        def encontrar_input_link(
            driver
        ):

            inputs = driver.find_elements(
                By.CSS_SELECTOR,
                "input"
            )

            for campo in inputs:

                try:

                    if not campo.is_displayed():
                        continue

                    valor = campo.get_attribute(
                        "value"
                    )

                    if not valor:
                        continue

                    if (
                        "http://" in valor
                        or
                        "https://" in valor
                    ):

                        return campo

                except Exception:

                    continue

            return False

        campo_link = WebDriverWait(
            driver,
            10
        ).until(
            encontrar_input_link
        )

        link_afiliado = (
            campo_link.get_attribute(
                "value"
            )
        )

        print(
            "[OK] Link de afiliado obtido:"
        )

        print(link_afiliado)

        return link_afiliado

    except Exception as erro:

        print(
            "[ERRO] Não consegui encontrar "
            "o link no modal."
        )

        print(erro)

        return None


# ============================================================
# FUNÇÃO: ATUALIZAR RESULTADO
# ============================================================

def atualizar_resultado(
    resultados,
    categoria,
    numero_produto,
    url_produto,
    link_afiliado
):

    if link_afiliado:

        status = "OK"

    else:

        status = "ERRO"

    # --------------------------------------------------------
    # PROCURAR REGISTRO EXISTENTE
    # --------------------------------------------------------

    for resultado in resultados:

        if (
            resultado["categoria"] == categoria
            and
            resultado["produto_numero"]
            == numero_produto
        ):

            resultado["link_produto"] = (
                url_produto
            )

            resultado["link_afiliado"] = (
                link_afiliado
            )

            resultado["status"] = status

            return status

    # --------------------------------------------------------
    # CRIAR NOVO REGISTRO
    # --------------------------------------------------------

    resultados.append(
        {
            "categoria": categoria,
            "produto_numero": numero_produto,
            "link_produto": url_produto,
            "link_afiliado": link_afiliado,
            "status": status
        }
    )

    return status


# ============================================================
# ABRIR VITRINE
# ============================================================

print()
print("[INFO] Abrindo sua vitrine...")

driver.get(BASE_URL)

time.sleep(3)

print("[OK] Vitrine aberta.")


# ============================================================
# CARREGAR PROGRESSO
# ============================================================

resultados = carregar_progresso()


# ============================================================
# CONTADORES
# ============================================================

total_produtos_visitados = 0
total_links_novos = 0
total_pulados = 0


# ============================================================
# EXECUÇÃO PRINCIPAL
# ============================================================

try:

    for numero_categoria, categoria in enumerate(
        CATEGORIAS,
        start=1
    ):

        print()
        print("=" * 70)

        print(
            f"CATEGORIA "
            f"{numero_categoria}/"
            f"{len(CATEGORIAS)}: "
            f"{categoria.upper()}"
        )

        print("=" * 70)

        # ----------------------------------------------------
        # COLETAR PRODUTOS
        # ----------------------------------------------------

        produtos = coletar_produtos_categoria(
            categoria
        )

        # ----------------------------------------------------
        # PROCESSAR CADA PRODUTO
        # ----------------------------------------------------

        for numero_produto, url_produto in enumerate(
            produtos,
            start=1
        ):

            # ------------------------------------------------
            # VERIFICAR RETOMADA
            # ------------------------------------------------

            if produto_ja_processado(
                resultados,
                categoria,
                numero_produto
            ):

                total_pulados += 1

                print()
                print(
                    f"[{categoria}] "
                    f"Produto "
                    f"{numero_produto}/"
                    f"{len(produtos)} "
                    f"→ JÁ PROCESSADO "
                    f"(pulando)"
                )

                continue

            # ------------------------------------------------
            # CONTADOR
            # ------------------------------------------------

            total_produtos_visitados += 1

            print()
            print(
                f"[{categoria}] "
                f"Produto "
                f"{numero_produto}/"
                f"{len(produtos)}"
            )

            # ------------------------------------------------
            # GERAR LINK
            # ------------------------------------------------

            link_afiliado = (
                gerar_link_afiliado(
                    url_produto
                )
            )

            # ------------------------------------------------
            # ATUALIZAR RESULTADO
            # ------------------------------------------------

            status = atualizar_resultado(
                resultados,
                categoria,
                numero_produto,
                url_produto,
                link_afiliado
            )

            # ------------------------------------------------
            # MOSTRAR RESULTADO
            # ------------------------------------------------

            if status == "OK":

                total_links_novos += 1

                print(
                    "[OK] Produto processado "
                    "com sucesso."
                )

            else:

                print(
                    "[AVISO] Produto sem "
                    "link de afiliado."
                )

            # ------------------------------------------------
            # SALVAR IMEDIATAMENTE
            # ------------------------------------------------

            try:

                salvar_excel(
                    resultados
                )

                print(
                    "[OK] Progresso salvo no Excel."
                )

            except Exception as erro:

                print(
                    "[ERRO] Falha ao salvar "
                    "o Excel."
                )

                print(erro)

            # ------------------------------------------------
            # PAUSA
            # ------------------------------------------------

            time.sleep(
                random.uniform(
                    2,
                    4
                )
            )


# ============================================================
# CTRL+C
# ============================================================

except KeyboardInterrupt:

    print()
    print()
    print("=" * 70)
    print(
        "       EXECUÇÃO INTERROMPIDA PELO USUÁRIO"
    )
    print("=" * 70)

    print()
    print(
        "[INFO] CTRL+C detectado."
    )

    print(
        "[INFO] Salvando os dados coletados..."
    )

    try:

        salvar_excel(
            resultados
        )

        print(
            "[OK] Dados salvos com sucesso."
        )

    except Exception as erro:

        print(
            "[ERRO] Não foi possível "
            "salvar o Excel."
        )

        print(erro)

    # --------------------------------------------------------
    # LISTAR LINKS
    # --------------------------------------------------------

    print()
    print(
        "LINKS DE AFILIADO OBTIDOS ATÉ AGORA:"
    )

    print("-" * 70)

    contador_links = 0

    for resultado in resultados:

        if resultado["status"] != "OK":
            continue

        contador_links += 1

        print(
            f"{contador_links:03d}. "
            f"[{resultado['categoria']}] "
            f"Produto "
            f"{resultado['produto_numero']}"
        )

        print(
            resultado["link_afiliado"]
        )

    print("-" * 70)

    print(
        f"TOTAL DE REGISTROS NO EXCEL: "
        f"{len(resultados)}"
    )

    print(
        f"TOTAL DE LINKS DE AFILIADO: "
        f"{contador_links}"
    )

    print(
        f"ARQUIVO SALVO: "
        f"{ARQUIVO_SAIDA}"
    )

    print("=" * 70)


# ============================================================
# FINALIZAÇÃO NORMAL
# ============================================================

else:

    # --------------------------------------------------------
    # GARANTIR ÚLTIMO SALVAMENTO
    # --------------------------------------------------------

    try:

        salvar_excel(
            resultados
        )

    except Exception as erro:

        print(
            "[ERRO] Falha no salvamento final:"
        )

        print(erro)

    # --------------------------------------------------------
    # RELATÓRIO
    # --------------------------------------------------------

    print()
    print("=" * 70)
    print(
        "              COLETA FINALIZADA"
    )
    print("=" * 70)

    for categoria in CATEGORIAS:

        dados_categoria = [
            resultado
            for resultado in resultados
            if resultado["categoria"]
            == categoria
        ]

        links_categoria = [
            resultado
            for resultado in dados_categoria
            if resultado["status"]
            == "OK"
        ]

        print(
            f"{categoria.upper():25} "
            f"Produtos: "
            f"{len(dados_categoria):2} | "
            f"Links: "
            f"{len(links_categoria):2}"
        )

    print("-" * 70)

    total_links_final = sum(
        1
        for resultado in resultados
        if resultado["status"] == "OK"
    )

    total_erros_final = sum(
        1
        for resultado in resultados
        if resultado["status"] != "OK"
    )

    print(
        f"TOTAL DE REGISTROS NO EXCEL: "
        f"{len(resultados)}"
    )

    print(
        f"PRODUTOS PROCESSADOS AGORA: "
        f"{total_produtos_visitados}"
    )

    print(
        f"PRODUTOS PULADOS POR RETOMADA: "
        f"{total_pulados}"
    )

    print(
        f"PRODUTOS COM ERRO: "
        f"{total_erros_final}"
    )

    print(
        f"TOTAL DE LINKS DE AFILIADO: "
        f"{total_links_final}"
    )

    print(
        f"ARQUIVO GERADO: "
        f"{ARQUIVO_SAIDA}"
    )

    print("=" * 70)


# ============================================================
# ENCERRAMENTO
# ============================================================

input(
    "\nPressione ENTER para encerrar..."
)