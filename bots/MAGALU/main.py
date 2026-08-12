import time
import random
import subprocess

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait

from config.config import CHROME_DEBUGGER, BASE_URL
from interface.menu import selecionar_categorias
from persistencia.excel import (
    carregar_resultados,
    salvar_excel,
    produto_ja_processado,
)
from automacao.categorias import coletar_produtos_categoria
from automacao.afiliados import gerar_link_afiliado
from relatorios.relatorios import (
    mostrar_resultados_interrompidos,
    mostrar_relatorio_final,
)


    # isso aqui inicializa o Chrome no modo debug on port:9222

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"

try:
    chrome = subprocess.Popen([
        chrome_path,
        "--remote-debugging-port=9222",
        r"--user-data-dir=C:\ChromeDebug"
    ])

    time.sleep(2)

    if chrome.poll() is None:
        print("[OK] Chrome foi aberto com sucesso!")
    else:
        print("[ERRO] O Chrome abriu, mas fechou imediatamente.")

except FileNotFoundError:
    print("[ERRO] Chrome não encontrado!")
    print(f"[CAMINHO] {chrome_path}")

except Exception as e:
    print(f"[ERRO] Não foi possível abrir o Chrome: {e}")

    time.sleep(5)

# =================aqui conecta ao chrome 9222

def main():
    resultados = carregar_resultados()

    categorias_selecionadas = selecionar_categorias()

    if not categorias_selecionadas:
        print("\n[INFO] Nenhuma categoria selecionada.")
        return

    print("\n")
    print("=" * 70)
    print("        MAGALU - COLETOR DE LINKS DE AFILIADO")
    print("=" * 70)

    print("\n[INFO] Categorias que serão processadas:")

    for categoria in categorias_selecionadas:
        print(f"  - {categoria}")

    print("\n[INFO] Conectando ao Chrome...")

    options = Options()
    options.add_experimental_option(
        "debuggerAddress",
        CHROME_DEBUGGER
    )

    try:
        driver = webdriver.Chrome(options=options)
        wait = WebDriverWait(driver, 15)

        print("[OK] Chrome conectado.")
        print("[INFO] Página atual:")
        print(driver.current_url)

# abrir o link de vitrine magalu

        print("\n[1] Abrindo sua vitrine...")
        driver.get(BASE_URL)
        time.sleep(3)
        print("[OK] Vitrine aberta.")
# escolher categoria/o que o bot vai pesquisar
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
# aqui verifica se existe um processo anterior e se existem produtos que ja foram coletados
            produtos_pendentes = []

            for produto in produtos:
                if produto_ja_processado(
                    resultados,
                    produto,
                    categoria
                ):
                    print("[RETOMADA] Produto já processado. Pulando:")
                    print(produto)
                    continue

                produtos_pendentes.append(produto)

            print(
                f"\n[RETOMADA] {len(produtos_pendentes)} "
                "produtos pendentes."
            )
            print(
                f"[RETOMADA] "
                f"{len(produtos) - len(produtos_pendentes)} "
                "produtos já concluídos."
            )

            for numero_produto, url_produto in enumerate(
                produtos_pendentes,
                start=1
            ):
                print(
                    f"\n[{categoria}] Produto pendente "
                    f"{numero_produto}/{len(produtos_pendentes)}"
                )

                link_afiliado = gerar_link_afiliado(
                    driver,
                    wait,
                    url_produto
                )

                resultado_existente = None

                for resultado in resultados:
                    if (
                        resultado["categoria"] == categoria
                        and resultado["link_produto"] == url_produto
                    ):
                        resultado_existente = resultado
                        break

                if resultado_existente:
                    resultado_existente["link_afiliado"] = link_afiliado
                else:
                    resultados.append({
                        "categoria": categoria,
                        "produto_numero": numero_produto,
                        "link_produto": url_produto,
                        "link_afiliado": link_afiliado,
                    })

                if link_afiliado:
                    print("[OK] Produto processado com sucesso.")
                else:
                    print("[AVISO] Produto sem link de afiliado.")

                try:
                    salvar_excel(resultados)
                    print("[OK] Dados salvos no Excel.")
                except Exception as erro:
                    print("[ERRO] Falha ao salvar Excel:")
                    print(erro)

                time.sleep(random.uniform(2, 4))

        try:
            salvar_excel(resultados)
            print("\n[OK] Salvamento final concluído.")
        except Exception as erro:
            print("\n[ERRO] Falha no salvamento final:")
            print(erro)

        mostrar_relatorio_final(
            resultados,
            categorias_selecionadas
        )

    except KeyboardInterrupt:
        mostrar_resultados_interrompidos(resultados)

    except Exception as erro:
        print("\n")
        print("=" * 70)
        print("                    ERRO FATAL")
        print("=" * 70)
        print("\n[ERRO] A execução encontrou um erro inesperado:")
        print(erro)
        print("\n[INFO] Salvando os dados já coletados...")

        try:
            salvar_excel(resultados)
            print("[OK] Dados preservados no Excel.")
        except Exception as erro_excel:
            print("[ERRO] Também não foi possível salvar o Excel:")
            print(erro_excel)

    finally:
        print("\n[INFO] Execução encerrada.")


if __name__ == "__main__":
    main()
