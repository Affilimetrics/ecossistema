import threading

from magalu_bot.bot import executar_bot


_bot_thread = None


def bot_esta_executando():
    global _bot_thread

    return (
        _bot_thread is not None
        and _bot_thread.is_alive()
    )


def iniciar_bot(categorias, keywords_loop=None):
    global _bot_thread

    if bot_esta_executando():
        return False

    def executar():

        try:

            executar_bot(
                categorias_selecionadas=categorias,
                keywords_loop=keywords_loop
            )

        except Exception as erro:

            print(
                f"[ERRO] Falha na execução do bot: {erro}"
            )

    _bot_thread = threading.Thread(
        target=executar,
        daemon=True
    )

    _bot_thread.start()

    return True