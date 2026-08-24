import random
import time
import urllib.parse

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


def coletar_produtos_categoria(driver, categoria, base_url=None):
    print("\n")
    print("-" * 70)
    print(f"COLETANDO PRODUTOS: {categoria.upper()}")
    print("-" * 70)

    categoria_url = urllib.parse.quote(categoria, safe="")
    base_url = (base_url or BASE_URL).rstrip("/")
    url = f"{base_url}/busca/{categoria_url}/"

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



def coletar_produtos_keyword(driver, keyword, base_url=None):
    """Busca produtos usando uma palavra-chave na mesma busca pública da vitrine.

    A função mantém o mesmo limite e deduplicação usados pelas categorias.
    """
    print("\n" + "-" * 70)
    print(f"COLETANDO PRODUTOS POR PALAVRA-CHAVE: {keyword.upper()}")
    print("-" * 70)

    termo = urllib.parse.quote(keyword.strip(), safe="")
    base_url = (base_url or BASE_URL).rstrip("/")
    url = f"{base_url}/busca/{termo}/"

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
