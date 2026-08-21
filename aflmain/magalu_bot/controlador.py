import threading

from magalu_bot.bot import executar_bot


class ControladorBot:

    def __init__(self):

        self.thread = None
        self.executando = False

    def iniciar(
        self,
        categorias_selecionadas,
        keywords_loop=None
    ):

        if self.executando:

            return False

        self.executando = True

        self.thread = threading.Thread(
            target=self._executar,
            args=(
                categorias_selecionadas,
                keywords_loop,
            ),
            daemon=True,
        )

        self.thread.start()

        return True

    def _executar(
        self,
        categorias_selecionadas,
        keywords_loop,
    ):

        try:

            executar_bot(
                categorias_selecionadas,
                keywords_loop,
            )

        finally:

            self.executando = False

    def esta_executando(self):

        return self.executando


controlador_bot = ControladorBot()