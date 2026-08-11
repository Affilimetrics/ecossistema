import os
import time
import random
import urllib.parse

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from openpyxl import Workbook, load_workbook


# ============================================================
# CONFIGURAÇÃO
# ============================================================

CHROME_DEBUGGER = "127.0.0.1:9222"

MINHA_LOJA = "magazineblackriseco"

BASE_URL = f"https://www.magazinevoce.com.br/{MINHA_LOJA}"

LIMITE_POR_CATEGORIA = 20

ARQUIVO_SAIDA = "links_afiliados_magalu.xlsx"


# ============================================================
# CATEGORIAS PRINCIPAIS
# ============================================================

CATEGORIAS_PRINCIPAIS = {
    "1": "cozinha",
    "2": "quarto",
    "3": "sala",
    "4": "banheiro",
    "5": "acessórios",
}


# ============================================================
# VARIÁVEIS GLOBAIS
# ============================================================

resultados = []

total_produtos = 0
total_links = 0


# ============================================================
# MENU DE SELEÇÃO
# ============================================================

def selecionar_categorias():

    print("\n")
    print("=" * 70)
    print("              MAGALU - COLETOR DE LINKS")
    print("=" * 70)

    print("\nSelecione as categorias que deseja executar.\n")

    for numero, categoria in CATEGORIAS_PRINCIPAIS.items():
        print(f"{numero} - {categoria.capitalize()}")

    print("6 - Palavra-chave personalizada")

    print("\nDigite os números separados por espaço.")
    print("Exemplo: 1 3 4 6")
    print("Digite 0 para cancelar.\n")

    while True:

        entrada = input("> ").strip()

        if not entrada:
            print("[AVISO] Digite pelo menos uma opção.")
            continue

        numeros = entrada.split()

        if "0" in numeros:
            print("\n[INFO] Operação cancelada.")
            return []

        invalidos = [
            numero
            for numero in numeros
            if numero not in CATEGORIAS_PRINCIPAIS
            and numero != "6"
        ]

        if invalidos:

            print(
                "[ERRO] Opção inválida: "
                + ", ".join(invalidos)
            )

            print("Utilize somente números de 1 a 6.")
            continue

        # Remove duplicados mantendo a ordem
        numeros = list(dict.fromkeys(numeros))

        categorias = []

        # ----------------------------------------------------
        # CATEGORIAS PRINCIPAIS
        # ----------------------------------------------------

        for numero in numeros:

            if numero == "6":
                continue

            categorias.append(
                CATEGORIAS_PRINCIPAIS[numero]
            )

        # ----------------------------------------------------
        # PALAVRA-CHAVE PERSONALIZADA
        # ----------------------------------------------------

        if "6" in numeros:

            while True:

                palavra_chave = input(
                    "\nDigite a palavra-chave:\n> "
                ).strip()

                if palavra_chave:

                    categorias.append(
                        palavra_chave
                    )

                    break

                print(
                    "[AVISO] A palavra-chave "
                    "não pode ficar vazia."
                )

        # ----------------------------------------------------
        # MOSTRAR SELEÇÃO
        # ----------------------------------------------------

        print("\n")
        print("=" * 70)
        print("             CATEGORIAS SELECIONADAS")
        print("=" * 70)

        for numero, categoria in enumerate(
            categorias,
            start=1
        ):

            print(
                f"{numero} - {categoria}"
            )

        print("=" * 70)

        confirmar = input(
            "\nConfirmar seleção? [S/N]: "
        ).strip().lower()

        if confirmar in ("s", "sim"):

            print(
                "\n[OK] Seleção confirmada.\n"
            )

            return categorias

        print(
            "\n[INFO] Seleção descartada."
        )

        print(
            "[INFO] Escolha novamente.\n"
        )


# ============================================================
# CARREGAR RESULTADOS EXISTENTES
# ============================================================

def carregar_resultados():

    if not os.path.exists(ARQUIVO_SAIDA):

        print(
            "[INFO] Nenhum Excel anterior encontrado."
        )

        return []

    print("\n")
    print("=" * 70)
    print("              VERIFICANDO RETOMADA")
    print("=" * 70)

    print(
        f"[INFO] Arquivo encontrado: "
        f"{ARQUIVO_SAIDA}"
    )

    resultados_existentes = []

    try:

        wb = load_workbook(
            ARQUIVO_SAIDA
        )

        if "Links Afiliados" not in wb.sheetnames:

            print(
                "[INFO] Planilha de dados não encontrada."
            )

            return []

        ws = wb["Links Afiliados"]

        for linha in ws.iter_rows(
            min_row=2,
            values_only=True
        ):

            categoria = linha[0]
            produto_numero = linha[1]
            link_produto = linha[2]
            link_afiliado = linha[3]

            if not link_produto:
                continue

            resultados_existentes.append(
                {
                    "categoria": categoria,
                    "produto_numero": produto_numero,
                    "link_produto": link_produto,
                    "link_afiliado": link_afiliado
                }
            )

        print(
            f"[OK] "
            f"{len(resultados_existentes)} "
            f"registros encontrados."
        )

        links_existentes = sum(
            1
            for resultado in resultados_existentes
            if resultado["link_afiliado"]
        )

        print(
            f"[OK] "
            f"{links_existentes} "
            f"links de afiliado já obtidos."
        )

        print(
            "[INFO] O programa continuará "
            "somente com os produtos ainda pendentes."
        )

        return resultados_existentes

    except Exception as erro:

        print(
            "[ERRO] Não foi possível carregar "
            "o Excel anterior."
        )

        print(erro)

        return []


# ============================================================
# VERIFICAR SE PRODUTO JÁ FOI PROCESSADO
# ============================================================

def produto_ja_processado(url_produto, categoria):

    for resultado in resultados:

        if (
            resultado["categoria"] == categoria
            and resultado["link_produto"] == url_produto
            and resultado["link_afiliado"]
        ):
            return True

    return False


# ============================================================
# SALVAR EXCEL
# ============================================================

def salvar_excel(resultados):

    wb = Workbook()

    ws = wb.active
    ws.title = "Links Afiliados"

    ws.append(
        [
            "Categoria",
            "Produto Nº",
            "Link do Produto",
            "Link de Afiliado"
        ]
    )

    for resultado in resultados:

        ws.append(
            [
                resultado["categoria"],
                resultado["produto_numero"],
                resultado["link_produto"],
                resultado["link_afiliado"]
            ]
        )

    ws.column_dimensions["A"].width = 25
    ws.column_dimensions["B"].width = 12
    ws.column_dimensions["C"].width = 80
    ws.column_dimensions["D"].width = 80

    wb.save(ARQUIVO_SAIDA)


# ============================================================
# ROLAR PÁGINA
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

        time.sleep(
            random.uniform(0.8, 1.4)
        )

        if altura == altura_anterior:
            break

        altura_anterior = altura


# ============================================================
# COLETAR PRODUTOS DA CATEGORIA
# ============================================================

def coletar_produtos_categoria(
    driver,
    categoria
):

    print("\n")
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
        random.uniform(3, 4)
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
# GERAR LINK DE AFILIADO
# ============================================================

def gerar_link_afiliado(
    driver,
    wait,
    url_produto
):

    print("\n")
    print("-" * 70)
    print("ABRINDO PRODUTO")
    print("-" * 70)

    print(url_produto)

    driver.get(url_produto)

    time.sleep(
        random.uniform(2.5, 4)
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
                    "[contains(normalize-space(.), 'Gerar link')]"
                )
            )
        )

        print(
            "[OK] Botão 'Gerar link' encontrado."
        )

        driver.execute_script(
            "arguments[0].scrollIntoView("
            "{block: 'center'});",
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
    # LOCALIZAR CAMPO DO LINK
    # --------------------------------------------------------

    try:

        def encontrar_input_link(driver):

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
                        or "https://" in valor
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

        link_afiliado = campo_link.get_attribute(
            "value"
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
# RELATÓRIO DE INTERRUPÇÃO
# ============================================================

def mostrar_resultados_interrompidos():

    print("\n")
    print("=" * 70)
    print("       EXECUÇÃO INTERROMPIDA PELO USUÁRIO")
    print("=" * 70)

    print(
        "\n[INFO] Ctrl+C detectado."
    )

    print(
        "[INFO] Salvando os dados coletados..."
    )

    try:

        salvar_excel(resultados)

        print(
            "[OK] Dados salvos com sucesso."
        )

    except Exception as erro:

        print(
            "[ERRO] Não foi possível salvar "
            "o Excel:"
        )

        print(erro)

    total_links_obtidos = sum(
        1
        for resultado in resultados
        if resultado["link_afiliado"]
    )

    print("\n")
    print(
        "LINKS DE AFILIADO OBTIDOS ATÉ AGORA:"
    )

    print("-" * 70)

    contador = 0

    for resultado in resultados:

        if resultado["link_afiliado"]:

            contador += 1

            print(
                f"{contador:03d}. "
                f"[{resultado['categoria']}]"
            )

            print(
                resultado["link_afiliado"]
            )

            print()

    print("-" * 70)

    print(
        f"TOTAL DE PRODUTOS PROCESSADOS: "
        f"{len(resultados)}"
    )

    print(
        f"TOTAL DE LINKS DE AFILIADO:    "
        f"{total_links_obtidos}"
    )

    print(
        f"ARQUIVO SALVO: {ARQUIVO_SAIDA}"
    )

    print("=" * 70)


# ============================================================
# RELATÓRIO FINAL
# ============================================================

def mostrar_relatorio_final(
    categorias_selecionadas
):

    print("\n")
    print("=" * 70)
    print("                    COLETA FINALIZADA")
    print("=" * 70)

    for categoria in categorias_selecionadas:

        dados_categoria = [
            resultado
            for resultado in resultados
            if resultado["categoria"] == categoria
        ]

        links_categoria = [
            resultado
            for resultado in dados_categoria
            if resultado["link_afiliado"]
        ]

        print(
            f"{categoria.upper():25} "
            f"Produtos: {len(dados_categoria):2} | "
            f"Links: {len(links_categoria):2}"
        )

    print("-" * 70)

    total_produtos_processados = len(
        resultados
    )

    total_links_obtidos = sum(
        1
        for resultado in resultados
        if resultado["link_afiliado"]
    )

    print(
        f"TOTAL DE PRODUTOS PROCESSADOS: "
        f"{total_produtos_processados}"
    )

    print(
        f"TOTAL DE LINKS DE AFILIADO:    "
        f"{total_links_obtidos}"
    )

    print(
        f"ARQUIVO GERADO:                "
        f"{ARQUIVO_SAIDA}"
    )

    print("=" * 70)


# ============================================================
# PROGRAMA PRINCIPAL
# ============================================================

def main():

    global resultados
    global total_produtos
    global total_links

    # --------------------------------------------------------
    # CARREGAR DADOS EXISTENTES
    # --------------------------------------------------------

    resultados = carregar_resultados()

    total_produtos = len(
        resultados
    )

    total_links = sum(
        1
        for resultado in resultados
        if resultado["link_afiliado"]
    )

    # --------------------------------------------------------
    # SELEÇÃO DAS CATEGORIAS
    # --------------------------------------------------------

    categorias_selecionadas = (
        selecionar_categorias()
    )

    if not categorias_selecionadas:

        print(
            "\n[INFO] Nenhuma categoria selecionada."
        )

        return

    # --------------------------------------------------------
    # CABEÇALHO
    # --------------------------------------------------------

    print("\n")
    print("=" * 70)
    print("        MAGALU - COLETOR DE LINKS DE AFILIADO")
    print("=" * 70)

    print(
        "\n[INFO] Categorias que serão processadas:"
    )

    for categoria in categorias_selecionadas:

        print(
            f"  - {categoria}"
        )

    # --------------------------------------------------------
    # CONECTAR AO CHROME
    # --------------------------------------------------------

    print(
        "\n[INFO] Conectando ao Chrome..."
    )

    options = Options()

    options.add_experimental_option(
        "debuggerAddress",
        CHROME_DEBUGGER
    )

    driver = None

    try:

        driver = webdriver.Chrome(
            options=options
        )

        wait = WebDriverWait(
            driver,
            15
        )

        print(
            "[OK] Chrome conectado."
        )

        print(
            "[INFO] Página atual:"
        )

        print(
            driver.current_url
        )

        # ----------------------------------------------------
        # ABRIR VITRINE
        # ----------------------------------------------------

        print(
            "\n[1] Abrindo sua vitrine..."
        )

        driver.get(BASE_URL)

        time.sleep(3)

        print(
            "[OK] Vitrine aberta."
        )

        # ----------------------------------------------------
        # EXECUTAR CATEGORIAS
        # ----------------------------------------------------

        for numero_categoria, categoria in enumerate(
            categorias_selecionadas,
            start=1
        ):

            print("\n")
            print("=" * 70)

            print(
                f"CATEGORIA "
                f"{numero_categoria}/"
                f"{len(categorias_selecionadas)}: "
                f"{categoria.upper()}"
            )

            print("=" * 70)

            # ------------------------------------------------
            # COLETAR PRODUTOS
            # ------------------------------------------------

            produtos = (
                coletar_produtos_categoria(
                    driver,
                    categoria
                )
            )

            # ------------------------------------------------
            # VERIFICAR RETOMADA
            # ------------------------------------------------

            produtos_pendentes = []

            for produto in produtos:

                if produto_ja_processado(
                    produto,
                    categoria
                ):

                    print(
                        "[RETOMADA] Produto já "
                        "processado. Pulando:"
                    )

                    print(produto)

                    continue

                produtos_pendentes.append(
                    produto
                )

            print(
                "\n[RETOMADA] "
                f"{len(produtos_pendentes)} "
                "produtos pendentes."
            )

            print(
                "[RETOMADA] "
                f"{len(produtos) - len(produtos_pendentes)} "
                "produtos já concluídos."
            )

            # ------------------------------------------------
            # PROCESSAR PRODUTOS PENDENTES
            # ------------------------------------------------

            for numero_produto, url_produto in enumerate(
                produtos_pendentes,
                start=1
            ):

                print(
                    f"\n[{categoria}] "
                    f"Produto pendente "
                    f"{numero_produto}/"
                    f"{len(produtos_pendentes)}"
                )

                link_afiliado = (
                    gerar_link_afiliado(
                        driver,
                        wait,
                        url_produto
                    )
                )

                # --------------------------------------------
                # ATUALIZAR RESULTADO EXISTENTE
                # --------------------------------------------

                resultado_existente = None

                for resultado in resultados:

                    if (
                        resultado["categoria"] == categoria
                        and resultado["link_produto"]
                        == url_produto
                    ):

                        resultado_existente = resultado
                        break

                if resultado_existente:

                    resultado_existente[
                        "link_afiliado"
                    ] = link_afiliado

                else:

                    resultados.append(
                        {
                            "categoria": categoria,
                            "produto_numero": (
                                numero_produto
                            ),
                            "link_produto": (
                                url_produto
                            ),
                            "link_afiliado": (
                                link_afiliado
                            )
                        }
                    )

                # --------------------------------------------
                # CONTADORES
                # --------------------------------------------

                total_produtos = len(
                    resultados
                )

                total_links = sum(
                    1
                    for resultado in resultados
                    if resultado["link_afiliado"]
                )

                if link_afiliado:

                    print(
                        "[OK] Produto processado "
                        "com sucesso."
                    )

                else:

                    print(
                        "[AVISO] Produto sem "
                        "link de afiliado."
                    )

                # --------------------------------------------
                # SALVAMENTO INCREMENTAL
                # --------------------------------------------

                try:

                    salvar_excel(
                        resultados
                    )

                    print(
                        "[OK] Dados salvos no Excel."
                    )

                except Exception as erro:

                    print(
                        "[ERRO] Falha ao salvar "
                        "Excel:"
                    )

                    print(erro)

                time.sleep(
                    random.uniform(2, 4)
                )

        # ----------------------------------------------------
        # SALVAR NOVAMENTE AO FINAL
        # ----------------------------------------------------

        try:

            salvar_excel(
                resultados
            )

            print(
                "\n[OK] Salvamento final concluído."
            )

        except Exception as erro:

            print(
                "\n[ERRO] Falha no salvamento final:"
            )

            print(erro)

        # ----------------------------------------------------
        # RELATÓRIO FINAL
        # ----------------------------------------------------

        mostrar_relatorio_final(
            categorias_selecionadas
        )

    except KeyboardInterrupt:

        mostrar_resultados_interrompidos()

    except Exception as erro:

        print("\n")
        print("=" * 70)
        print("                    ERRO FATAL")
        print("=" * 70)

        print(
            "\n[ERRO] A execução encontrou "
            "um erro inesperado:"
        )

        print(erro)

        print(
            "\n[INFO] Salvando os dados já coletados..."
        )

        try:

            salvar_excel(
                resultados
            )

            print(
                "[OK] Dados preservados no Excel."
            )

        except Exception as erro_excel:

            print(
                "[ERRO] Também não foi possível "
                "salvar o Excel:"
            )

            print(erro_excel)

    finally:

        # Não fecha o Chrome do usuário.
        # A sessão foi aberta externamente com
        # --remote-debugging-port=9222.

        print(
            "\n[INFO] Execução encerrada."
        )


# ============================================================
# INICIAR PROGRAMA
# ============================================================

if __name__ == "__main__":
    main()