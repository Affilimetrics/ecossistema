from config.config import CATEGORIAS_PRINCIPAIS


def selecionar_categorias():
    print("\n")
    print("=" * 70)
    print("              MAGALU - COLETOR DE LINKS")
    print("=" * 70)

    print("\nSelecione as categorias que deseja executar.\n")

    for numero, categoria in CATEGORIAS_PRINCIPAIS.items():
        print(f"{numero} - {categoria.capitalize()}")

    print("6 - Palavra-chave personalizada")

    print("\nDigite os números separados por espaço.")
    print("Exemplo: 1 3 4 6")
    print("Digite 0 para cancelar.\n")

    while True:
        entrada = input("> ").strip()

        if not entrada:
            print("[AVISO] Digite pelo menos uma opção.")
            continue

        numeros = entrada.split()

        if "0" in numeros:
            print("\n[INFO] Operação cancelada.")
            return []

        invalidos = [
            numero for numero in numeros
            if numero not in CATEGORIAS_PRINCIPAIS and numero != "6"
        ]

        if invalidos:
            print("[ERRO] Opção inválida: " + ", ".join(invalidos))
            print("Utilize somente números de 1 a 6.")
            continue

        numeros = list(dict.fromkeys(numeros))
        categorias = []

        for numero in numeros:
            if numero != "6":
                categorias.append(CATEGORIAS_PRINCIPAIS[numero])

        if "6" in numeros:
            while True:
                palavra_chave = input("\nDigite a palavra-chave:\n> ").strip()

                if palavra_chave:
                    categorias.append(palavra_chave)
                    break

                print("[AVISO] A palavra-chave não pode ficar vazia.")

        print("\n")
        print("=" * 70)
        print("             CATEGORIAS SELECIONADAS")
        print("=" * 70)

        for numero, categoria in enumerate(categorias, start=1):
            print(f"{numero} - {categoria}")

        print("=" * 70)

        confirmar = input("\nConfirmar seleção? [S/N]: ").strip().lower()

        if confirmar in ("s", "sim"):
            print("\n[OK] Seleção confirmada.\n")
            return categorias

        print("\n[INFO] Seleção descartada.")
        print("[INFO] Escolha novamente.\n")
