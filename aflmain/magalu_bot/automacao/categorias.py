import random
import time
import urllib.parse
import re
import unicodedata
from collections import defaultdict

from selenium.webdriver.common.by import By

from magalu_bot.config.config import BASE_URL, LIMITE_POR_CATEGORIA


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

        if altura == altura_anterior:
            break

        altura_anterior = altura


def coletar_produtos_categoria(driver, categoria, base_url=None, pagina=1):
    print("\n")
    print("-" * 70)
    print(f"COLETANDO PRODUTOS: {categoria.upper()}")
    print("-" * 70)

    categoria_url = urllib.parse.quote(categoria, safe="")
    base_url = (base_url or BASE_URL).rstrip("/")
    url = f"{base_url}/busca/{categoria_url}/"
    if pagina and int(pagina) > 1:
        url += f"?page={int(pagina)}"

    print("[INFO] Abrindo:")
    print(url)

    driver.get(url)
    time.sleep(random.uniform(3, 4))

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

            if not link or "/p/" not in link:
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



def coletar_produtos_keyword(driver, keyword, base_url=None, pagina=1):
    """Busca produtos usando uma palavra-chave na mesma busca pública da vitrine.

    A função mantém o mesmo limite e deduplicação usados pelas categorias.
    """
    print("\n" + "-" * 70)
    print(f"COLETANDO PRODUTOS POR PALAVRA-CHAVE: {keyword.upper()}")
    print("-" * 70)

    termo = urllib.parse.quote(keyword.strip(), safe="")
    base_url = (base_url or BASE_URL).rstrip("/")
    url = f"{base_url}/busca/{termo}/"
    if pagina and int(pagina) > 1:
        url += f"?page={int(pagina)}"

    print(f"[INFO] Abrindo busca: {url}")
    driver.get(url)
    time.sleep(random.uniform(3, 4))
    rolar_pagina(driver)

    links, links_set = [], set()
    elementos = driver.find_elements(By.CSS_SELECTOR, "a[href*='/p/']")
    print(f"[INFO] Elementos encontrados: {len(elementos)}")

    for elemento in elementos:
        try:
            link = (elemento.get_attribute("href") or "").strip()
            if "/p/" not in link:
                continue
            link = link.split("?")[0].split("#")[0]
            if link not in links_set:
                links_set.add(link)
                links.append(link)
            if len(links) >= LIMITE_POR_CATEGORIA:
                break
        except Exception:
            continue

    print(f"[OK] {len(links)} produtos encontrados para '{keyword}'.")
    return links


_STOPWORDS_FAMILIA = {
    "de", "da", "do", "das", "dos", "para", "com", "sem", "e", "em", "por",
    "kit", "jogo", "produto", "novo", "nova", "unidade", "unidades", "cm", "mm",
    "preto", "preta", "branco", "branca", "cores", "cor", "modelo", "original",
}

def _normalizar_texto_familia(texto):
    texto = unicodedata.normalize("NFKD", str(texto or "")).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", " ", texto.lower()).strip()

def familia_produto(valor):
    """Extrai uma família semântica simples do nome ou slug da URL.

    A finalidade não é classificar o catálogo, mas evitar sequências visualmente
    repetitivas como armário/armário/armário quando há alternativas no mesmo lote.
    """
    texto = str(valor or "")
    if "://" in texto:
        try:
            path = urllib.parse.urlparse(texto).path.strip("/")
            antes_p = path.split("/p/", 1)[0]
            texto = antes_p.rsplit("/", 1)[-1] or path
        except Exception:
            pass
    tokens = [t for t in _normalizar_texto_familia(texto).split() if len(t) >= 3 and t not in _STOPWORDS_FAMILIA and not t.isdigit()]
    if not tokens:
        return "outros"
    # Dois termos reduzem colisões grosseiras, mantendo parentes próximos juntos.
    return " ".join(tokens[:2])

def ordenar_produtos_diversos(produtos, familias_recentes=None):
    """Reordena candidatos para alternar famílias, preservando o nicho/alvo."""
    produtos = list(dict.fromkeys(produtos or []))
    if len(produtos) < 2:
        return produtos

    grupos = defaultdict(list)
    ordem_familias = []
    for produto in produtos:
        familia = familia_produto(produto)
        if familia not in grupos:
            ordem_familias.append(familia)
        grupos[familia].append(produto)

    recentes = [str(x) for x in (familias_recentes or []) if x]
    resultado = []
    ultima = recentes[-1] if recentes else None
    historico = recentes[-4:]

    while any(grupos.values()):
        disponiveis = [f for f in ordem_familias if grupos[f]]
        if not disponiveis:
            break
        # Penaliza famílias usadas muito recentemente e evita alternância ABAB simples.
        def score(familia):
            penalidade = historico.count(familia) * 10
            if familia == ultima:
                penalidade += 20
            pos = ordem_familias.index(familia)
            return (penalidade, pos)
        escolhida = min(disponiveis, key=score)
        resultado.append(grupos[escolhida].pop(0))
        ultima = escolhida
        historico.append(escolhida)
        historico = historico[-4:]

    return resultado
