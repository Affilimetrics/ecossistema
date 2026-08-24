import threading
import traceback

from magalu_bot import bot as bot_module
from magalu_bot.bot import executar_bot
from magalu_bot.estados import EstadoBot
from core.models import Execucao
from magalu_bot.persistencia.django_db import registrar_log, atualizar_execucao, finalizar_execucao
from django.utils import timezone


class ControladorBot:
    """
    Dono do ciclo de vida da execução Selenium.

    A thread é única por execução. Pausar/retomar usam os mesmos
    Event objects, portanto RETOMAR não cria outra execução.
    """

    def __init__(self):
        self.thread = None
        self._lock = threading.RLock()

        self.executando = False
        self.parar_evento = threading.Event()
        self.pausar_evento = threading.Event()

        self.categorias = []
        self.keywords = []
        self.keywords_loop = []

        self.erro = None
        self._execucao_iniciada = False
        self.execucao_id = None
        self.inicio = None
        self.owner_id = None

    def iniciar(self, categorias_selecionadas=None, keywords_loop=None, keywords=None, owner_id=None):
        with self._lock:
            if self.thread is not None and self.thread.is_alive():
                return False

            categorias = list(categorias_selecionadas or [])
            keywords = list(keywords or [])
            keywords_loop = list(keywords_loop or [])
            if not categorias and not keywords:
                return False

            self.categorias = categorias
            self.keywords = keywords
            self.keywords_loop = keywords_loop
            self.owner_id = owner_id

            self.erro = None
            self.inicio = timezone.now()
            execucao = Execucao.objects.create(
                estado=EstadoBot.INICIANDO.value,
                categorias=self.categorias,
                keywords=self.keywords,
                owner_id=owner_id,
            )
            self.execucao_id = execucao.pk
            bot_module.gerenciador_estado_atual = None
            registrar_log(self.execucao_id, 'Execução criada pelo painel Django.', 'INFO')
            self.parar_evento.clear()
            self.pausar_evento.clear()
            self._execucao_iniciada = True
            self.executando = True

            self.thread = threading.Thread(
                target=self._executar,
                args=(self.categorias, self.keywords_loop),
                name="MagaluBotThread",
                daemon=False,
            )
            self.thread.start()

            print("[BOT CONTROLLER] Thread do Selenium iniciada.")
            return True

    def _executar(self, categorias_selecionadas, keywords_loop):
        try:
            executar_bot(
                categorias_selecionadas=categorias_selecionadas,
                keywords=self.keywords,
                keywords_loop=keywords_loop,
                parar_evento=self.parar_evento,
                pausar_evento=self.pausar_evento,
                execution_id=self.execucao_id,
                owner_id=self.owner_id,
            )
        except Exception as erro:
            with self._lock:
                self.erro = f"{type(erro).__name__}: {erro}"
            print(f"[BOT CONTROLLER] ERRO: {erro}")
            traceback.print_exc()
        finally:
            with self._lock:
                self.executando = False
            # O bot normalmente já finaliza o registro. Este fallback cobre encerramentos inesperados.
            if self.execucao_id:
                execucao = Execucao.objects.filter(pk=self.execucao_id).first()
                if execucao and not execucao.fim:
                    atualizar_execucao(self.execucao_id, estado=(self._estado_bot().value if self._estado_bot() else 'FINALIZADO'), fim=timezone.now(), erro=self.erro or '')
            self.pausar_evento.clear()
            print("[BOT CONTROLLER] Thread do bot finalizada.")

    def _estado_bot(self):
        """Obtém o estado real produzido pela thread, quando disponível."""
        gerenciador = bot_module.gerenciador_estado_atual
        if gerenciador is None:
            return None
        try:
            estado = gerenciador.estado
            if self.execucao_id and estado:
                atualizar_execucao(self.execucao_id, estado=estado.value)
            return estado
        except Exception:
            return None

    def pausar(self):
        with self._lock:
            if not self.thread or not self.thread.is_alive():
                return False
            if self.parar_evento.is_set() or self.pausar_evento.is_set():
                return False

            print("[BOT CONTROLLER] Solicitação de pausa enviada.")
            self.pausar_evento.set()
            return True

    def retomar(self):
        with self._lock:
            if not self.thread or not self.thread.is_alive():
                return False

            estado = self._estado_bot()
            if estado != EstadoBot.PAUSADO:
                return False

            print("[BOT CONTROLLER] Retomando a mesma thread.")
            self.pausar_evento.clear()
            return True

    def parar(self):
        with self._lock:
            if not self.thread or not self.thread.is_alive():
                return False

            print("[BOT CONTROLLER] Solicitação de parada enviada.")
            self.parar_evento.set()
            # Se estiver pausado, libera a espera para que a thread
            # possa chegar ao salvamento/encerramento.
            self.pausar_evento.clear()
            return True

    def esta_executando(self):
        with self._lock:
            return bool(self.thread and self.thread.is_alive())

    def esta_pausado(self):
        return self._estado_bot() == EstadoBot.PAUSADO

    def pode_retomar(self):
        # Retomar significa continuar a execução pausada.
        # Depois de PARAR/FINALIZAR/ERRO, uma nova execução pode ser
        # iniciada e a persistência cuidará do checkpoint.
        return self.esta_pausado()

    def _progresso(self):
        if not self.execucao_id:
            return {"processados": 0, "links": 0, "total": 0}
        try:
            execucao = Execucao.objects.get(pk=self.execucao_id)
            return {
                "processados": execucao.produtos_processados,
                "links": execucao.links_obtidos,
                "total": execucao.produtos_total,
            }
        except Execucao.DoesNotExist:
            return {"processados": 0, "links": 0, "total": 0}

    def status(self):
        with self._lock:
            thread_viva = bool(self.thread and self.thread.is_alive())
            erro = self.erro

        estado = self._estado_bot()

        if thread_viva:
            if self.parar_evento.is_set():
                estado_nome = "parando"
            elif estado == EstadoBot.PAUSADO:
                estado_nome = "pausado"
            elif estado is not None:
                estado_nome = estado.value.lower()
            else:
                estado_nome = "iniciando"
        elif erro:
            estado_nome = "erro"
        elif estado == EstadoBot.FINALIZADO:
            estado_nome = "finalizado"
        elif estado == EstadoBot.ERRO:
            estado_nome = "erro"
        elif estado == EstadoBot.PARADO:
            estado_nome = "parado"
        else:
            estado_nome = "parado"

        return {
            "sucesso": True,
            "executando": thread_viva,
            "estado": estado_nome,
            "status": estado_nome,
            "erro": erro,
            "categorias": list(self.categorias),
            "keywords": list(self.keywords),
            "keywords_loop": list(self.keywords_loop),
            "execucao_id": self.execucao_id,
            "inicio": self.inicio.isoformat() if self.inicio else None,
            "progresso": self._progresso(),
        }


controlador_bot = ControladorBot()
