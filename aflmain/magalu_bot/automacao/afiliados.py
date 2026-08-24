import time
import random
import re
from urllib.parse import urlparse

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from .logger import log_info, log_ok, log_revisar, log_erro


def normalizar_preco(valor):
    """Normaliza textos de preço do Magalu para o formato monetário brasileiro."""
    if valor in (None, ""):
        return None
    texto = str(valor).strip()
    # Remove marcadores comuns exibidos pela página, como "ou" e "por".
    texto = re.sub(r"\b(?:ou|por|a partir de)\b", " ", texto, flags=re.IGNORECASE)
    # Mantém somente o primeiro valor monetário encontrado.
    match = re.search(r"(?:R\$\s*)?([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{2})|[0-9]+(?:,[0-9]{2})?)", texto)
    if not match:
        return texto
    numero = match.group(1)
    return f"R$ {numero}"


def validar_link_afiliado(link):
    """Valida formatos conhecidos de links gerados pela plataforma Magalu."""
    if not link:
        return False
    try:
        parsed = urlparse(link.strip())
    except Exception:
        return False
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return False

    host = parsed.netloc.lower().split(":", 1)[0].rstrip(".")
    # Somente domínios de saída gerados pelo mecanismo de afiliados.
    # A URL da vitrine/produto (magazinevoce.com.br) NÃO é afiliada e
    # não pode ser aceita como fallback.
    hosts_permitidos = (
        "divulgador.magalu.com",
        "magazineluiza.onelink.me",
    )
    if not any(host == base or host.endswith("." + base) for base in hosts_permitidos):
        return False

    caminho = (parsed.path or "").lower()
    # Nunca aceite rotas administrativas como resultado de geração de link.
    if caminho == "/admin" or caminho.startswith("/admin/"):
        return False
    return True


def gerar_link_afiliado(driver, wait, url_produto):

    print("\n")
    print("-" * 70)
    print("ABRINDO PRODUTO")
    print("-" * 70)
    print(url_produto)

    log_info(f"Abrindo produto: {url_produto}")

    driver.get(url_produto)
    time.sleep(random.uniform(2.5, 4))

    # =========================================================
    # CAPTURA DOS PREÇOS
    # =========================================================

    preco_anterior = None
    preco_atual = None

    # ---------------------------------------------------------
    # PREÇO ANTERIOR / ORIGINAL
    # ---------------------------------------------------------

    try:

        elemento_preco_anterior = WebDriverWait(
            driver,
            5
        ).until(
            EC.presence_of_element_located(
                (
                    By.CSS_SELECTOR,
                    '[data-testid="price-original"]'
                )
            )
        )

        preco_anterior = normalizar_preco(elemento_preco_anterior.text)

        log_ok(
            f"Preço anterior encontrado: {preco_anterior}"
        )

        print(
            f"[PREÇO ANTERIOR] {preco_anterior}"
        )

    except Exception:

        # Nem todo produto possui preço anterior.
        preco_anterior = None

        print(
            "[INFO] Produto sem preço anterior/original."
        )

    # ---------------------------------------------------------
    # PREÇO ATUAL
    # ---------------------------------------------------------

    try:

        elemento_preco_atual = WebDriverWait(
            driver,
            5
        ).until(
            EC.presence_of_element_located(
                (
                By.CSS_SELECTOR,
                    '[data-testid="price-value"]'
                )
            )
        )

        preco_atual = normalizar_preco(elemento_preco_atual.text)

        log_ok(
            f"Preço atual encontrado: {preco_atual}"
        )

        print(
            f"[PREÇO ATUAL] {preco_atual}"
        )

    except Exception as erro:

        preco_atual = None

        log_revisar(
            f"Não consegui encontrar o preço atual. "
            f"Produto: {url_produto} | Erro: {erro}"
        )

        print(
            "[AVISO] Preço atual não encontrado."
        )

    # =========================================================
    # GERAR LINK DE AFILIADO
    # =========================================================

    try:

        botao = None
        seletores_botao = [
            (By.CSS_SELECTOR, '[data-testid="phm-button-desktop"]'),
            (By.CSS_SELECTOR, '[data-testid="generate-link-button"]'),
            (By.XPATH, "//*[self::button or self::a][contains(normalize-space(.), 'Gerar link')]")
        ]
        ultimo_erro = None
        for seletor in seletores_botao:
            try:
                botao = WebDriverWait(driver, 5).until(EC.element_to_be_clickable(seletor))
                if botao and botao.is_displayed():
                    break
            except Exception as erro:  # tenta o próximo seletor
                ultimo_erro = erro
                botao = None
        if botao is None:
            raise RuntimeError(f"Botão 'Gerar link' não encontrado na vitrine autenticada: {ultimo_erro}")

        log_ok("Botão 'Gerar link' encontrado.")

        driver.execute_script(
            "arguments[0].scrollIntoView({block: 'center'});",
            botao
        )

        time.sleep(0.5)

        driver.execute_script(
            "arguments[0].click();",
            botao
        )

        log_ok("Botão 'Gerar link' clicado.")

    except Exception as erro:

        log_erro(
            f"Não foi possível clicar em 'Gerar link'. "
            f"Produto: {url_produto} | Erro: {erro}"
        )

        return {
            "link_afiliado": None,
            "preco_anterior": preco_anterior,
            "preco_atual": preco_atual
        }

    # =========================================================
    # ENCONTRAR LINK NO MODAL
    # =========================================================

    try:
        def encontrar_link_valido(driver):
            # O Magalu pode preencher o campo alguns segundos depois
            # de o modal aparecer. Por isso procuramos repetidamente
            # pelo VALOR da URL, e não apenas pela presença do input.
            candidatos = []
            elementos = driver.find_elements(By.CSS_SELECTOR, "input, textarea, a[href], [data-testid]")

            for elemento in elementos:
                try:
                    if not elemento.is_displayed():
                        continue
                    valores = [
                        elemento.get_attribute("value"),
                        elemento.get_attribute("href"),
                        elemento.get_attribute("data-url"),
                        elemento.get_attribute("data-href"),
                        elemento.text,
                    ]
                    for valor in valores:
                        valor = (valor or "").strip()
                        if valor.startswith(("http://", "https://")):
                            candidatos.append(valor)
                except Exception:
                    continue

            # Prioriza os formatos conhecidos de link afiliado.
            for candidato in candidatos:
                if validar_link_afiliado(candidato):
                    return candidato
            return False

        link_afiliado = WebDriverWait(
            driver, 12, poll_frequency=0.25
        ).until(encontrar_link_valido)

        log_ok(f"Link de afiliado obtido: {link_afiliado}")
        print("[OK] Link de afiliado obtido:")
        print(link_afiliado)

        # Fecha o modal para evitar que o estado do produto seguinte seja
        # contaminado pelo modal anterior.
        try:
            driver.execute_script("document.dispatchEvent(new KeyboardEvent('keydown', {key:'Escape', code:'Escape', bubbles:true}));")
        except Exception:
            pass

        return {
            "link_afiliado": link_afiliado,
            "preco_anterior": preco_anterior,
            "preco_atual": preco_atual
        }

    except Exception as erro:

        log_revisar(
            f"Não consegui encontrar o link no modal. "
            f"Produto: {url_produto} | Erro: {erro}"
        )

        return {
            "link_afiliado": None,
            "preco_anterior": preco_anterior,
            "preco_atual": preco_atual
        }