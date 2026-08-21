import os
import csv
from datetime import datetime

from openpyxl import Workbook, load_workbook

from magalu_bot.config.config import ARQUIVO_SAIDA


# ---------------------------------------------------------
# CAMINHO DO CSV
# ---------------------------------------------------------

ARQUIVO_CSV = os.path.splitext(ARQUIVO_SAIDA)[0] + ".csv"


# ---------------------------------------------------------
# CARREGAR RESULTADOS EXISTENTES
# ---------------------------------------------------------

def carregar_resultados():

    if not os.path.exists(ARQUIVO_SAIDA):
        print("[INFO] Nenhum dado anterior encontrado.")
        return []

    print("\n")
    print("=" * 70)
    print("              VERIFICANDO RETOMADA")
    print("=" * 70)
    print(f"[INFO] Arquivo encontrado: {ARQUIVO_SAIDA}")

    resultados_existentes = []

    try:
        wb = load_workbook(ARQUIVO_SAIDA)

        if "Links Afiliados" not in wb.sheetnames:
            print("[INFO] Planilha de dados não encontrada.")
            return []

        ws = wb["Links Afiliados"]

        for linha in ws.iter_rows(min_row=2, values_only=True):

            categoria = linha[0]
            produto_numero = linha[1]
            link_produto = linha[2]
            link_afiliado = linha[3]

            status = linha[4] if len(linha) > 4 else None
            data_hora = linha[5] if len(linha) > 5 else None
            detalhes = linha[6] if len(linha) > 6 else None

            if not link_produto:
                continue

            resultados_existentes.append({
                "categoria": categoria,
                "produto_numero": produto_numero,
                "link_produto": link_produto,
                "link_afiliado": link_afiliado,
                "status": status,
                "data_hora": data_hora,
                "detalhes": detalhes,
            })

        print(f"[OK] {len(resultados_existentes)} registros encontrados.")

        links_existentes = sum(
            1
            for resultado in resultados_existentes
            if resultado["link_afiliado"]
        )

        print(f"[OK] {links_existentes} links de afiliado já obtidos.")
        print("[INFO] O programa continuará somente com os produtos ainda pendentes.")

        return resultados_existentes

    except Exception as erro:
        print("[ERRO] Não foi possível carregar as planilhas de dados anteriores.")
        print(erro)
        return []

# ---------------------------------------------------------
# SALVAR EXCEL
# ---------------------------------------------------------

def salvar_excel(resultados):

    wb = Workbook()

    ws = wb.active

    ws.title = "Links Afiliados"

    ws.append([
        "Categoria",
        "Produto Nº",
        "Link do Produto",
        "Link de Afiliado",
        "Preço Anterior",
        "Preço Atual",
        "Status",
        "Data/Hora",
        "Detalhes",
    ])

    for resultado in resultados:

        ws.append([
            resultado.get("categoria"),
            resultado.get("produto_numero"),
            resultado.get("link_produto"),
            resultado.get("link_afiliado"),
            resultado.get("preco_anterior"),
            resultado.get("preco_atual"),
            resultado.get("status"),
            resultado.get("data_hora"),
            resultado.get("detalhes"),
        ])

    # ---------------------------------------------------------
    # LARGURA DAS COLUNAS
    # ---------------------------------------------------------

    ws.column_dimensions["A"].width = 25

    ws.column_dimensions["B"].width = 12

    ws.column_dimensions["C"].width = 80

    ws.column_dimensions["D"].width = 80

    ws.column_dimensions["E"].width = 18

    ws.column_dimensions["F"].width = 18

    ws.column_dimensions["G"].width = 15

    ws.column_dimensions["H"].width = 22

    ws.column_dimensions["I"].width = 80

    wb.save(ARQUIVO_SAIDA)


# ---------------------------------------------------------
# SALVAR CSV
# ---------------------------------------------------------

def salvar_csv(resultados):

    try:

        with open(
            ARQUIVO_CSV,
            "w",
            newline="",
            encoding="utf-8-sig"
        ) as arquivo:

            escritor = csv.writer(arquivo)

            escritor.writerow([
                "Categoria",
                "Produto Nº",
                "Link do Produto",
                "Link de Afiliado",
                "Preço Anterior",
                "Preço Atual",
                "Status",
                "Data/Hora",
                "Detalhes",
            ])

            for resultado in resultados:

                escritor.writerow([
                    resultado.get("categoria"),
                    resultado.get("produto_numero"),
                    resultado.get("link_produto"),
                    resultado.get("link_afiliado"),
                    resultado.get("preco_anterior"),
                    resultado.get("preco_atual"),
                    resultado.get("status"),
                    resultado.get("data_hora"),
                    resultado.get("detalhes"),
                ])

        print(
            f"[OK] CSV atualizado: {ARQUIVO_CSV}"
        )

    except Exception as erro:

        print(
            "[ERRO] Falha ao salvar CSV:"
        )

        print(erro)


# ---------------------------------------------------------
# SALVAR OS DOIS
# ---------------------------------------------------------

def salvar_dados(resultados):

    salvar_excel(resultados)

    salvar_csv(resultados)


# ---------------------------------------------------------
# VERIFICAR SE PRODUTO JÁ FOI PROCESSADO
# ---------------------------------------------------------

def produto_ja_processado(
    resultados,
    url_produto,
    categoria
):

    for resultado in resultados:

        if (
            resultado["categoria"] == categoria
            and resultado["link_produto"] == url_produto
            and resultado["link_afiliado"]
        ):

            return True

    return False