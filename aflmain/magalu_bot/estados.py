from enum import Enum
import logging
import threading


logger = logging.getLogger(__name__)


class EstadoBot(Enum):
    INICIANDO = "INICIANDO"
    VERIFICANDO_LOGIN = "VERIFICANDO_LOGIN"
    AGUARDANDO_LOGIN = "AGUARDANDO_LOGIN"
    LOGADO = "LOGADO"
    EXECUTANDO = "EXECUTANDO"
    PAUSADO = "PAUSADO"
    PARANDO = "PARANDO"
    FINALIZADO = "FINALIZADO"
    PARADO = "PARADO"
    ERRO = "ERRO"


class GerenciadorEstados:
    """Estado compartilhado entre a thread do bot e as views Django."""

    def __init__(self, estado_inicial=EstadoBot.INICIANDO):
        self._estado_atual = None
        self._lock = threading.RLock()
        self.definir_estado(estado_inicial)

    @property
    def estado(self) -> EstadoBot:
        with self._lock:
            return self._estado_atual

    @property
    def estado_str(self) -> str:
        with self._lock:
            return self._estado_atual.value

    def definir_estado(self, novo_estado: EstadoBot):
        if not isinstance(novo_estado, EstadoBot):
            raise ValueError("novo_estado deve ser uma instância de EstadoBot")

        with self._lock:
            mudou = self._estado_atual != novo_estado
            self._estado_atual = novo_estado

        if mudou:
            self._notificar_mudanca(novo_estado)

    def _notificar_mudanca(self, estado=None):
        estado = estado or self.estado
        logger.info("[ESTADO] -> %s", estado.value)
        print(f"\n[INFO] Estado: {estado.value}")
