import time
import random
import subprocess

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

from config.config import CHROME_DEBUGGER, BASE_URL

from persistencia.excel import (
    carregar_resultados,
    salvar_dados,
    produto_ja_processado,
)

from automacao.categorias import coletar_produtos_categoria
from automacao.afiliados import gerar_link_afiliado

from relatorios.relatorios import (
    mostrar_resultados_interrompidos,
    mostrar_relatorio_final,
)


# =========================================================
# CONFIGURAÇÃO DO CHROME
# =========================================================

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

chrome = None
chrome_foi_aberto_pelo_programa = False


# =========================================================
# VERIFICAR CHROME NA PORTA 9222
# =========================================================

def chrome_9222_esta_aberto():

    """
    Verifica se já existe um Chrome respondendo
    na porta 9222.
    """

    import urllib.request

    try:

        urllib.request.urlopen(
            "http://127.0.0.1:9222/json/version",
            timeout=1
        )

        return True

    except Exception:

        return False


# =========================================================
# INICIAR CHROME
# =========================================================

def iniciar_chrome_se_necessario():

    """
    Só abre o Chrome se a porta 9222 ainda não
    estiver disponível.
    """

    global chrome
    global chrome_foi_aberto_pelo_programa

    print(
        "\n[INFO] Verificando Chrome na porta 9222..."
    )

    if chrome_9222_esta_aberto():

        print(
            "[OK] Chrome já está aberto na porta 9222."
        )

        print(
            "[INFO] Nenhuma nova janela será aberta."
        )

        return

    print(
        "[INFO] Porta 9222 não está disponível."
    )

    print(
        "[INFO] Iniciando Chrome em modo debug..."
    )

    try:

        chrome = subprocess.Popen([
            chrome_path,
            "--remote-debugging-port=9222",
            r"--user-data-dir=C:\ChromeDebug"
        ])

        chrome_foi_aberto_pelo_programa = True

    except FileNotFoundError:

        print(
            "[ERRO] Chrome não encontrado!"
        )

        print(
            f"[CAMINHO] {chrome_path}"
        )

        raise

    except Exception as erro:

        print(
            f"[ERRO] Não foi possível abrir o Chrome: {erro}"
        )

        raise

    # -----------------------------------------------------
    # Aguarda porta 9222
    # -----------------------------------------------------

    for tentativa in range(10):

        if chrome_9222_esta_aberto():

            print(
                "[OK] Chrome foi aberto com sucesso!"
            )

            return

        time.sleep(1)

    print(
        "[ERRO] Chrome foi iniciado, "
        "mas a porta 9222 não respondeu."
    )

    raise RuntimeError(
        "Não foi possível conectar ao Chrome na porta 9222."
    )


# =========================================================
# FECHAR CHROME
# =========================================================

def fechar_chrome_se_necessario():

    """
    Fecha o Chrome somente se ele tiver sido
    aberto pelo programa.
    """

    global chrome
    global chrome_foi_aberto_pelo_programa

    if not chrome_foi_aberto_pelo_programa:

        print(
            "[INFO] Chrome já estava aberto antes da execução."
        )

        print(
            "[INFO] Chrome não será fechado."
        )

        return

    print(
        "\n[INFO] Fechando Chrome aberto pelo coletor..."
    )

    try:

        if chrome and chrome.poll() is None:

            chrome.terminate()

            try:

                chrome.wait(timeout=5)

                print(
                    "[OK] Chrome encerrado."
                )

            except subprocess.TimeoutExpired:

                print(
                    "[AVISO] Chrome não encerrou normalmente."
                )

                chrome.kill()

                print(
                    "[OK] Chrome finalizado."
                )

        else:

            print(
                "[INFO] Processo do Chrome já estava encerrado."
            )

    except Exception as erro:

        print(
            f"[AVISO] Não foi possível fechar o Chrome: {erro}"
        )

    finally:

        chrome_foi_aberto_pelo_programa = False


# =========================================================
# EXECUTAR BOT
# =========================================================

def executar_bot(
    categorias_selecionadas,
    keywords_loop=None
):

    """
    Executa o coletor Magalu.

    Esta função é a principal porta de entrada do bot.

    Futuramente o Django poderá chamar esta função
    diretamente, sem precisar executar o main.py.
    """

    resultados = carregar_resultados()

    iniciar_chrome_se_necessario()

    # -----------------------------------------------------
    # CONTADORES DA EXECUÇÃO ATUAL
    # -----------------------------------------------------

    processados_nesta_execucao = 0

    links_obtidos_nesta_execucao = 0

    print("\n")
    print("=" * 70)

    print(
        "        MAGALU - COLETOR DE LINKS DE AFILIADO"
    )

    print("=" * 70)

    print(
        "\n[INFO] Categorias que serão processadas:"
    )

    for categoria in categorias_selecionadas:

        print(
            f"  - {categoria}"
        )

    print(
        "\n[INFO] Conectando ao Chrome..."
    )

    options = Options()

    options.add_experimental_option(
        "debuggerAddress",
        CHROME_DEBUGGER
    )

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

        # =================================================
        # ABRIR VITRINE
        # =================================================

        print(
            "\n[1] Abrindo sua vitrine..."
        )

        driver.get(BASE_URL)

        time.sleep(3)

        print(
            "[OK] Vitrine aberta."
        )

        # =================================================
        # CATEGORIAS
        # =================================================

        for numero_categoria, categoria in enumerate(
            categorias_selecionadas,
            start=1
        ):

            print("\n")
            print("=" * 70)

            print(
                f"CATEGORIA {numero_categoria}/"
                f"{len(categorias_selecionadas)}: "
                f"{categoria.upper()}"
            )

            print("=" * 70)

            produtos = coletar_produtos_categoria(
                driver,
                categoria
            )

            # =============================================
            # RETOMADA
            # =============================================

            produtos_pendentes = []

            for produto in produtos:

                if produto_ja_processado(
                    resultados,
                    produto,
                    categoria
                ):

                    print(
                        "[RETOMADA] Produto já processado. "
                        "Pulando:"
                    )

                    print(produto)

                    continue

                produtos_pendentes.append(
                    produto
                )

            print(
                f"\n[RETOMADA] {len(produtos_pendentes)} "
                "produtos pendentes."
            )

            print(
                f"[RETOMADA] "
                f"{len(produtos) - len(produtos_pendentes)} "
                "produtos já concluídos."
            )

            # =============================================
            # PRODUTOS
            # =============================================

            for numero_produto, url_produto in enumerate(
                produtos_pendentes,
                start=1
            ):

                print(
                    f"\n[{categoria}] Produto pendente "
                    f"{numero_produto}/"
                    f"{len(produtos_pendentes)}"
                )

                # =========================================
                # GERAR LINK + PREÇOS
                # =========================================

                dados_afiliado = gerar_link_afiliado(
                    driver,
                    wait,
                    url_produto
                )

                # -------------------------------------------------
                # Proteção caso afiliados.py retorne None
                # -------------------------------------------------

                if not dados_afiliado:

                    dados_afiliado = {
                        "link_afiliado": None,
                        "preco_anterior": None,
                        "preco_atual": None,
                    }

                link_afiliado = dados_afiliado.get(
                    "link_afiliado"
                )

                preco_anterior = dados_afiliado.get(
                    "preco_anterior"
                )

                preco_atual = dados_afiliado.get(
                    "preco_atual"
                )

                # =========================================
                # CONTADORES
                # =========================================

                processados_nesta_execucao += 1

                if link_afiliado:

                    links_obtidos_nesta_execucao += 1

                # =========================================
                # VERIFICAR RESULTADO EXISTENTE
                # =========================================

                resultado_existente = None

                for resultado in resultados:

                    if (
                        resultado["categoria"] == categoria
                        and resultado["link_produto"] == url_produto
                    ):

                        resultado_existente = resultado

                        break

                # =========================================
                # STATUS
                # =========================================

                data_hora = time.strftime(
                    "%d/%m/%Y %H:%M:%S"
                )

                if link_afiliado:

                    status = "OK"

                    detalhes = (
                        "Link de afiliado obtido com sucesso."
                    )

                else:

                    status = "REVISAR"

                    detalhes = (
                        "Não foi possível obter "
                        "o link de afiliado."
                    )

                # =========================================
                # ATUALIZAR RESULTADO
                # =========================================

                if resultado_existente:

                    resultado_existente[
                        "link_afiliado"
                    ] = link_afiliado

                    resultado_existente[
                        "preco_anterior"
                    ] = preco_anterior

                    resultado_existente[
                        "preco_atual"
                    ] = preco_atual

                    resultado_existente[
                        "status"
                    ] = status

                    resultado_existente[
                        "data_hora"
                    ] = data_hora

                    resultado_existente[
                        "detalhes"
                    ] = detalhes

                # =========================================
                # NOVO RESULTADO
                # =========================================

                else:

                    resultados.append({

                        "categoria": categoria,

                        "produto_numero": numero_produto,

                        "link_produto": url_produto,

                        "link_afiliado": link_afiliado,

                        "preco_anterior": preco_anterior,

                        "preco_atual": preco_atual,

                        "status": status,

                        "data_hora": data_hora,

                        "detalhes": detalhes,

                    })

                # =========================================
                # TERMINAL
                # =========================================

                if preco_anterior:

                    print(
                        f"[PREÇO ANTERIOR] "
                        f"{preco_anterior}"
                    )

                else:

                    print(
                        "[PREÇO ANTERIOR] "
                        "Não informado"
                    )

                if preco_atual:

                    print(
                        f"[PREÇO ATUAL] "
                        f"{preco_atual}"
                    )

                else:

                    print(
                        "[PREÇO ATUAL] "
                        "Não encontrado"
                    )

                if link_afiliado:

                    print(
                        "[OK] Produto processado com sucesso."
                    )

                else:

                    print(
                        "[AVISO] Produto sem link de afiliado."
                    )

                # =========================================
                # SALVAMENTO
                # =========================================

                try:

                    salvar_dados(
                        resultados
                    )

                    print(
                        "[OK] Dados salvos no Excel e CSV."
                    )

                except Exception as erro:

                    print(
                        "[ERRO] Falha ao salvar dados:"
                    )

                    print(erro)

                time.sleep(
                    random.uniform(2, 4)
                )

        # =================================================
        # SALVAMENTO FINAL
        # =================================================

        try:

            salvar_dados(
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

        # =================================================
        # RELATÓRIO FINAL
        # =================================================

        mostrar_relatorio_final(
            resultados,
            categorias_selecionadas,
            processados_nesta_execucao,
            links_obtidos_nesta_execucao
        )

    # =====================================================
    # CTRL + C
    # =====================================================

    except KeyboardInterrupt:

        mostrar_resultados_interrompidos(
            resultados,
            processados_nesta_execucao,
            links_obtidos_nesta_execucao
        )

    # =====================================================
    # ERRO FATAL
    # =====================================================

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

            salvar_dados(
                resultados
            )

            print(
                "[OK] Dados preservados nas planilhas."
            )

        except Exception as erro_dados:

            print(
                "[ERRO] Também não foi possível "
                "salvar nas planilhas:"
            )

            print(erro_dados)

    finally:

        print(
            "\n[INFO] Execução encerrada."
        )

        fechar_chrome_se_necessario()