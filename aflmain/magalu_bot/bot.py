import time
import random
import subprocess
import urllib.request
import re

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from magalu_bot.config.config import (
    CHROME_DEBUGGER,
    BASE_URL,
    LOGIN_URL,
    LOGIN_TIMEOUT,
)

from magalu_bot.persistencia.excel import (
    carregar_resultados,
    salvar_dados,
    produto_ja_processado,
)

from magalu_bot.automacao.categorias import (
    coletar_produtos_categoria
)

from magalu_bot.automacao.afiliados import (
    gerar_link_afiliado
)

from magalu_bot.relatorios.relatorios import (
    mostrar_resultados_interrompidos,
    mostrar_relatorio_final,
)

from magalu_bot.estados import (
    GerenciadorEstados,
    EstadoBot,
)


gerenciador_estado_atual = None


# =========================================================
# CONFIGURAÇÃO DO CHROME
# =========================================================

chrome_path = (
    r"C:\Program Files\Google\Chrome\Application\chrome.exe"
)

chrome = None
chrome_foi_aberto_pelo_programa = False

gerenciador_estado_atual = None


# =========================================================
# VERIFICAR CHROME NA PORTA 9222
# =========================================================

def chrome_9222_esta_aberto():

    """
    Verifica se já existe um Chrome respondendo
    na porta 9222.
    """

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
# DETECTAR SE A PÁGINA É DE LOGIN
# =========================================================

def pagina_eh_login(driver):

    """
    Determina se o navegador ainda está na tela
    de autenticação.

    Não depende somente da URL.
    """

    try:

        url_atual = driver.current_url.lower()

        # -------------------------------------------------
        # Indicador principal: URL
        # -------------------------------------------------

        if "/login" in url_atual:

            return True

        # -------------------------------------------------
        # Texto da página
        # -------------------------------------------------

        body = driver.find_element(
            By.TAG_NAME,
            "body"
        )

        texto = body.text.lower()

        indicadores = [
            "entrar",
            "senha",
            "e-mail",
            "email",
            "cpf",
        ]

        encontrados = 0

        for indicador in indicadores:

            if indicador in texto:

                encontrados += 1

        # Vários indicadores juntos reduzem falsos positivos.
        if encontrados >= 3:

            return True

        return False

    except Exception:

        return False


# =========================================================
# VERIFICAR LOGIN
# =========================================================

def verificar_login(driver):

    """
    Abre a página de login do Influenciador.

    Se já houver uma sessão válida, o próprio site poderá
    redirecionar o navegador para uma área autenticada.

    Retorna:

        True  -> usuário autenticado
        False -> ainda precisa fazer login
    """

    print("\n")
    print("=" * 70)
    print("                 VERIFICAÇÃO DE LOGIN")
    print("=" * 70)

    print(
        "\n[LOGIN] Abrindo página de login..."
    )

    driver.get(LOGIN_URL)

    time.sleep(3)

    print(
        "[LOGIN] URL atual:"
    )

    print(
        driver.current_url
    )

    # -----------------------------------------------------
    # Ainda está na tela de login?
    # -----------------------------------------------------

    if pagina_eh_login(driver):

        print(
            "[LOGIN] Nenhuma sessão autenticada foi detectada."
        )

        return False

    # -----------------------------------------------------
    # Foi redirecionado para uma área autenticada
    # -----------------------------------------------------

    print(
        "[OK] Sessão autenticada detectada."
    )

    return True


# =========================================================
# AGUARDAR LOGIN MANUAL
# =========================================================

def aguardar_login(
    driver,
    gerenciador_estado,
    timeout=LOGIN_TIMEOUT
):

    """
    Aguarda o usuário realizar o login manualmente.

    O bot NÃO preenche usuário, senha ou código.

    O usuário realiza todo o processo manualmente
    no Chrome.
    """

    gerenciador_estado.definir_estado(
        EstadoBot.AGUARDANDO_LOGIN
    )

    print("\n")
    print("=" * 70)
    print("                 LOGIN NECESSÁRIO")
    print("=" * 70)

    print(
        "\n[LOGIN] Faça o login manualmente no Chrome."
    )

    print(
        "[LOGIN] O bot está aguardando..."
    )

    print(
        f"[LOGIN] Tempo máximo: {timeout} segundos."
    )

    print("=" * 70)

    inicio = time.time()
    ultimo_aviso = 0

    while True:

        tempo_decorrido = time.time() - inicio

        # -------------------------------------------------
        # TIMEOUT
        # -------------------------------------------------

        if tempo_decorrido >= timeout:

            print(
                "\n[ERRO] Tempo máximo de login atingido."
            )

            return False

        # -------------------------------------------------
        # VERIFICAR SE LOGIN TERMINOU
        # -------------------------------------------------

        if not pagina_eh_login(driver):

            print(
                "\n[OK] Login concluído."
            )

            gerenciador_estado.definir_estado(
                EstadoBot.LOGADO
            )

            return True

        # -------------------------------------------------
        # AVISO PERIÓDICO
        # -------------------------------------------------

        agora = time.time()

        if agora - ultimo_aviso >= 10:

            restante = int(
                timeout - tempo_decorrido
            )

            print(
                f"[AGUARDANDO_LOGIN] "
                f"Faça o login no Chrome. "
                f"Restante: {restante}s"
            )

            ultimo_aviso = agora

        time.sleep(2)


# =========================================================
# DESCOBRIR LOJA VINCULADA À CONTA
# =========================================================

def descobrir_loja_vinculada(driver):

    """
    Tenta descobrir a URL da Loja Virtual vinculada
    à conta autenticada.

    A descoberta é feita através dos links presentes
    na área autenticada.

    Retorna:

        URL da loja

    ou:

        None
    """

    print("\n")
    print("=" * 70)
    print("              DESCOBRINDO SUA LOJA")
    print("=" * 70)

    # -----------------------------------------------------
    # Primeiro tenta a página atual
    # -----------------------------------------------------

    url_loja = procurar_link_loja_na_pagina(
        driver
    )

    if url_loja:

        print(
            f"[OK] Loja encontrada: {url_loja}"
        )

        return url_loja

    # -----------------------------------------------------
    # Tenta a página principal
    # -----------------------------------------------------

    print(
        "[INFO] Loja não encontrada na página atual."
    )

    print(
        "[INFO] Consultando página principal..."
    )

    try:

        driver.get(
            "https://www.magazinevoce.com.br/"
        )

        time.sleep(3)

        url_loja = procurar_link_loja_na_pagina(
            driver
        )

        if url_loja:

            print(
                f"[OK] Loja encontrada: {url_loja}"
            )

            return url_loja

    except Exception as erro:

        print(
            f"[AVISO] Falha ao consultar página principal: {erro}"
        )

    # -----------------------------------------------------
    # Não encontrou
    # -----------------------------------------------------

    print(
        "[ERRO] Não foi possível descobrir "
        "a loja vinculada à conta."
    )

    return None


# =========================================================
# PROCURAR LINK DA LOJA NA PÁGINA
# =========================================================

def procurar_link_loja_na_pagina(driver):

    """
    Procura links que tenham o formato:

        https://www.magazinevoce.com.br/NOME_DA_LOJA/

    Ignora páginas que não representam uma loja.
    """

    try:

        links = driver.find_elements(
            By.TAG_NAME,
            "a"
        )

        for link in links:

            try:

                href = link.get_attribute(
                    "href"
                )

                if not href:

                    continue

                href = href.strip()

                # -------------------------------------------------
                # Verificar domínio
                # -------------------------------------------------

                if not href.startswith(
                    "https://www.magazinevoce.com.br/"
                ):

                    continue

                # -------------------------------------------------
                # Remover query/hash
                # -------------------------------------------------

                href_limpo = href.split("?")[0]
                href_limpo = href_limpo.split("#")[0]

                # -------------------------------------------------
                # Procurar estrutura /slug/
                # -------------------------------------------------

                padrao = re.match(
                    r"^https://www\.magazinevoce\.com\.br/"
                    r"([^/]+)/?$",
                    href_limpo,
                    re.IGNORECASE
                )

                if not padrao:

                    continue

                slug = padrao.group(1).lower()

                # -------------------------------------------------
                # Ignorar páginas especiais
                # -------------------------------------------------

                ignorados = {
                    "",
                    "login",
                    "cadastro",
                    "blog",
                    "static",
                    "termos",
                    "privacidade",
                }

                if slug in ignorados:

                    continue

                # -------------------------------------------------
                # Evitar a raiz
                # -------------------------------------------------

                if slug == "www":

                    continue

                return href_limpo.rstrip("/") + "/"

            except Exception:

                continue

    except Exception:

        pass

    return None


# =========================================================
# EXECUTAR BOT
# =========================================================

def executar_bot(
    categorias_selecionadas=None,
    keywords_loop=None
):

    global gerenciador_estado_atual

    gerenciador_estado = GerenciadorEstados(
        EstadoBot.INICIANDO
    )

    gerenciador_estado_atual = gerenciador_estado

    executar_bot.gerenciador_estado = gerenciador_estado


    gerenciador_estado = GerenciadorEstados(
        EstadoBot.INICIANDO
    )

    executar_bot.gerenciador_estado = (
        gerenciador_estado
    )

    resultados = []

    processados_nesta_execucao = 0

    links_obtidos_nesta_execucao = 0

    driver = None

    try:

        # =================================================
        # VALIDAR CATEGORIAS
        # =================================================

        if not categorias_selecionadas:

            print(
                "[AVISO] Nenhuma categoria foi selecionada."
            )

            gerenciador_estado.definir_estado(
                EstadoBot.PARADO
            )

            return

        # =================================================
        # CARREGAR RESULTADOS
        # =================================================

        resultados = carregar_resultados()

        # =================================================
        # CHROME
        # =================================================

        iniciar_chrome_se_necessario()

        print("\n")
        print("=" * 70)

        print(
            "        MAGALU - COLETOR DE LINKS DE AFILIADO"
        )

        print("=" * 70)

        # =================================================
        # CONECTAR SELENIUM
        # =================================================

        print(
            "\n[INFO] Conectando ao Chrome..."
        )

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

        print(
            "[OK] Chrome conectado."
        )

        # =================================================
        # LOGIN — PRIMEIRA ETAPA REAL
        # =================================================

        gerenciador_estado.definir_estado(
            EstadoBot.VERIFICANDO_LOGIN
        )

        usuario_ja_logado = verificar_login(
            driver
        )

        # -------------------------------------------------
        # NÃO LOGADO
        # -------------------------------------------------

        if not usuario_ja_logado:

            login_realizado = aguardar_login(
                driver,
                gerenciador_estado,
                LOGIN_TIMEOUT
            )

            if not login_realizado:

                gerenciador_estado.definir_estado(
                    EstadoBot.ERRO
                )

                raise RuntimeError(
                    "O usuário não realizou o login "
                    "dentro do tempo permitido."
                )

        # -------------------------------------------------
        # LOGADO
        # -------------------------------------------------

        else:

            gerenciador_estado.definir_estado(
                EstadoBot.LOGADO
            )

        # =================================================
        # CONFIRMAÇÃO
        # =================================================

        if (
            gerenciador_estado.estado
            != EstadoBot.LOGADO
        ):

            raise RuntimeError(
                "Não foi possível confirmar "
                "o login do usuário."
            )

        print(
            "\n[OK] Autenticação confirmada."
        )

        # =================================================
        # DESCOBRIR LOJA
        # =================================================

        loja_url = descobrir_loja_vinculada(
            driver
        )

        if not loja_url:

            gerenciador_estado.definir_estado(
                EstadoBot.ERRO
            )

            raise RuntimeError(
                "Não foi possível descobrir "
                "a loja vinculada à conta."
            )

        # =================================================
        # ABRIR LOJA DA CONTA
        # =================================================

        print(
            "\n[INFO] Abrindo loja vinculada à conta..."
        )

        print(
            f"[LOJA] {loja_url}"
        )

        driver.get(
            loja_url
        )

        time.sleep(3)

        print(
            "[OK] Loja da conta aberta."
        )

        print(
            f"[URL] {driver.current_url}"
        )

        # =================================================
        # EXECUTANDO
        # =================================================

        gerenciador_estado.definir_estado(
            EstadoBot.EXECUTANDO
        )

        # =================================================
        # CATEGORIAS
        # =================================================

        print(
            "\n[INFO] Categorias que serão processadas:"
        )

        for categoria in categorias_selecionadas:

            print(
                f"  - {categoria}"
            )

        # =================================================
        # LOOP DAS CATEGORIAS
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

            # -------------------------------------------------
            # Coletar produtos
            # -------------------------------------------------

            produtos = coletar_produtos_categoria(
                driver,
                categoria
            )

            # -------------------------------------------------
            # Retomada
            # -------------------------------------------------

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

                    print(
                        produto
                    )

                    continue

                produtos_pendentes.append(
                    produto
                )

            print(
                f"\n[RETOMADA] "
                f"{len(produtos_pendentes)} "
                f"produtos pendentes."
            )

            print(
                f"[RETOMADA] "
                f"{len(produtos) - len(produtos_pendentes)} "
                f"produtos já concluídos."
            )

            # -------------------------------------------------
            # Produtos
            # -------------------------------------------------

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

                if not dados_afiliado:

                    dados_afiliado = {
                        "link_afiliado": None,
                        "preco_anterior": None,
                        "preco_atual": None,
                    }

                link_afiliado = (
                    dados_afiliado.get(
                        "link_afiliado"
                    )
                )

                preco_anterior = (
                    dados_afiliado.get(
                        "preco_anterior"
                    )
                )

                preco_atual = (
                    dados_afiliado.get(
                        "preco_atual"
                    )
                )

                # =========================================
                # CONTADORES
                # =========================================

                processados_nesta_execucao += 1

                if link_afiliado:

                    links_obtidos_nesta_execucao += 1

                # =========================================
                # RESULTADO EXISTENTE
                # =========================================

                resultado_existente = None

                for resultado in resultados:

                    if (
                        resultado["categoria"] == categoria
                        and resultado["link_produto"]
                        == url_produto
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
                        "Link de afiliado obtido "
                        "com sucesso."
                    )

                else:

                    status = "REVISAR"

                    detalhes = (
                        "Não foi possível obter "
                        "o link de afiliado."
                    )

                # =========================================
                # ATUALIZAR EXISTENTE
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
                        "[OK] Produto processado "
                        "com sucesso."
                    )

                else:

                    print(
                        "[AVISO] Produto sem "
                        "link de afiliado."
                    )

                # =========================================
                # SALVAMENTO
                # =========================================

                try:

                    salvar_dados(
                        resultados
                    )

                    print(
                        "[OK] Dados salvos "
                        "no Excel e CSV."
                    )

                except Exception as erro:

                    print(
                        "[ERRO] Falha ao salvar dados:"
                    )

                    print(
                        erro
                    )

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

            print(
                erro
            )

        # =================================================
        # RELATÓRIO
        # =================================================

        mostrar_relatorio_final(
            resultados,
            categorias_selecionadas,
            processados_nesta_execucao,
            links_obtidos_nesta_execucao
        )

        # =================================================
        # FINALIZADO
        # =================================================

        gerenciador_estado.definir_estado(
            EstadoBot.FINALIZADO
        )

    # =====================================================
    # CTRL + C
    # =====================================================

    except KeyboardInterrupt:

        gerenciador_estado.definir_estado(
            EstadoBot.PARADO
        )

        print(
            "\n[INFO] Ctrl+C detectado."
        )

        try:

            salvar_dados(
                resultados
            )

            print(
                "[OK] Dados salvos antes "
                "da interrupção."
            )

        except Exception as erro:

            print(
                f"[ERRO] Falha ao salvar "
                f"após Ctrl+C: {erro}"
            )

        mostrar_resultados_interrompidos(
            resultados,
            processados_nesta_execucao,
            links_obtidos_nesta_execucao
        )

    # =====================================================
    # ERRO FATAL
    # =====================================================

    except Exception as erro:

        gerenciador_estado.definir_estado(
            EstadoBot.ERRO
        )

        print("\n")
        print("=" * 70)
        print("                    ERRO FATAL")
        print("=" * 70)

        print(
            "\n[ERRO] A execução encontrou "
            "um erro inesperado:"
        )

        print(
            erro
        )

        print(
            "\n[INFO] Salvando os dados "
            "já coletados..."
        )

        try:

            salvar_dados(
                resultados
            )

            print(
                "[OK] Dados preservados "
                "nas planilhas."
            )

        except Exception as erro_dados:

            print(
                "[ERRO] Também não foi possível "
                "salvar nas planilhas:"
            )

            print(
                erro_dados
            )

    finally:

        print(
            "\n[INFO] Execução encerrada."
        )

        fechar_chrome_se_necessario()