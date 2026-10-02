import time
import random
import subprocess
import urllib.request
import re
import threading

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

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
    coletar_produtos_categoria,
    coletar_produtos_keyword,
    ordenar_produtos_diversos,
    familia_produto,
)

from magalu_bot.automacao.afiliados import (
    gerar_link_afiliado,
)

from magalu_bot.relatorios.relatorios import (
    mostrar_resultados_interrompidos,
    mostrar_relatorio_final,
)

from magalu_bot.persistencia.django_db import (
    registrar_log, atualizar_execucao, salvar_produto_resultado, finalizar_execucao,
    obter_progresso_coleta, salvar_progresso_coleta,
)

from magalu_bot.estados import (
    GerenciadorEstados,
    EstadoBot,
)


# =========================================================
# ESTADO GLOBAL
# =========================================================

gerenciador_estado_atual = None


# =========================================================
# CONFIGURAÇÃO DO CHROME
# =========================================================

chrome_path = (
    r"C:\Program Files\Google\Chrome\Application\chrome.exe"
)

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

    try:
        urllib.request.urlopen(
            "http://127.0.0.1:9222/json/version",
            timeout=1,
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

    print("\n[INFO] Verificando Chrome na porta 9222...")

    if chrome_9222_esta_aberto():

        print("[OK] Chrome já está aberto na porta 9222.")
        print("[INFO] Nenhuma nova janela será aberta.")

        return

    print("[INFO] Porta 9222 não está disponível.")
    print("[INFO] Iniciando Chrome em modo debug...")

    try:

        chrome = subprocess.Popen(
            [
                chrome_path,
                "--remote-debugging-port=9222",
                r"--user-data-dir=C:\ChromeDebug",
            ]
        )

        chrome_foi_aberto_pelo_programa = True

    except FileNotFoundError:

        print("[ERRO] Chrome não encontrado!")
        print(f"[CAMINHO] {chrome_path}")

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

                print("[OK] Chrome encerrado.")

            except subprocess.TimeoutExpired:

                print(
                    "[AVISO] Chrome não encerrou normalmente."
                )

                chrome.kill()

                print("[OK] Chrome finalizado.")

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
            "body",
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

        if encontrados >= 3:

            return True

        return False

    except Exception:

        return False


# =========================================================
# VERIFICAR LOGIN
# =========================================================

def verificar_login(driver):

    print("\n")
    print("=" * 70)
    print("                 VERIFICAÇÃO DE LOGIN")
    print("=" * 70)

    print(
        "\n[LOGIN] Abrindo página de login..."
    )

    driver.get(LOGIN_URL)

    time.sleep(3)

    print("[LOGIN] URL atual:")
    print(driver.current_url)

    # -----------------------------------------------------
    # Ainda está na tela de login?
    # -----------------------------------------------------

    if pagina_eh_login(driver):

        print(
            "[LOGIN] Nenhuma sessão autenticada foi detectada."
        )

        return False

    # -----------------------------------------------------
    # Foi redirecionado para área autenticada
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
    timeout=LOGIN_TIMEOUT,
):

    gerenciador_estado.definir_estado(
        EstadoBot.AGUARDANDO_LOGIN
    )

    print("\n")
    print("=" * 70)
    print("                    LOGIN NECESSÁRIO")
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
        # VERIFICAR LOGIN
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
# DESCOBRIR LOJA VINCULADA
# =========================================================

def _normalizar_url_vitrine(url):
    if not url:
        return None
    try:
        from urllib.parse import urlparse
        parsed = urlparse(url.strip())
        if parsed.scheme not in {"http", "https"} or parsed.netloc.lower() != "www.magazinevoce.com.br":
            return None
        path = parsed.path.strip("/")
        partes = path.split("/") if path else []
        if len(partes) != 1:
            return None
        slug = partes[0].lower()
        reservados = {
            "admin", "login", "logout", "cadastro", "blog", "static",
            "termos", "privacidade", "ajuda", "busca", "favicon.ico",
            "robots.txt", "sitemap.xml", "api", "contato",
        }
        if not slug or slug in reservados:
            return None
        return f"https://www.magazinevoce.com.br/{slug}/"
    except Exception:
        return None


def descobrir_loja_vinculada(driver):
    """Descobre a vitrine da sessão autenticada sem aceitar /admin como loja.

    A descoberta usa primeiro links contextualizados como 'Minha loja/vitrine'
    e só depois candidatos genéricos. Cada candidato é normalizado e validado
    contra a sessão atual antes de ser aceito.
    """
    print("\n" + "=" * 70)
    print("              DESCOBRINDO SUA VITRINE AUTENTICADA")
    print("=" * 70)

    candidatos = []
    vistos = set()

    def adicionar(url, prioridade=0):
        url = _normalizar_url_vitrine(url)
        if url and url not in vistos:
            vistos.add(url)
            candidatos.append((prioridade, url))

    # 1) A página autenticada atual pode conter o atalho da vitrine.
    try:
        links = driver.find_elements(By.TAG_NAME, "a")
        for link in links:
            href = link.get_attribute("href") or ""
            texto = (link.text or "").strip().lower()
            if any(chave in texto for chave in ("minha loja", "minha vitrine", "minha loja magalu", "vitrine")):
                adicionar(href, 100)
    except Exception:
        pass

    # 2) Links da página autenticada: candidatos de raiz têm prioridade menor.
    try:
        for link in driver.find_elements(By.TAG_NAME, "a"):
            adicionar(link.get_attribute("href"), 30)
    except Exception:
        pass

    # 3) A homepage autenticada costuma expor a vitrine vinculada à conta.
    try:
        driver.get("https://www.magazinevoce.com.br/")
        time.sleep(3)
        for link in driver.find_elements(By.TAG_NAME, "a"):
            href = link.get_attribute("href") or ""
            texto = (link.text or "").strip().lower()
            prioridade = 90 if any(chave in texto for chave in ("minha loja", "minha vitrine", "vitrine")) else 20
            adicionar(href, prioridade)
    except Exception as erro:
        print(f"[AVISO] Não foi possível consultar a homepage autenticada: {erro}")

    candidatos.sort(key=lambda item: item[0], reverse=True)

    if not candidatos:
        print("[ERRO] Nenhuma vitrine válida foi encontrada na sessão autenticada.")
        return None

    for _, candidato in candidatos:
        try:
            print(f"[INFO] Validando vitrine candidata: {candidato}")
            driver.get(candidato)
            time.sleep(2.5)

            atual = driver.current_url.lower()
            if "/admin" in atual or "/login" in atual or pagina_eh_login(driver):
                print(f"[AVISO] Candidato rejeitado por redirecionamento: {atual}")
                continue

            normalizada_atual = _normalizar_url_vitrine(driver.current_url)
            if normalizada_atual != candidato:
                print(f"[AVISO] Candidato rejeitado: URL final não corresponde à vitrine: {driver.current_url}")
                continue

            print(f"[OK] Vitrine autenticada confirmada: {normalizada_atual}")
            return normalizada_atual
        except Exception as erro:
            print(f"[AVISO] Falha ao validar candidata {candidato}: {erro}")

    print("[ERRO] A sessão foi autenticada, mas nenhuma vitrine vinculada pôde ser validada.")
    return None


# =========================================================
# PROCURAR LINK DA LOJA
# =========================================================

def procurar_link_loja_na_pagina(driver):
    """Compatibilidade: retorna apenas uma vitrine raiz válida.

    Nunca considera /admin, /login ou outras rotas de sistema como vitrine.
    """
    try:
        for link in driver.find_elements(By.TAG_NAME, "a"):
            candidato = _normalizar_url_vitrine(link.get_attribute("href"))
            if candidato:
                return candidato
    except Exception:
        pass
    return None


# =========================================================
# VERIFICAR CONTROLE DO BOT
# =========================================================

def verificar_controle_bot(
    parar_evento,
    pausar_evento,
    gerenciador_estado,
):
    """
    Verifica PAUSAR/PARAR somente em pontos seguros.

    True  -> continua.
    False -> encerra a execução.
    """

    if parar_evento.is_set():
        gerenciador_estado.definir_estado(EstadoBot.PARANDO)
        print("\n[BOT] Parada solicitada. Finalizando no ponto seguro...")
        return False

    if pausar_evento.is_set():
        gerenciador_estado.definir_estado(EstadoBot.PAUSADO)

        print("\n[BOT] Execução pausada em ponto seguro.")
        print("[BOT] Clique em 'Retomar' para continuar.")

        while pausar_evento.is_set():
            if parar_evento.is_set():
                gerenciador_estado.definir_estado(EstadoBot.PARANDO)
                print("\n[BOT] Parada solicitada durante a pausa.")
                return False
            pausar_evento.wait(0.5)

        if parar_evento.is_set():
            gerenciador_estado.definir_estado(EstadoBot.PARANDO)
            return False

        gerenciador_estado.definir_estado(EstadoBot.EXECUTANDO)
        print("\n[BOT] Execução retomada.")

    return True


# =========================================================
# AGUARDAR RETOMADA
# =========================================================

def aguardar_retomada(
    parar_evento,
    pausar_evento,
    gerenciador_estado,
):

    """
    Mantém o bot pausado até o evento de pausa ser
    liberado.

    True  -> continuar
    False -> parar
    """

    return verificar_controle_bot(
        parar_evento,
        pausar_evento,
        gerenciador_estado,
    )


# =========================================================
# EXECUTAR BOT
# =========================================================

def executar_bot(
    categorias_selecionadas,
    keywords=None,
    keywords_loop=None,
    categorias_loop=None,
    parar_evento=None,
    pausar_evento=None,
    execution_id=None,
    owner_id=None,
):

    # =====================================================
    # EVENTOS
    # =====================================================

    if parar_evento is None:
        parar_evento = threading.Event()

    if pausar_evento is None:
        pausar_evento = threading.Event()

    if keywords is None:
        keywords = []

    if keywords_loop is None:
        keywords_loop = []

    if categorias_loop is None:
        categorias_loop = []

    if categorias_selecionadas is None:
        categorias_selecionadas = []

    # =====================================================
    # GERENCIADOR DE ESTADO
    # =====================================================

    global gerenciador_estado_atual

    gerenciador_estado = GerenciadorEstados(
        EstadoBot.INICIANDO
    )

    gerenciador_estado_atual = gerenciador_estado
    def registrar_evento(mensagem, nivel="INFO"):
        registrar_log(execution_id, mensagem, nivel)
        print(f"[{nivel}] {mensagem}")

    def atualizar_estado_db(estado):
        atualizar_execucao(execution_id, estado=estado.value)
        registrar_log(execution_id, f"Estado: {estado.value}", "INFO")


    # =====================================================
    # VARIÁVEIS
    # =====================================================

    resultados = []

    processados_nesta_execucao = 0

    links_obtidos_nesta_execucao = 0
    produtos_totais_nesta_execucao = 0

    driver = None

    execucao_parada = False

    # =====================================================
    # TRY PRINCIPAL
    # =====================================================

    try:

        # =================================================
        # VALIDAR ALVOS
        # =================================================

        categorias_selecionadas = [str(v).strip() for v in categorias_selecionadas if str(v).strip()]
        keywords = [str(v).strip() for v in keywords if str(v).strip()]
        keywords_loop = [str(v).strip() for v in keywords_loop if str(v).strip()]
        categorias_loop = [str(v).strip() for v in categorias_loop if str(v).strip()]

        if not categorias_selecionadas and not keywords:
            registrar_evento("Nenhuma categoria ou palavra-chave foi selecionada.", "ERROR")
            gerenciador_estado.definir_estado(EstadoBot.PARADO)
            finalizar_execucao(execution_id, EstadoBot.PARADO.value)
            return

        # O loop usa somente palavras-chave explicitamente marcadas.
        # A ordem enviada pela interface é preservada. Um novo ciclo
        # só começa depois que TODOS os termos do ciclo anterior foram
        # concluídos, evitando prender a execução em uma única chave.
        keywords_loop = [kw for kw in keywords if kw in set(keywords_loop)]
        categorias_loop = [cat for cat in categorias_selecionadas if cat in set(categorias_loop)]

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
            CHROME_DEBUGGER,
        )

        driver = webdriver.Chrome(
            options=options
        )

        wait = WebDriverWait(
            driver,
            15,
        )

        registrar_evento("Chrome conectado.", "OK")

        # =================================================
        # LOGIN
        # =================================================

        gerenciador_estado.definir_estado(
            EstadoBot.VERIFICANDO_LOGIN
        )

        usuario_ja_logado = verificar_login(
            driver
        )

        # =================================================
        # NÃO LOGADO
        # =================================================

        if not usuario_ja_logado:

            login_realizado = aguardar_login(
                driver,
                gerenciador_estado,
                LOGIN_TIMEOUT,
            )

            if not login_realizado:

                gerenciador_estado.definir_estado(
                    EstadoBot.ERRO
                )

                raise RuntimeError(
                    "O usuário não realizou o login "
                    "dentro do tempo permitido."
                )

        # =================================================
        # JÁ LOGADO
        # =================================================

        else:

            gerenciador_estado.definir_estado(
                EstadoBot.LOGADO
            )

        # =================================================
        # CONFIRMAÇÃO LOGIN
        # =================================================

        if (
            gerenciador_estado.estado
            != EstadoBot.LOGADO
        ):

            raise RuntimeError(
                "Não foi possível confirmar "
                "o login do usuário."
            )

        registrar_evento("Login confirmado.", "OK")

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
        # ABRIR LOJA
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
        # FILA DE ALVOS
        # =================================================

        alvos_uma_vez = [("categoria", valor) for valor in categorias_selecionadas if valor not in categorias_loop]
        alvos_uma_vez += [("keyword", valor) for valor in keywords if valor not in keywords_loop]
        alvos_loop = [("categoria", valor) for valor in categorias_loop] + [("keyword", valor) for valor in keywords_loop]
        ciclo_loop = 0
        primeiro_ciclo_loop = True
        # Cursor persistente por alvo: execuções recentes continuam de onde a
        # anterior avançou, evitando reanalisar imediatamente a página 1.
        progresso_alvos = {}
        for tipo, valor in [*(
            [("categoria", v) for v in categorias_selecionadas]
        ), *([("keyword", v) for v in keywords])]:
            progresso_alvos[(tipo, valor)] = obter_progresso_coleta(owner_id, tipo, valor)

        paginas_loop = {chave: progresso_alvos.get(chave, {}).get("pagina", 1) for chave in alvos_loop}
        buffers_loop = {(tipo, valor): [] for tipo, valor in alvos_loop}
        vistos_ciclo = set()
        ultimo_alvo_loop = None
        LOTE_REVEZAMENTO_LOOP = 2

        while True:
            if not verificar_controle_bot(parar_evento, pausar_evento, gerenciador_estado):
                execucao_parada = True
                break

            if primeiro_ciclo_loop:
                alvos = list(alvos_uma_vez)
                primeiro_ciclo_loop = False
            else:
                alvos = []

            # Loop contínuo para categorias e categorias personalizadas.
            # O limite de 20 é apenas o tamanho do lote/página, nunca o fim da execução.
            if alvos_loop:
                ciclo_loop += 1
                vistos_ciclo = set()
                if ciclo_loop > 1 or not alvos:
                    registrar_evento(f"Iniciando ciclo contínuo #{ciclo_loop}.", "INFO")
                # Em loop, a fila muda levemente a cada rodada para não favorecer
                # sempre a mesma categoria. Quando há mais de um alvo, evitamos
                # começar pela mesma categoria que encerrou a rodada anterior.
                fila_loop = list(alvos_loop)
                random.shuffle(fila_loop)
                if len(fila_loop) > 1 and ultimo_alvo_loop is not None and fila_loop[0] == ultimo_alvo_loop:
                    fila_loop.append(fila_loop.pop(0))
                alvos += fila_loop

            if not alvos:
                break

            for numero_alvo, (tipo_alvo, alvo) in enumerate(alvos, start=1):
                if not verificar_controle_bot(parar_evento, pausar_evento, gerenciador_estado):
                    execucao_parada = True
                    break

                categoria_resultado = alvo if tipo_alvo == "categoria" else f"keyword:{alvo}"
                registrar_evento(
                    f"Processando {tipo_alvo}: {alvo.upper()} ({numero_alvo}/{len(alvos)}).",
                    "INFO",
                )

                chave_alvo = (tipo_alvo, alvo)
                em_loop = chave_alvo in paginas_loop
                progresso_atual = progresso_alvos.get(chave_alvo) or obter_progresso_coleta(owner_id, tipo_alvo, alvo)
                pagina = paginas_loop.get(chave_alvo, progresso_atual.get("pagina", 1)) if em_loop else progresso_atual.get("pagina", 1)
                familias_recentes = list(progresso_atual.get("familias_recentes", []))
                if progresso_atual.get("retomado"):
                    registrar_evento(f"Retomando {alvo} a partir da página {pagina} por progresso recente.", "INFO")
                    progresso_atual["retomado"] = False
                    progresso_alvos[chave_alvo] = progresso_atual

                if em_loop and buffers_loop.get(chave_alvo):
                    # Reaproveita o restante do lote anterior. Assim o revezamento de
                    # dois produtos não descarta os demais itens da página coletada.
                    produtos = buffers_loop[chave_alvo]
                    novos_produtos_coletados = False
                else:
                    if tipo_alvo == "categoria":
                        produtos = coletar_produtos_categoria(driver, alvo, base_url=loja_url, pagina=pagina)
                    else:
                        produtos = coletar_produtos_keyword(driver, alvo, base_url=loja_url, pagina=pagina)
                    novos_produtos_coletados = True

                    if produtos:
                        # Se a página retomada estiver saturada de itens já concluídos,
                        # pula algumas páginas consecutivas antes de gastar Selenium
                        # novamente nesses mesmos produtos.
                        tentativas_pagina = 0
                        while tentativas_pagina < 3:
                            ja_processados = sum(
                                1 for produto in produtos
                                if produto_ja_processado(resultados, produto, categoria_resultado)
                            )
                            proporcao = ja_processados / max(1, len(produtos))
                            if proporcao < 0.70:
                                break
                            pagina += 1
                            tentativas_pagina += 1
                            registrar_evento(
                                f"Página saturada ({ja_processados}/{len(produtos)} já processados) em {alvo}; avançando para a página {pagina}.",
                                "INFO",
                            )
                            if tipo_alvo == "categoria":
                                produtos = coletar_produtos_categoria(driver, alvo, base_url=loja_url, pagina=pagina)
                            else:
                                produtos = coletar_produtos_keyword(driver, alvo, base_url=loja_url, pagina=pagina)
                            if not produtos:
                                break

                    if produtos:
                        produtos = ordenar_produtos_diversos(produtos, familias_recentes)
                        proxima_pagina = pagina + 1
                        salvar_progresso_coleta(owner_id, tipo_alvo, alvo, proxima_pagina, familias_recentes)
                        progresso_alvos[chave_alvo] = {
                            "pagina": proxima_pagina,
                            "familias_recentes": familias_recentes,
                            "retomado": False,
                        }
                        if em_loop:
                            paginas_loop[chave_alvo] = proxima_pagina
                            buffers_loop[chave_alvo] = list(produtos)
                    else:
                        salvar_progresso_coleta(owner_id, tipo_alvo, alvo, 1, [])
                        progresso_alvos[chave_alvo] = {"pagina": 1, "familias_recentes": [], "retomado": False}
                        if em_loop:
                            paginas_loop[chave_alvo] = 1
                            buffers_loop[chave_alvo] = []
                        registrar_evento(
                            f"Fim dos resultados de {alvo}; voltando à página 1 no próximo ciclo.",
                            "INFO",
                        )

                if novos_produtos_coletados:
                    produtos_totais_nesta_execucao += len(produtos)
                    atualizar_execucao(execution_id, produtos_total=produtos_totais_nesta_execucao)

                if not produtos:
                    registrar_evento(f"Nenhum produto encontrado para {alvo}.", "WARNING")
                    ultimo_alvo_loop = chave_alvo if em_loop else ultimo_alvo_loop
                    continue

                if em_loop:
                    # Cada passagem consome somente um pequeno lote do alvo atual.
                    # O restante fica em memória para a próxima vez que a fila voltar
                    # a esta categoria, garantindo revezamento real sem perder itens.
                    candidatos = [
                        produto for produto in buffers_loop[chave_alvo]
                        if produto not in vistos_ciclo
                        and not produto_ja_processado(resultados, produto, categoria_resultado)
                    ]
                    produtos_pendentes = candidatos[:LOTE_REVEZAMENTO_LOOP]
                    consumidos = set(produtos_pendentes)
                    buffers_loop[chave_alvo] = [p for p in buffers_loop[chave_alvo] if p not in consumidos]
                    vistos_ciclo.update(produtos_pendentes)
                    ultimo_alvo_loop = chave_alvo
                else:
                    # Sem loop, a quantidade configurada continua sendo o limite do
                    # alvo atual (LIMITE_POR_CATEGORIA, hoje 20) antes de avançar.
                    produtos_pendentes = [
                        produto for produto in produtos
                        if not produto_ja_processado(resultados, produto, categoria_resultado)
                    ]

                registrar_evento(
                    f"{len(produtos_pendentes)} produtos pendentes; "
                    f"{len(produtos) - len(produtos_pendentes)} já processados.",
                    "INFO",
                )

                for numero_produto, url_produto in enumerate(produtos_pendentes, start=1):
                    if not verificar_controle_bot(parar_evento, pausar_evento, gerenciador_estado):
                        execucao_parada = True
                        break

                    print(f"\n[{categoria_resultado}] Produto pendente {numero_produto}/{len(produtos_pendentes)}")
                    dados_afiliado = gerar_link_afiliado(driver, wait, url_produto) or {}
                    link_afiliado = dados_afiliado.get("link_afiliado")
                    preco_anterior = dados_afiliado.get("preco_anterior")
                    preco_atual = dados_afiliado.get("preco_atual")
                    status = dados_afiliado.get("status") or ("OK" if link_afiliado else "REVISAR")
                    detalhes = dados_afiliado.get("detalhes") or (
                        "Link de afiliado obtido com sucesso." if link_afiliado
                        else "Não foi possível obter o link de afiliado após as tentativas configuradas."
                    )

                    # Atualiza o pequeno histórico semântico com o nome real quando
                    # disponível. Isso melhora a variedade nas próximas passagens.
                    familia_atual = familia_produto(dados_afiliado.get("nome") or url_produto)
                    familias_recentes = [f for f in familias_recentes if f != familia_atual]
                    familias_recentes.append(familia_atual)
                    familias_recentes = familias_recentes[-8:]
                    progresso_alvos.setdefault(chave_alvo, {})["familias_recentes"] = familias_recentes
                    salvar_progresso_coleta(
                        owner_id, tipo_alvo, alvo,
                        progresso_alvos.get(chave_alvo, {}).get("pagina", pagina + 1),
                        familias_recentes,
                    )

                    # Um produto só conta como LINK obtido quando a URL foi
                    # efetivamente capturada e validada pelo módulo de afiliados.
                    processados_nesta_execucao += 1
                    if link_afiliado:
                        links_obtidos_nesta_execucao += 1
                        registrar_evento(f"Link obtido para {url_produto}", "OK")
                    else:
                        registrar_evento(
                            f"Produto marcado para revisão após tentativas limitadas: {url_produto}",
                            "WARNING",
                        )

                    data_hora = time.strftime("%d/%m/%Y %H:%M:%S")
                    resultado_existente = next(
                        (r for r in resultados
                         if r.get("categoria") == categoria_resultado
                         and r.get("link_produto") == url_produto),
                        None,
                    )

                    if resultado_existente:
                        resultado_existente.update({
                            "link_afiliado": link_afiliado,
                            "preco_anterior": preco_anterior,
                            "preco_atual": preco_atual,
                            "status": status,
                            "data_hora": data_hora,
                            "detalhes": detalhes,
                        })
                    else:
                        resultados.append({
                            "categoria": categoria_resultado,
                            "produto_numero": numero_produto,
                            "link_produto": url_produto,
                            "link_afiliado": link_afiliado,
                            "preco_anterior": preco_anterior,
                            "preco_atual": preco_atual,
                            "status": status,
                            "data_hora": data_hora,
                            "detalhes": detalhes,
                        })

                    try:
                        salvar_produto_resultado(
                            execution_id,
                            categoria_resultado,
                            url_produto,
                            {
                                "nome": dados_afiliado.get("nome") or (resultado_existente.get("nome", "") if resultado_existente else ""),
                                "link_afiliado": link_afiliado,
                                "preco_anterior": preco_anterior,
                                "preco_atual": preco_atual,
                                "imagem_url": dados_afiliado.get("imagem_url", ""),
                                "status": status,
                                "marketplace": "MAGALU",
                            },
                            numero=processados_nesta_execucao,
                            owner_id=owner_id,
                        )
                        atualizar_execucao(
                            execution_id,
                            produtos_processados=processados_nesta_execucao,
                            links_obtidos=links_obtidos_nesta_execucao,
                        )
                    except Exception as erro_db:
                        registrar_evento(f"Falha ao persistir produto no banco: {erro_db}", "ERROR")

                    # Publicação automática: dispara imediatamente após o link afiliado
                    # ser coletado e persistido com sucesso, sem depender da tela
                    # "Gerar oferta" ou de uma configuração manual para habilitar o fluxo.
                    if link_afiliado:
                        try:
                            from core.models import Produto as ProdutoModel
                            from core.services import criar_oferta
                            from core.publicacao import publicar_oferta
                            from core.config_service import obter_config_automacao
                            produto_db = ProdutoModel.objects.get(owner_id=owner_id, url_produto=url_produto)
                            cfg_auto = obter_config_automacao(owner_id=owner_id)
                            oferta_db = criar_oferta(produto_db, turno=cfg_auto.turno_padrao or None, campanha=cfg_auto.campanha_sazonal or "NENHUM")
                            if cfg_auto.auto_publicar_ofertas:
                                canais_auto = [str(c).strip().upper() for c in (cfg_auto.canais_automaticos or []) if str(c).strip()]
                                if not canais_auto:
                                    canais_auto = ["TELEGRAM"]
                                resultado_publicacao = publicar_oferta(oferta_db, canais=canais_auto, driver=driver, campanha=cfg_auto.campanha_sazonal or "NENHUM")
                                falhas = {c: v for c, v in resultado_publicacao.items() if str(v).startswith(("FALHOU:", "ERRO:"))}
                                caches = {c: v for c, v in resultado_publicacao.items() if v == "CACHE"}
                                enviados = {c: v for c, v in resultado_publicacao.items() if v == "ENVIADO"}
                                if enviados:
                                    registrar_evento(f"Publicação inteligente ENVIADO: {enviados}", "OK")
                                if caches:
                                    registrar_evento(f"Publicação inteligente CACHE: {caches} — produto ainda no período de retenção.", "INFO")
                                if falhas:
                                    registrar_evento(f"Publicação inteligente FALHOU: {falhas}", "WARNING")
                            else:
                                registrar_evento("Oferta criada; publicação automática está desativada nas Configurações.", "INFO")
                        except Exception as erro_publicacao:
                            registrar_evento(f"Falha na publicação automática (coleta preservada): {erro_publicacao}", "WARNING")

                    try:
                        salvar_dados(resultados)
                        registrar_evento("Dados salvos no Excel e CSV.", "OK")
                    except Exception as erro:
                        registrar_evento(f"Falha ao salvar Excel/CSV: {erro}", "ERROR")

                    for _ in range(int(random.uniform(2, 4) * 10)):
                        if not verificar_controle_bot(parar_evento, pausar_evento, gerenciador_estado):
                            execucao_parada = True
                            break
                        time.sleep(0.1)
                    if execucao_parada:
                        break

                if execucao_parada:
                    break

            if execucao_parada:
                break

            # Sem qualquer alvo em loop, a execução termina depois de uma passagem.
            if not alvos_loop:
                break

            # Com loop, somente o usuário (ou erro fatal externo) encerra a execução.
            registrar_evento(
                f"Ciclo contínuo #{ciclo_loop} concluído. Iniciando nova rodada.",
                "OK",
            )

        # =====================================================
        # SALVAMENTO FINAL
        # =====================================================

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

        # =====================================================
        # SE FOI PARADO
        # =====================================================

        if execucao_parada or parar_evento.is_set():

            gerenciador_estado.definir_estado(
                EstadoBot.PARADO
            )

            mostrar_resultados_interrompidos(
                resultados,
                processados_nesta_execucao,
                links_obtidos_nesta_execucao,
            )

            return

        # =====================================================
        # RELATÓRIO FINAL
        # =====================================================

        mostrar_relatorio_final(
            resultados,
            categorias_selecionadas,
            processados_nesta_execucao,
            links_obtidos_nesta_execucao,
        )

        # =====================================================
        # FINALIZADO
        # =====================================================

        gerenciador_estado.definir_estado(
            EstadoBot.FINALIZADO
        )
        finalizar_execucao(execution_id, EstadoBot.FINALIZADO.value)

    # =====================================================
    # CTRL + C
    # =====================================================

    except KeyboardInterrupt:

        gerenciador_estado.definir_estado(
            EstadoBot.PARANDO
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

        try:

            mostrar_resultados_interrompidos(
                resultados,
                processados_nesta_execucao,
                links_obtidos_nesta_execucao,
            )

        except Exception as erro:

            print(
                f"[ERRO] Falha ao gerar relatório "
                f"de interrupção: {erro}"
            )

        gerenciador_estado.definir_estado(
            EstadoBot.PARADO
        )

    # =====================================================
    # ERRO FATAL
    # =====================================================

    except Exception as erro:

        gerenciador_estado.definir_estado(
            EstadoBot.ERRO
        )
        finalizar_execucao(execution_id, EstadoBot.ERRO.value, str(erro))

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

            print(erro_dados)

    # =====================================================
    # FINALMENTE
    # =====================================================

    finally:

        print(
            "\n[INFO] Execução encerrada."
        )

        fechar_chrome_se_necessario()