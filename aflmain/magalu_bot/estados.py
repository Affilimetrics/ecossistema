from enum import Enum
import logging


logger = logging.getLogger(__name__)


class EstadoBot(Enum):

    INICIANDO = "INICIANDO"
    VERIFICANDO_LOGIN = "VERIFICANDO_LOGIN"
    AGUARDANDO_LOGIN = "AGUARDANDO_LOGIN"
    LOGADO = "LOGADO"
    EXECUTANDO = "EXECUTANDO"
    FINALIZADO = "FINALIZADO"
    PARADO = "PARADO"
    ERRO = "ERRO"


class GerenciadorEstados:

    def __init__(
        self,
        estado_inicial=EstadoBot.INICIANDO
    ):

        self._estado_atual = None

        self.definir_estado(
            estado_inicial
        )

    @property
    def estado(self) -> EstadoBot:

        return self._estado_atual

    @property
    def estado_str(self) -> str:

        return self._estado_atual.value

    def definir_estado(
        self,
        novo_estado: EstadoBot
    ):

        if self._estado_atual != novo_estado:

            self._estado_atual = novo_estado

            self._notificar_mudanca()

    def _notificar_mudanca(self):

        logger.info(
            f"[ESTADO] -> "
            f"{self._estado_atual.value}"
        )

        print(
            f"\n[INFO] Estado: "
            f"{self._estado_atual.value}"
        )