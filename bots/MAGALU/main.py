from interface.menu import selecionar_categorias
from core.bot import executar_bot


def main():

    selecao = selecionar_categorias()

    if not selecao:
        return

    categorias_selecionadas = (
        selecao["categorias"]
    )

    keywords_loop = (
        selecao["keywords_loop"]
    )

    executar_bot(
        categorias_selecionadas,
        keywords_loop
    )


if __name__ == "__main__":
    main()