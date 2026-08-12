from config.config import CATEGORIAS_PRINCIPAIS


def selecionar_categorias():

    print("\n")
    print("=" * 70)
    print("              MAGALU - COLETOR DE LINKS")
    print("=" * 70)

    print("\nSelecione as categorias que deseja executar.\n")

    for numero, categoria in CATEGORIAS_PRINCIPAIS.items():
        print(f"{numero} - {categoria.capitalize()}")

    print("6 - Palavras-chave personalizadas")

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
            numero
            for numero in numeros
            if numero not in CATEGORIAS_PRINCIPAIS and numero != "6"
        ]

        if invalidos:
            print(
                "[ERRO] Opção inválida: "
                + ", ".join(invalidos)
            )
            print("Utilize somente números de 1 a 6.")
            continue

        numeros = list(dict.fromkeys(numeros))

        categorias = []
        keywords_loop = []

        # ==================================================
        # CATEGORIAS NORMAIS
        # ==================================================

        for numero in numeros:

            if numero != "6":
                categorias.append(
                    CATEGORIAS_PRINCIPAIS[numero]
                )

        # ==================================================
        # PALAVRAS-CHAVE PERSONALIZADAS
        # ==================================================

        if "6" in numeros:

            print("\n")
            print("=" * 70)
            print("             PALAVRAS-CHAVE PERSONALIZADAS")
            print("=" * 70)

            # ----------------------------------------------
            # Quantidade de keywords
            # ----------------------------------------------

            while True:

                quantidade = input(
                    "\nQuantas palavras-chave deseja adicionar? "
                    "(1-10)\n> "
                ).strip()

                try:
                    quantidade = int(quantidade)

                except ValueError:
                    print(
                        "[ERRO] Digite somente um número "
                        "entre 1 e 10."
                    )
                    continue

                if quantidade < 1 or quantidade > 10:
                    print(
                        "[ERRO] A quantidade deve estar "
                        "entre 1 e 10."
                    )
                    continue

                break

            # ----------------------------------------------
            # Digitação das keywords
            # ----------------------------------------------

            keywords = []

            print("\nDigite as palavras-chave:\n")

            for numero_keyword in range(1, quantidade + 1):

                while True:

                    palavra_chave = input(
                        f"[{numero_keyword}/{quantidade}] "
                        "Palavra-chave:\n> "
                    ).strip()

                    if not palavra_chave:
                        print(
                            "[AVISO] A palavra-chave "
                            "não pode ficar vazia."
                        )
                        continue

                    if palavra_chave in keywords:
                        print(
                            "[AVISO] Essa palavra-chave "
                            "já foi adicionada."
                        )
                        continue

                    keywords.append(palavra_chave)
                    break

            # ----------------------------------------------
            # Mostrar keywords
            # ----------------------------------------------

            print("\n")
            print("=" * 70)
            print("             PALAVRAS-CHAVE ADICIONADAS")
            print("=" * 70)

            for numero_keyword, keyword in enumerate(
                keywords,
                start=1
            ):
                print(f"{numero_keyword} - {keyword}")

            print("=" * 70)

            # ----------------------------------------------
            # Escolher keywords em loop
            # ----------------------------------------------

            print(
                "\nDeseja manter alguma palavra-chave "
                "em LOOP?"
            )
            print("1 - Sim")
            print("2 - Não")

            while True:

                resposta_loop = input("\n> ").strip()

                if resposta_loop == "2":
                    break

                if resposta_loop != "1":
                    print(
                        "[ERRO] Escolha 1 para Sim "
                        "ou 2 para Não."
                    )
                    continue

                print("\nQuais palavras deseja manter em LOOP?")
                print(
                    "Digite os números separados por espaço."
                )
                print(
                    "Exemplo: 1 3 5"
                )
                print(
                    "Digite 0 para não colocar nenhuma."
                )

                while True:

                    entrada_loop = input("\n> ").strip()

                    if not entrada_loop:
                        print(
                            "[AVISO] Digite pelo menos "
                            "uma opção."
                        )
                        continue

                    numeros_loop = entrada_loop.split()

                    if "0" in numeros_loop:
                        keywords_loop = []
                        break

                    invalidos_loop = []

                    for numero in numeros_loop:

                        try:
                            numero_int = int(numero)

                            if (
                                numero_int < 1
                                or numero_int > len(keywords)
                            ):
                                invalidos_loop.append(numero)

                        except ValueError:
                            invalidos_loop.append(numero)

                    if invalidos_loop:
                        print(
                            "[ERRO] Opção inválida: "
                            + ", ".join(invalidos_loop)
                        )
                        print(
                            f"Utilize números de 1 a "
                            f"{len(keywords)}."
                        )
                        continue

                    numeros_loop = list(
                        dict.fromkeys(numeros_loop)
                    )

                    keywords_loop = [
                        keywords[int(numero) - 1]
                        for numero in numeros_loop
                    ]

                    break

                break

            # ----------------------------------------------
            # Adiciona as keywords às categorias
            # ----------------------------------------------

            categorias.extend(keywords)

        # ==================================================
        # RESUMO
        # ==================================================

        print("\n")
        print("=" * 70)
        print("             CATEGORIAS SELECIONADAS")
        print("=" * 70)

        for numero, categoria in enumerate(
            categorias,
            start=1
        ):
            print(f"{numero} - {categoria}")

        if keywords_loop:

            print("\n")
            print("=" * 70)
            print("             KEYWORDS EM LOOP")
            print("=" * 70)

            for numero, keyword in enumerate(
                keywords_loop,
                start=1
            ):
                print(f"{numero} - {keyword}")

        else:
            print("\n[INFO] Nenhuma keyword configurada em loop.")

        print("=" * 70)

        confirmar = input(
            "\nConfirmar seleção? [S/N]: "
        ).strip().lower()

        if confirmar in ("s", "sim"):

            print("\n[OK] Seleção confirmada.\n")

            return {
                "categorias": categorias,
                "keywords_loop": keywords_loop
            }

        print("\n[INFO] Seleção descartada.")
        print("[INFO] Escolha novamente.\n")