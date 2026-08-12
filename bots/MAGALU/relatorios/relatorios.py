from persistencia.excel import salvar_excel
from config.config import ARQUIVO_SAIDA


def mostrar_resultados_interrompidos(resultados):
    print("\n")
    print("=" * 70)
    print("       EXECUÇÃO INTERROMPIDA PELO USUÁRIO")
    print("=" * 70)

    print("\n[INFO] Ctrl+C detectado.")
    print("[INFO] Salvando os dados coletados...")

    try:
        salvar_excel(resultados)
        print("[OK] Dados salvos com sucesso.")
    except Exception as erro:
        print("[ERRO] Não foi possível salvar o Excel:")
        print(erro)

    total_links_obtidos = sum(
        1 for resultado in resultados
        if resultado["link_afiliado"]
    )

    print("\nLINKS DE AFILIADO OBTIDOS ATÉ AGORA:")
    print("-" * 70)

    contador = 0

    for resultado in resultados:
        if resultado["link_afiliado"]:
            contador += 1
            print(f"{contador:03d}. [{resultado['categoria']}]")
            print(resultado["link_afiliado"])
            print()

    print("-" * 70)
    print(f"TOTAL DE PRODUTOS PROCESSADOS: {len(resultados)}")
    print(f"TOTAL DE LINKS DE AFILIADO:    {total_links_obtidos}")
    print(f"ARQUIVO SALVO: {ARQUIVO_SAIDA}")
    print("=" * 70)


def mostrar_relatorio_final(resultados, categorias_selecionadas):
    print("\n")
    print("=" * 70)
    print("                    COLETA FINALIZADA")
    print("=" * 70)

    for categoria in categorias_selecionadas:
        dados_categoria = [
            resultado for resultado in resultados
            if resultado["categoria"] == categoria
        ]

        links_categoria = [
            resultado for resultado in dados_categoria
            if resultado["link_afiliado"]
        ]

        print(
            f"{categoria.upper():25} "
            f"Produtos: {len(dados_categoria):2} | "
            f"Links: {len(links_categoria):2}"
        )

    print("-" * 70)

    total_produtos_processados = len(resultados)
    total_links_obtidos = sum(
        1 for resultado in resultados
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
