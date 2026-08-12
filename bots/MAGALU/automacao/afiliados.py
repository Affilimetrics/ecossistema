import time
import random

from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def gerar_link_afiliado(driver, wait, url_produto):
    print("\n")
    print("-" * 70)
    print("ABRINDO PRODUTO")
    print("-" * 70)
    print(url_produto)

    driver.get(url_produto)
    time.sleep(random.uniform(2.5, 4))

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

        print("[OK] Botão 'Gerar link' encontrado.")

        driver.execute_script(
            "arguments[0].scrollIntoView({block: 'center'});",
            botao
        )

        time.sleep(0.5)

        driver.execute_script(
            "arguments[0].click();",
            botao
        )

        print("[OK] Botão 'Gerar link' clicado.")

    except Exception as erro:
        print("[ERRO] Não foi possível clicar em 'Gerar link'.")
        print(erro)
        return None

    try:
        def encontrar_input_link(driver):
            inputs = driver.find_elements(By.CSS_SELECTOR, "input")

            for campo in inputs:
                try:
                    if not campo.is_displayed():
                        continue

                    valor = campo.get_attribute("value")

                    if not valor:
                        continue

                    if "http://" in valor or "https://" in valor:
                        return campo

                except Exception:
                    continue

            return False

        campo_link = WebDriverWait(driver, 10).until(
            encontrar_input_link
        )

        link_afiliado = campo_link.get_attribute("value")

        print("[OK] Link de afiliado obtido:")
        print(link_afiliado)

        return link_afiliado

    except Exception as erro:
        print("[ERRO] Não consegui encontrar o link no modal.")
        print(erro)
        return None
