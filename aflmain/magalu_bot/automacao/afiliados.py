import re
import time
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from urllib.parse import urlparse

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from .logger import log_info, log_ok, log_revisar, log_erro


# O coletor deve ser resiliente, mas nunca pode ficar preso para sempre.
# Se um produto continuar problemático depois destas tentativas, ele é
# registrado como REVISAR e o fluxo segue para o próximo produto.
MAX_TENTATIVAS_AFILIADO = 4
TEMPO_ESPERA_LINK = 15
INTERVALO_CAPTURA = 0.25
PAUSA_ENTRE_TENTATIVAS = 1.5

HOSTS_AFILIADOS = (
    "divulgador.magalu.com",
    "magazineluiza.onelink.me",
)


def normalizar_preco(valor):
    """Normaliza textos de preço do Magalu para o formato monetário brasileiro."""
    if valor in (None, ""):
        return None
    texto = str(valor).strip()
    texto = re.sub(r"\b(?:ou|por|a partir de)\b", " ", texto, flags=re.IGNORECASE)
    match = re.search(
        r"(?:R\$\s*)?([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})|[0-9]+(?:,[0-9]{2})?)",
        texto,
    )
    if not match:
        return texto
    return f"R$ {match.group(1)}"


def validar_link_afiliado(link):
    """Aceita somente URLs nos domínios de saída conhecidos do afiliado Magalu."""
    if not link:
        return False
    try:
        parsed = urlparse(str(link).strip())
    except Exception:
        return False
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return False

    host = parsed.netloc.lower().split(":", 1)[0].rstrip(".")
    if not any(host == base or host.endswith("." + base) for base in HOSTS_AFILIADOS):
        return False

    caminho = (parsed.path or "").lower()
    if caminho == "/admin" or caminho.startswith("/admin/"):
        return False
    return True


def extrair_links_validos_de_texto(texto):
    """Extrai e valida URLs conhecidas de qualquer texto/HTML."""
    if not texto:
        return []
    encontrados = re.findall(r"https?://[^\s\"'<>]+", str(texto))
    resultado = []
    for candidato in encontrados:
        candidato = candidato.rstrip(".,);]}")
        if validar_link_afiliado(candidato) and candidato not in resultado:
            resultado.append(candidato)
    return resultado


def _valor_elemento(elemento):
    valores = []
    for atributo in ("value", "href", "data-url", "data-href", "data-link", "data-value"):
        try:
            valor = (elemento.get_attribute(atributo) or "").strip()
            if valor:
                valores.append(valor)
        except Exception:
            pass
    try:
        texto = (elemento.text or "").strip()
        if texto:
            valores.append(texto)
    except Exception:
        pass
    return valores


def _coletar_candidatos_dom(driver, somente_visiveis=True):
    """Coleta candidatos do DOM normal, priorizando elementos do modal."""
    candidatos = []
    elementos = []

    seletores_modal = [
        '[role="dialog"]',
        '[aria-modal="true"]',
        '[data-testid*="modal"]',
        '[data-testid*="dialog"]',
    ]
    for seletor in seletores_modal:
        try:
            elementos.extend(driver.find_elements(By.CSS_SELECTOR, seletor))
        except Exception:
            pass

    # Primeiro procuramos dentro dos containers que parecem ser o modal.
    containers = []
    vistos = set()
    for elemento in elementos:
        try:
            chave = elemento.id
            if chave not in vistos and (not somente_visiveis or elemento.is_displayed()):
                vistos.add(chave)
                containers.append(elemento)
        except Exception:
            continue

    def adicionar_elementos(container):
        try:
            encontrados = container.find_elements(By.CSS_SELECTOR, "input, textarea, a[href], [data-url], [data-href], [data-link], [data-value]")
            for elemento in encontrados:
                if somente_visiveis and not elemento.is_displayed():
                    continue
                for valor in _valor_elemento(elemento):
                    if validar_link_afiliado(valor) and valor not in candidatos:
                        candidatos.append(valor)
        except Exception:
            pass

    for container in containers:
        adicionar_elementos(container)

    # Depois, DOM visível geral. Isso cobre layouts em que o modal não possui
    # role/data-testid estável.
    try:
        for elemento in driver.find_elements(By.CSS_SELECTOR, "input, textarea, a[href], [data-url], [data-href], [data-link], [data-value]"):
            if somente_visiveis and not elemento.is_displayed():
                continue
            for valor in _valor_elemento(elemento):
                if validar_link_afiliado(valor) and valor not in candidatos:
                    candidatos.append(valor)
    except Exception:
        pass

    return candidatos


def _coletar_candidatos_shadow_dom(driver):
    """Percorre shadow roots abertos e retorna URLs de afiliado encontradas."""
    script = r"""
    const out = [];
    const seen = new Set();
    const attrs = ['value','href','data-url','data-href','data-link','data-value'];

    function visit(root) {
        if (!root || !root.querySelectorAll) return;
        for (const el of root.querySelectorAll('*')) {
            if (el.shadowRoot) visit(el.shadowRoot);
            const values = [];
            for (const a of attrs) {
                const v = el.getAttribute && el.getAttribute(a);
                if (v) values.push(v);
            }
            if ('value' in el && el.value) values.push(el.value);
            if (el.innerText) values.push(el.innerText);
            for (const value of values) {
                const text = String(value).trim();
                if (/^https?:\/\//i.test(text) && !seen.has(text)) {
                    seen.add(text);
                    out.push(text);
                }
            }
        }
    }
    visit(document);
    return out;
    """
    try:
        return [v for v in driver.execute_script(script) or [] if validar_link_afiliado(v)]
    except Exception:
        return []


def _fechar_modal(driver):
    try:
        driver.execute_script(
            "document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', code:'Escape', bubbles:true}));"
        )
    except Exception:
        pass
    time.sleep(0.3)


def _encontrar_botao_gerar(driver):
    seletores = [
        (By.CSS_SELECTOR, '[data-testid="phm-button-desktop"]'),
        (By.CSS_SELECTOR, '[data-testid="generate-link-button"]'),
        (By.XPATH, "//*[self::button or self::a][contains(normalize-space(.), 'Gerar link')]")
    ]
    ultimo_erro = None
    for seletor in seletores:
        try:
            botao = WebDriverWait(driver, 5).until(EC.element_to_be_clickable(seletor))
            if botao and botao.is_displayed():
                return botao
        except Exception as erro:
            ultimo_erro = erro
    raise RuntimeError(f"Botão 'Gerar link' não encontrado: {ultimo_erro}")


def _capturar_link_apos_clique(driver, links_antes):
    """Espera e tenta múltiplas estratégias até encontrar um link válido."""
    links_antes = set(links_antes or [])

    def procurar(_driver):
        candidatos = []

        # 1) Modal / DOM visível.
        candidatos.extend(_coletar_candidatos_dom(_driver, somente_visiveis=True))

        # 2) Shadow DOM aberto.
        candidatos.extend(_coletar_candidatos_shadow_dom(_driver))

        # 3) URL atual, caso o mecanismo tenha redirecionado.
        try:
            candidatos.append(_driver.current_url)
        except Exception:
            pass

        # 4) page_source como último recurso. Útil para conteúdo injetado sem
        # atributo óbvio no elemento que o Selenium encontra.
        try:
            candidatos.extend(extrair_links_validos_de_texto(_driver.page_source))
        except Exception:
            pass

        for candidato in candidatos:
            if validar_link_afiliado(candidato):
                # Se já existia antes do clique, ainda aceitamos quando veio de
                # um elemento visível do modal. Caso venha somente de page_source,
                # o chamador pode tentar novamente antes de aceitar um valor velho.
                return candidato
        return False

    return WebDriverWait(
        driver,
        TEMPO_ESPERA_LINK,
        poll_frequency=INTERVALO_CAPTURA,
        ignored_exceptions=(Exception,),
    ).until(procurar)


def _diagnostico_falha(driver, url_produto, tentativa):
    """Gera diagnóstico seguro, sem cookies, tokens ou credenciais."""
    try:
        url_atual = driver.current_url
    except Exception:
        url_atual = "<indisponível>"

    try:
        titulo = driver.title
    except Exception:
        titulo = "<indisponível>"

    linhas = [
        "[AFILIADO DEBUG]",
        f"Tentativa: {tentativa}",
        f"URL produto: {url_produto}",
        f"URL atual: {url_atual}",
        f"Título: {titulo}",
    ]

    try:
        modais = driver.find_elements(By.CSS_SELECTOR, '[role="dialog"], [aria-modal="true"]')
        linhas.append(f"Modais detectados: {len(modais)}")
        for indice, modal in enumerate(modais[:3], start=1):
            try:
                texto = (modal.text or "").strip()
                linhas.append(f"Modal {indice} texto: {texto[:1500]}")
                elementos = modal.find_elements(By.CSS_SELECTOR, "input, textarea, a[href], [data-url], [data-href], [data-link], [data-value]")
                linhas.append(f"Modal {indice} elementos relevantes: {len(elementos)}")
                for elemento in elementos[:30]:
                    valores = _valor_elemento(elemento)
                    if valores:
                        linhas.append(f"  valores: {str(valores)[:500]}")
            except Exception as erro:
                linhas.append(f"Modal {indice}: erro de inspeção: {erro}")
    except Exception as erro:
        linhas.append(f"Erro ao inspecionar modais: {erro}")

    try:
        links = _coletar_candidatos_dom(driver, somente_visiveis=True)
        linhas.append(f"Links afiliados visíveis detectados: {links[:20]}")
    except Exception as erro:
        linhas.append(f"Erro na coleta de links visíveis: {erro}")

    try:
        body_text = driver.find_element(By.TAG_NAME, "body").text
        linhas.append(f"Texto visível da página (amostra): {body_text[:2000]}")
    except Exception as erro:
        linhas.append(f"Erro ao ler texto da página: {erro}")

    # O diagnóstico propositalmente não grava page_source completo, cookies,
    # localStorage ou sessionStorage.
    return " | ".join(linhas)


def _capturar_precos(driver, url_produto):
    preco_anterior = None
    preco_atual = None

    try:
        elemento = WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, '[data-testid="price-original"]'))
        )
        preco_anterior = normalizar_preco(elemento.text)
        log_ok(f"Preço anterior encontrado: {preco_anterior}")
    except Exception:
        pass

    for seletor in (
        '[data-testid="price-value"]',
        '[data-testid="price-in-cash"]',
    ):
        try:
            elemento = WebDriverWait(driver, 4).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, seletor))
            )
            preco_atual = normalizar_preco(elemento.text)
            if preco_atual:
                log_ok(f"Preço atual encontrado: {preco_atual}")
                break
        except Exception:
            continue

    if preco_atual is None:
        log_revisar(f"Preço atual não encontrado. Produto: {url_produto}")

    return preco_anterior, preco_atual


def _capturar_nome(driver):
    for seletor in ('h1', 'meta[property="og:title"]'):
        try:
            el = driver.find_element(By.CSS_SELECTOR, seletor)
            valor = (el.get_attribute("content") if seletor.startswith("meta") else el.text) or ""
            if valor.strip():
                return valor.strip()
        except Exception:
            continue
    return ""


def _capturar_imagem(driver):
    try:
        elemento = driver.find_element(By.CSS_SELECTOR, 'meta[property="og:image"]')
        return (elemento.get_attribute("content") or "").strip()
    except Exception:
        return ""


def _normalizar_percentual(valor):
    if valor in (None, ""):
        return Decimal("0.00")
    texto = str(valor).strip().replace("%", "").replace(" ", "")
    texto = texto.replace(".", "").replace(",", ".") if texto.count(",") == 1 else texto.replace(",", ".")
    try:
        percentual = Decimal(texto)
    except (InvalidOperation, ValueError):
        return Decimal("0.00")
    if percentual < 0 or percentual > 100:
        return Decimal("0.00")
    return percentual.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def _normalizar_valor_monetario(valor):
    if valor in (None, ""):
        return None
    texto = str(valor).strip().replace("R$", "").replace(" ", "")
    if "," in texto:
        texto = texto.replace(".", "").replace(",", ".")
    try:
        return Decimal(texto).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, ValueError):
        return None


def _extrair_comissao_texto(texto):
    """Extrai comissão de textos do modal/página sem depender de um seletor fixo."""
    if not texto:
        return Decimal("0.00"), None

    texto = re.sub(r"\s+", " ", str(texto))
    rotulo = re.compile(r"(?:comiss(?:ão|ao)|commission)", re.IGNORECASE)
    percentual_regex = re.compile(r"([0-9]+(?:[.,][0-9]{1,2})?)\s*%")
    valor_regex = re.compile(r"R\$\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})|[0-9]+(?:,[0-9]{2})?)")

    for match_rotulo in rotulo.finditer(texto):
        trecho = texto[match_rotulo.start():min(len(texto), match_rotulo.end() + 140)]
        match_percentual = percentual_regex.search(trecho)
        if not match_percentual:
            continue
        percentual = _normalizar_percentual(match_percentual.group(1))
        if percentual <= 0:
            continue
        valor_match = valor_regex.search(trecho)
        valor = _normalizar_valor_monetario(valor_match.group(1)) if valor_match else None
        return percentual, valor

    # Também aceita layouts que exibem a porcentagem antes do rótulo.
    for match_percentual in percentual_regex.finditer(texto):
        trecho = texto[match_percentual.start():min(len(texto), match_percentual.end() + 80)]
        if rotulo.search(trecho):
            percentual = _normalizar_percentual(match_percentual.group(1))
            valor_match = valor_regex.search(trecho)
            valor = _normalizar_valor_monetario(valor_match.group(1)) if valor_match else None
            return percentual, valor

    return Decimal("0.00"), None


def _capturar_comissao(driver, preco_atual=None):
    """Captura a comissão exibida pelo Magalu, com fallback seguro para 0%.

    A interface do marketplace pode mudar; por isso a extração prioriza textos
    de modais visíveis e atributos que contenham 'comissao/commission', em vez
    de depender de um único seletor frágil. Nenhuma credencial é registrada.
    """
    textos = []
    try:
        modais = driver.find_elements(By.CSS_SELECTOR, '[role="dialog"], [aria-modal="true"], [data-testid*="modal"], [data-testid*="dialog"]')
        for modal in modais:
            try:
                if modal.is_displayed():
                    texto = (modal.text or "").strip()
                    if texto:
                        textos.append(texto)
            except Exception:
                continue
    except Exception:
        pass

    try:
        for elemento in driver.find_elements(By.CSS_SELECTOR, '[data-testid*="comiss"], [data-testid*="commission"], [class*="comiss"], [class*="commission"], [aria-label*="comiss"], [aria-label*="commission"]'):
            try:
                if elemento.is_displayed():
                    texto = (elemento.text or elemento.get_attribute("aria-label") or "").strip()
                    if texto:
                        textos.append(texto)
            except Exception:
                continue
    except Exception:
        pass

    try:
        body = driver.find_element(By.TAG_NAME, "body").text
        if body:
            textos.append(body)
    except Exception:
        pass

    for texto in textos:
        percentual, valor = _extrair_comissao_texto(texto)
        if percentual > 0 or valor is not None:
            if valor is None and percentual > 0 and preco_atual is not None:
                try:
                    valor = (Decimal(str(preco_atual).replace("R$", "").replace(".", "").replace(",", ".")) * percentual / Decimal("100")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                except (InvalidOperation, ValueError):
                    valor = None
            return percentual, valor or Decimal("0.00")

    return Decimal("0.00"), Decimal("0.00")


def _tentativa_gerar_link(driver, url_produto, tentativa):
    """Executa uma tentativa completa: abrir, aguardar, clicar e capturar."""
    log_info(f"Tentativa {tentativa}/{MAX_TENTATIVAS_AFILIADO} para gerar link: {url_produto}")

    driver.get(url_produto)
    time.sleep(2.5)

    preco_anterior, preco_atual = _capturar_precos(driver, url_produto)
    nome_produto = _capturar_nome(driver)
    imagem_url = _capturar_imagem(driver)

    botao = _encontrar_botao_gerar(driver)
    driver.execute_script("arguments[0].scrollIntoView({block:'center'});", botao)
    time.sleep(0.4)

    # Snapshot antes do clique para identificar links que já estavam na página.
    try:
        links_antes = _coletar_candidatos_dom(driver, somente_visiveis=False)
    except Exception:
        links_antes = []

    driver.execute_script("arguments[0].click();", botao)
    log_ok(f"Botão 'Gerar link' clicado (tentativa {tentativa}).")

    try:
        link = _capturar_link_apos_clique(driver, links_antes)
        if validar_link_afiliado(link):
            comissao_porcentagem, comissao_valor = _capturar_comissao(driver, preco_atual)
            log_ok(f"Link de afiliado obtido na tentativa {tentativa}: {link}")
            log_info(f"Comissão capturada: {comissao_porcentagem}%")
            _fechar_modal(driver)
            return link, preco_anterior, preco_atual, imagem_url, nome_produto, comissao_porcentagem, comissao_valor, None
    except Exception as erro:
        diagnostico = _diagnostico_falha(driver, url_produto, tentativa)
        log_revisar(f"Captura falhou na tentativa {tentativa}: {erro} | {diagnostico}")
        _fechar_modal(driver)
        return None, preco_anterior, preco_atual, imagem_url, nome_produto, Decimal("0.00"), Decimal("0.00"), str(erro)

    diagnostico = _diagnostico_falha(driver, url_produto, tentativa)
    _fechar_modal(driver)
    return None, preco_anterior, preco_atual, imagem_url, nome_produto, Decimal("0.00"), Decimal("0.00"), diagnostico


def gerar_link_afiliado(driver, wait, url_produto):
    """
    Gera e captura o link afiliado com tentativas limitadas.

    Importante: falhar não trava a fila. Depois de MAX_TENTATIVAS_AFILIADO
    tentativas independentes, o produto é retornado como REVISAR e o bot
    pode seguir para o próximo.
    """
    print("\n" + "-" * 70)
    print("PROCESSANDO PRODUTO")
    print("-" * 70)
    print(url_produto)

    preco_anterior = None
    preco_atual = None
    erros = []
    imagem_final = ""
    nome_final = ""
    comissao_porcentagem_final = Decimal("0.00")
    comissao_valor_final = Decimal("0.00")

    for tentativa in range(1, MAX_TENTATIVAS_AFILIADO + 1):
        try:
            (
                link, preco_ant, preco_atual_tentativa, imagem_url, nome_produto,
                comissao_porcentagem_tentativa, comissao_valor_tentativa, erro,
            ) = _tentativa_gerar_link(driver, url_produto, tentativa)
            if preco_ant:
                preco_anterior = preco_ant
            if preco_atual_tentativa:
                preco_atual = preco_atual_tentativa
            if imagem_url:
                imagem_final = imagem_url
            if nome_produto:
                nome_final = nome_produto
            if comissao_porcentagem_tentativa is not None:
                comissao_porcentagem_final = comissao_porcentagem_tentativa
            if comissao_valor_tentativa is not None:
                comissao_valor_final = comissao_valor_tentativa

            if link and validar_link_afiliado(link):
                return {
                    "link_afiliado": link,
                    "preco_anterior": preco_anterior,
                    "preco_atual": preco_atual,
                    "imagem_url": imagem_final,
                    "nome": nome_final,
                    "comissao_porcentagem": comissao_porcentagem_final,
                    "comissao_valor": comissao_valor_final,
                    "status": "OK",
                    "detalhes": f"Link obtido na tentativa {tentativa}.",
                }

            if erro:
                erros.append(f"tentativa {tentativa}: {erro}")

        except Exception as erro:
            erros.append(f"tentativa {tentativa}: {type(erro).__name__}: {erro}")
            log_revisar(f"Falha completa na tentativa {tentativa}: {erro}")
            try:
                _fechar_modal(driver)
            except Exception:
                pass

        if tentativa < MAX_TENTATIVAS_AFILIADO:
            log_info(
                f"Link não capturado. Reabrindo o produto e tentando novamente "
                f"({tentativa + 1}/{MAX_TENTATIVAS_AFILIADO})."
            )
            time.sleep(PAUSA_ENTRE_TENTATIVAS)

    detalhes = (
        f"Link não obtido após {MAX_TENTATIVAS_AFILIADO} tentativas. "
        "Produto marcado para revisão e o coletor seguirá para o próximo. "
        + " || ".join(erros[-4:])
    )
    log_erro(f"Falha definitiva de link após {MAX_TENTATIVAS_AFILIADO} tentativas: {url_produto}")
    return {
        "link_afiliado": None,
        "preco_anterior": preco_anterior,
        "preco_atual": preco_atual,
        "imagem_url": imagem_final,
        "nome": nome_final,
        "comissao_porcentagem": comissao_porcentagem_final,
        "comissao_valor": comissao_valor_final,
        "status": "REVISAR",
        "detalhes": detalhes,
    }
