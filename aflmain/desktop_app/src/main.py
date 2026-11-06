from __future__ import annotations

import builtins
import importlib.util
import os
import re
import sys
from pathlib import Path


def _resource_path(relative: str) -> Path:
    base = Path(getattr(sys, "_MEIPASS", Path(__file__).resolve().parents[1]))
    return base / relative


def _run_ml_child() -> int:
    """Executa o script original sem modificá-lo; stdin atende seus input()."""
    script = _resource_path("integrations/mercado_livre/mercado_livre_busca.py")
    if not script.exists():
        print(f"ERRO: script Mercado Livre não encontrado: {script}", flush=True)
        return 2
    spec = importlib.util.spec_from_file_location("skallora_ml_original", script)
    if spec is None or spec.loader is None:
        print("ERRO: não foi possível carregar o coletor Mercado Livre.", flush=True)
        return 2
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)

    def console_input(prompt=""):
        if prompt:
            sys.stdout.write(str(prompt))
            sys.stdout.flush()
        line = sys.stdin.readline()
        if line == "":
            raise EOFError("A entrada do aplicativo foi encerrada.")
        return line.rstrip("\r\n")

    original_input = builtins.input
    builtins.input = console_input
    try:
        module.buscar_mercado_livre_persistente()
        return 0
    except EOFError:
        print("Execução interrompida: entrada encerrada.", flush=True)
        return 130
    except Exception as exc:
        print(f"ERRO {type(exc).__name__}: {exc}", flush=True)
        return 1
    finally:
        builtins.input = original_input


if "--ml-child" in sys.argv:
    raise SystemExit(_run_ml_child())

from PySide6.QtCore import Qt, QTimer, QProcess, QSettings
from PySide6.QtGui import QFont
from PySide6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QDialog, QVBoxLayout, QHBoxLayout,
    QFormLayout, QLabel, QLineEdit, QPushButton, QMessageBox, QStackedWidget,
    QFrame, QGridLayout, QTableWidget, QTableWidgetItem, QHeaderView,
    QComboBox, QSpinBox, QPlainTextEdit, QCheckBox, QGroupBox, QScrollArea,
)

from api_client import APIClient, APIError
from ml_output import parse_results

APP_NAME = "Skallora Desktop"

DARK_STYLE = """
QWidget { background: #101312; color: #ecf4ef; font-family: Inter, Segoe UI, sans-serif; font-size: 10pt; }
QMainWindow, QDialog { background: #0b0e0c; }
QLabel#muted { color: #9aa9a0; }
QLabel#pageTitle { font-size: 22pt; font-weight: 700; color: #f4fff7; }
QLabel#metricValue { font-size: 23pt; font-weight: 700; color: #2ecc71; }
QFrame#card, QGroupBox { background: #171d19; border: 1px solid #28352d; border-radius: 12px; }
QGroupBox { margin-top: 12px; padding: 12px; font-weight: 600; }
QGroupBox::title { subcontrol-origin: margin; left: 12px; padding: 0 5px; color: #b9c9bf; }
QLineEdit, QPlainTextEdit, QComboBox, QSpinBox { background: #0e1410; border: 1px solid #34443a; border-radius: 7px; padding: 8px; selection-background-color: #2ecc71; }
QPushButton { background: #24342a; border: 1px solid #385341; border-radius: 8px; padding: 9px 14px; font-weight: 600; }
QPushButton:hover { background: #304a39; }
QPushButton:disabled { color: #65736a; background: #1b211d; }
QPushButton#primary { background: #2ecc71; color: #07120b; border: 0; }
QPushButton#danger { background: #4a2626; border-color: #713737; }
QPushButton#nav { text-align: left; padding: 12px; background: transparent; border: 0; }
QPushButton#nav:checked { background: #1e3325; border-left: 3px solid #2ecc71; }
QTableWidget { background: #111713; alternate-background-color: #171f19; gridline-color: #29352d; border: 1px solid #28352d; border-radius: 8px; }
QHeaderView::section { background: #202a23; color: #c6d5cb; padding: 8px; border: 0; }
QCheckBox { spacing: 8px; }
"""


class LoginDialog(QDialog):
    def __init__(self, settings):
        super().__init__()
        self.settings = settings
        self.client = None
        self.login_data = None
        self.setWindowTitle("Entrar no Skallora")
        self.setMinimumWidth(430)
        layout = QVBoxLayout(self)
        title = QLabel("Skallora Desktop")
        title.setObjectName("pageTitle")
        subtitle = QLabel("Entre com a mesma conta utilizada no site.")
        subtitle.setObjectName("muted")
        layout.addWidget(title)
        layout.addWidget(subtitle)
        form = QFormLayout()
        self.url_input = QLineEdit(settings.value("api_url", "http://127.0.0.1:8000"))
        self.username_input = QLineEdit(settings.value("username", ""))
        self.password_input = QLineEdit()
        self.password_input.setEchoMode(QLineEdit.Password)
        self.password_input.returnPressed.connect(self._login)
        form.addRow("Endereço do Django", self.url_input)
        form.addRow("Usuário", self.username_input)
        form.addRow("Senha", self.password_input)
        layout.addLayout(form)
        self.status = QLabel("A API deve estar publicada ou o Django deve estar em execução localmente.")
        self.status.setObjectName("muted")
        self.status.setWordWrap(True)
        layout.addWidget(self.status)
        buttons = QHBoxLayout()
        buttons.addStretch(1)
        cancel = QPushButton("Sair")
        cancel.clicked.connect(self.reject)
        enter = QPushButton("Entrar")
        enter.setObjectName("primary")
        enter.clicked.connect(self._login)
        buttons.addWidget(cancel)
        buttons.addWidget(enter)
        layout.addLayout(buttons)

    def _login(self):
        try:
            client = APIClient(self.url_input.text().strip())
            data = client.login(self.username_input.text().strip(), self.password_input.text())
        except APIError as exc:
            QMessageBox.warning(self, "Não foi possível entrar", str(exc))
            return
        self.settings.setValue("api_url", self.url_input.text().strip().rstrip("/"))
        self.settings.setValue("username", self.username_input.text().strip())
        self.client = client
        self.login_data = data
        try:
            import keyring
            keyring.set_password("SkalloraDesktop", self.username_input.text().strip(), client.token)
        except Exception:
            QMessageBox.information(
                self,
                "Sessão temporária",
                "O Gerenciador de Credenciais do Windows não está disponível. A sessão ficará ativa somente até fechar o aplicativo.",
            )
        self.accept()


class MetricCard(QFrame):
    def __init__(self, title):
        super().__init__()
        self.setObjectName("card")
        layout = QVBoxLayout(self)
        label = QLabel(title)
        label.setObjectName("muted")
        self.value = QLabel("—")
        self.value.setObjectName("metricValue")
        layout.addWidget(label)
        layout.addWidget(self.value)


class DashboardPage(QWidget):
    def __init__(self, api):
        super().__init__()
        self.api = api
        layout = QVBoxLayout(self)
        self.title = QLabel("Visão geral")
        self.title.setObjectName("pageTitle")
        layout.addWidget(self.title)
        grid = QGridLayout()
        self.metrics = [MetricCard("Produtos"), MetricCard("Links de afiliado"), MetricCard("Ofertas"), MetricCard("Ofertas enviadas")]
        for i, card in enumerate(self.metrics):
            grid.addWidget(card, 0, i)
        layout.addLayout(grid)
        self.chief = QLabel("Produto Chefe: carregando...")
        self.chief.setWordWrap(True)
        self.chief.setObjectName("card")
        self.chief.setMargin(16)
        layout.addWidget(self.chief)
        layout.addWidget(QLabel("Execuções recentes"))
        self.table = QTableWidget(0, 5)
        self.table.setHorizontalHeaderLabels(["ID", "Estado", "Início", "Processados", "Links"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        layout.addWidget(self.table)
        refresh = QPushButton("Atualizar")
        refresh.clicked.connect(self.refresh)
        layout.addWidget(refresh, alignment=Qt.AlignRight)
        self.refresh()

    def refresh(self):
        try:
            data = self.api.get("/api/desktop/dashboard/")
            metrics = data.get("metricas", {})
            for card, key in zip(self.metrics, ("produtos", "links_afiliados", "ofertas", "ofertas_enviadas")):
                card.value.setText(str(metrics.get(key, 0)))
            chief = data.get("produto_chefe")
            if chief:
                self.chief.setText(f"PRODUTO CHEFE\n{chief.get('nome')}\nMarketplace: {chief.get('marketplace')} · Score: {chief.get('score')}\n{chief.get('motivo')}\n{chief.get('link_afiliado') or chief.get('url_produto')}")
            else:
                self.chief.setText("PRODUTO CHEFE\nAinda não há produto com link de afiliado validado.")
            rows = data.get("execucoes_recentes", [])
            self.table.setRowCount(len(rows))
            for r, item in enumerate(rows):
                values = [item.get("id"), item.get("estado"), item.get("inicio"), item.get("produtos_processados"), item.get("links_obtidos")]
                for c, value in enumerate(values):
                    self.table.setItem(r, c, QTableWidgetItem(str(value or "—")))
        except APIError as exc:
            self.chief.setText(f"Falha ao atualizar painel: {exc}")


class ProductsPage(QWidget):
    def __init__(self, api):
        super().__init__()
        self.api = api
        layout = QVBoxLayout(self)
        title = QLabel("Produtos coletados")
        title.setObjectName("pageTitle")
        layout.addWidget(title)
        row = QHBoxLayout()
        self.market = QComboBox()
        self.market.addItems(["Todos", "MAGALU", "MERCADO_LIVRE", "AMAZON", "OUTROS"])
        refresh = QPushButton("Atualizar produtos")
        refresh.clicked.connect(self.refresh)
        row.addWidget(self.market)
        row.addWidget(refresh)
        row.addStretch(1)
        layout.addLayout(row)
        self.table = QTableWidget(0, 7)
        self.table.setHorizontalHeaderLabels(["Marketplace", "Produto", "Preço", "Desconto", "Afiliado", "Status", "Link do produto"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeToContents)
        self.table.horizontalHeader().setStretchLastSection(True)
        layout.addWidget(self.table)
        self.refresh()

    def refresh(self):
        try:
            market = self.market.currentText()
            params = {} if market == "Todos" else {"marketplace": market}
            data = self.api.get("/api/desktop/products/", params=params)
            products = data.get("produtos", [])
            self.table.setRowCount(len(products))
            for r, p in enumerate(products):
                values = [p.get("marketplace"), p.get("nome"), p.get("preco_atual") or "—", p.get("desconto"), p.get("link_afiliado") or "—", p.get("status_afiliado"), p.get("url_produto")]
                for c, value in enumerate(values):
                    self.table.setItem(r, c, QTableWidgetItem(str(value or "—")))
        except APIError as exc:
            QMessageBox.warning(self, "Produtos", str(exc))


class ExecutionsPage(QWidget):
    def __init__(self, api):
        super().__init__()
        self.api = api
        layout = QVBoxLayout(self)
        title = QLabel("Histórico de execuções")
        title.setObjectName("pageTitle")
        layout.addWidget(title)
        self.table = QTableWidget(0, 6)
        self.table.setHorizontalHeaderLabels(["ID", "Estado", "Início", "Fim", "Processados", "Links"])
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.Stretch)
        layout.addWidget(self.table)
        refresh = QPushButton("Atualizar histórico")
        refresh.clicked.connect(self.refresh)
        layout.addWidget(refresh, alignment=Qt.AlignRight)
        self.refresh()

    def refresh(self):
        try:
            rows = self.api.get("/api/desktop/executions/").get("execucoes", [])
            self.table.setRowCount(len(rows))
            for r, item in enumerate(rows):
                values = [item.get("id"), item.get("estado"), item.get("inicio"), item.get("fim") or "—", item.get("produtos_processados"), item.get("links_obtidos")]
                for c, value in enumerate(values):
                    self.table.setItem(r, c, QTableWidgetItem(str(value or "—")))
        except APIError as exc:
            QMessageBox.warning(self, "Execuções", str(exc))


class ColetaGeralPage(QWidget):
    def __init__(self, api, start_ml):
        super().__init__()
        self.api = api
        self.start_ml = start_ml
        layout = QVBoxLayout(self)
        title = QLabel("Coleta Geral")
        title.setObjectName("pageTitle")
        layout.addWidget(title)
        intro = QLabel("Selecione os marketplaces e configure a busca. A Central Magalu oferece controles avançados de loop.")
        intro.setObjectName("muted")
        layout.addWidget(intro)
        self.magalu_check = QCheckBox("Magalu")
        self.magalu_check.setChecked(True)
        self.ml_check = QCheckBox("Mercado Livre")
        group = QGroupBox("Marketplaces")
        g = QHBoxLayout(group)
        g.addWidget(self.magalu_check)
        g.addWidget(self.ml_check)
        g.addStretch(1)
        layout.addWidget(group)
        self.categories = QLineEdit()
        self.categories.setPlaceholderText("Ex.: cozinha, quarto, sala")
        self.keywords = QLineEdit()
        self.keywords.setPlaceholderText("Palavras-chave separadas por vírgula (opcional)")
        self.ml_term = QLineEdit()
        self.ml_term.setPlaceholderText("Ex.: fone bluetooth")
        self.ml_quantity = QSpinBox()
        self.ml_quantity.setRange(1, 50)
        self.ml_quantity.setValue(10)
        magalu_group = QGroupBox("Busca Magalu")
        mf = QFormLayout(magalu_group)
        mf.addRow("Categorias", self.categories)
        mf.addRow("Palavras-chave", self.keywords)
        ml_group = QGroupBox("Busca Mercado Livre")
        mlf = QFormLayout(ml_group)
        mlf.addRow("Produto", self.ml_term)
        mlf.addRow("Quantidade", self.ml_quantity)
        layout.addWidget(magalu_group)
        layout.addWidget(ml_group)
        self.status = QLabel("Pronto para iniciar.")
        self.status.setObjectName("muted")
        layout.addWidget(self.status)
        start = QPushButton("Iniciar coleta selecionada")
        start.setObjectName("primary")
        start.clicked.connect(self.begin)
        layout.addWidget(start, alignment=Qt.AlignLeft)
        layout.addStretch(1)

    @staticmethod
    def _split(text):
        return [x.strip() for x in re.split(r"[,;\n]", text) if x.strip()]

    def begin(self):
        selected = self.magalu_check.isChecked() or self.ml_check.isChecked()
        if not selected:
            QMessageBox.warning(self, "Coleta Geral", "Selecione ao menos um marketplace.")
            return
        messages = []
        if self.magalu_check.isChecked():
            cats = self._split(self.categories.text())
            keywords = self._split(self.keywords.text())
            if not cats and not keywords:
                QMessageBox.warning(self, "Coleta Geral", "Informe uma categoria ou palavra-chave para o Magalu.")
                return
            try:
                result = self.api.post("/api/desktop/magalu/start/", {"categorias": cats, "keywords": keywords})
                messages.append("Magalu iniciado no processo Django configurado.")
                warnings = result.get("avisos", [])
                if warnings:
                    messages.extend(f"ALERTA: {item.get('mensagem', '')}" for item in warnings)
            except APIError as exc:
                messages.append(f"Magalu: {exc}")
        if self.ml_check.isChecked():
            if not self.ml_term.text().strip():
                QMessageBox.warning(self, "Coleta Geral", "Informe o produto para buscar no Mercado Livre.")
                return
            started_ml = self.start_ml(self.ml_term.text().strip(), self.ml_quantity.value())
            messages.append("Mercado Livre: navegador local iniciado." if started_ml else "Mercado Livre: não foi possível iniciar a busca.")
        self.status.setText("\n".join(messages) if messages else "Nenhum coletor iniciado.")


class CentralMagaluPage(QWidget):
    def __init__(self, api):
        super().__init__()
        self.api = api
        self.execution_id = None
        self.last_log_id = 0
        layout = QVBoxLayout(self)
        title = QLabel("Central Magalu")
        title.setObjectName("pageTitle")
        layout.addWidget(title)
        label = QLabel("Controle avançado do coletor existente, preservando o controlador, os checkpoints e os logs do projeto.")
        label.setObjectName("muted")
        layout.addWidget(label)
        form = QGridLayout()
        self.categories = QPlainTextEdit()
        self.categories.setPlaceholderText("Categorias (uma por linha)")
        self.keywords = QPlainTextEdit()
        self.keywords.setPlaceholderText("Palavras-chave (uma por linha)")
        self.categories_loop = QPlainTextEdit()
        self.categories_loop.setPlaceholderText("Categorias em loop (uma por linha)")
        self.keywords_loop = QPlainTextEdit()
        self.keywords_loop.setPlaceholderText("Palavras-chave em loop (uma por linha)")
        for edit in (self.categories, self.keywords, self.categories_loop, self.keywords_loop):
            edit.setMaximumHeight(82)
        form.addWidget(QLabel("Categorias"), 0, 0)
        form.addWidget(QLabel("Palavras-chave"), 0, 1)
        form.addWidget(self.categories, 1, 0)
        form.addWidget(self.keywords, 1, 1)
        form.addWidget(QLabel("Categorias em loop"), 2, 0)
        form.addWidget(QLabel("Palavras-chave em loop"), 2, 1)
        form.addWidget(self.categories_loop, 3, 0)
        form.addWidget(self.keywords_loop, 3, 1)
        layout.addLayout(form)
        buttons = QHBoxLayout()
        self.start_btn = QPushButton("Iniciar")
        self.start_btn.setObjectName("primary")
        self.pause_btn = QPushButton("Pausar")
        self.resume_btn = QPushButton("Retomar")
        self.stop_btn = QPushButton("Parar com segurança")
        self.stop_btn.setObjectName("danger")
        self.start_btn.clicked.connect(self.start)
        self.pause_btn.clicked.connect(lambda: self.action("pause"))
        self.resume_btn.clicked.connect(lambda: self.action("resume"))
        self.stop_btn.clicked.connect(lambda: self.action("stop"))
        for btn in (self.start_btn, self.pause_btn, self.resume_btn, self.stop_btn):
            buttons.addWidget(btn)
        layout.addLayout(buttons)
        self.state = QLabel("Estado: consultando...")
        layout.addWidget(self.state)
        self.logs = QPlainTextEdit()
        self.logs.setReadOnly(True)
        layout.addWidget(self.logs)
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.poll)
        self.timer.start(2200)
        self.poll()

    @staticmethod
    def _lines(widget):
        return [x.strip() for x in widget.toPlainText().splitlines() if x.strip()]

    def start(self):
        payload = {
            "categorias": self._lines(self.categories),
            "keywords": self._lines(self.keywords),
            "categorias_loop": self._lines(self.categories_loop),
            "keywords_loop": self._lines(self.keywords_loop),
        }
        try:
            data = self.api.post("/api/desktop/magalu/start/", payload)
            self.execution_id = (data.get("status") or {}).get("execucao_id")
            self.last_log_id = 0
            self.logs.clear()
            self.state.setText("Estado: iniciado")
            if data.get("avisos"):
                QMessageBox.information(self, "Aviso de divulgação", "\n\n".join(item.get("mensagem", "") for item in data["avisos"]))
            self.poll()
        except APIError as exc:
            QMessageBox.warning(self, "Central Magalu", str(exc))

    def action(self, action):
        try:
            data = self.api.post(f"/api/desktop/magalu/{action}/")
            status = data.get("status", {})
            self.state.setText(f"Estado: {status.get('status', action)}")
        except APIError as exc:
            QMessageBox.warning(self, "Central Magalu", str(exc))

    def poll(self):
        try:
            status = self.api.get("/api/desktop/magalu/status/")
            self.execution_id = status.get("execucao_id") or self.execution_id
            progress = status.get("progresso") or {}
            self.state.setText(
                f"Estado: {status.get('status', status.get('estado', '—'))} · "
                f"Processados: {progress.get('processados', 0)} · "
                f"Links: {progress.get('links', 0)} · Total: {progress.get('total', 0)}"
            )
            params = {"since": self.last_log_id}
            if self.execution_id:
                params["execution_id"] = self.execution_id
            data = self.api.get("/api/desktop/magalu/logs/", params=params)
            for item in data.get("logs", []):
                self.logs.appendPlainText(f"[{item.get('nivel')}] {item.get('mensagem')}")
                self.last_log_id = max(self.last_log_id, int(item.get("id", 0)))
        except APIError as exc:
            self.state.setText(f"API indisponível: {exc}")


class MercadoLivrePage(QWidget):
    def __init__(self, api, start_ml, stop_ml):
        super().__init__()
        self.api = api
        self.start_ml = start_ml
        self.stop_ml = stop_ml
        layout = QVBoxLayout(self)
        title = QLabel("Coletor Mercado Livre")
        title.setObjectName("pageTitle")
        layout.addWidget(title)
        description = QLabel("Integração do script Playwright original, mantido sem alterações. O perfil persistente e o navegador são executados neste computador.")
        description.setObjectName("muted")
        description.setWordWrap(True)
        layout.addWidget(description)
        form = QFormLayout()
        self.term = QLineEdit()
        self.term.setPlaceholderText("Ex.: iPhone 15")
        self.quantity = QSpinBox()
        self.quantity.setRange(1, 50)
        self.quantity.setValue(10)
        form.addRow("Produto", self.term)
        form.addRow("Quantidade", self.quantity)
        layout.addLayout(form)
        self.start_button = QPushButton("Pesquisar no Mercado Livre")
        self.start_button.setObjectName("primary")
        self.start_button.clicked.connect(lambda: self.start_ml(self.term.text().strip(), self.quantity.value()))
        layout.addWidget(self.start_button, alignment=Qt.AlignLeft)
        stop_button = QPushButton("Parar busca")
        stop_button.setObjectName("danger")
        stop_button.clicked.connect(self.stop_ml)
        layout.addWidget(stop_button, alignment=Qt.AlignLeft)
        layout.addWidget(QLabel("Saída do coletor"))
        self.logs = QPlainTextEdit()
        self.logs.setReadOnly(True)
        layout.addWidget(self.logs)


class MainWindow(QMainWindow):
    def __init__(self, api, user_data):
        super().__init__()
        self.api = api
        self.user_data = user_data
        self.ml_process = None
        self.ml_execution_id = None
        self.ml_output = ""
        self.ml_prompt_handled = False
        self.ml_stopping = False
        self.ml_term = ""
        self.setWindowTitle(APP_NAME)
        self.resize(1280, 820)
        root = QWidget()
        outer = QHBoxLayout(root)
        sidebar = QFrame()
        sidebar.setFixedWidth(210)
        side = QVBoxLayout(sidebar)
        brand = QLabel("SKALLORA")
        brand.setStyleSheet("font-size: 19pt; font-weight: 800; color: #2ecc71; padding: 10px;")
        side.addWidget(brand)
        self.stack = QStackedWidget()
        self.pages = {}
        self.nav_buttons = []
        self._add_page(side, "Visão geral", DashboardPage(api))
        self._add_page(side, "Coleta Geral", ColetaGeralPage(api, self.start_ml))
        self._add_page(side, "Central Magalu", CentralMagaluPage(api))
        self.ml_page = MercadoLivrePage(api, self.start_ml, self.stop_ml)
        self._add_page(side, "Mercado Livre", self.ml_page)
        self._add_page(side, "Produtos", ProductsPage(api))
        self._add_page(side, "Execuções", ExecutionsPage(api))
        side.addStretch(1)
        user_label = QLabel(f"Conectado: {user_data.get('username', '')}")
        user_label.setObjectName("muted")
        user_label.setWordWrap(True)
        side.addWidget(user_label)
        logout = QPushButton("Sair")
        logout.clicked.connect(self.logout)
        side.addWidget(logout)
        outer.addWidget(sidebar)
        outer.addWidget(self.stack, 1)
        self.setCentralWidget(root)
        self.nav_buttons[0].setChecked(True)
        self.stack.setCurrentIndex(0)
        self.dashboard_timer = QTimer(self)
        self.dashboard_timer.timeout.connect(self._refresh_dashboard)
        self.dashboard_timer.start(15000)

    def _add_page(self, side, label, widget):
        button = QPushButton(label)
        button.setObjectName("nav")
        button.setCheckable(True)
        index = self.stack.count()
        button.clicked.connect(lambda _checked=False, idx=index: self._navigate(idx))
        side.addWidget(button)
        self.nav_buttons.append(button)
        self.stack.addWidget(widget)
        self.pages[label] = widget

    def _navigate(self, index):
        self.stack.setCurrentIndex(index)
        for i, button in enumerate(self.nav_buttons):
            button.setChecked(i == index)

    def _refresh_dashboard(self):
        page = self.pages.get("Visão geral")
        if page:
            page.refresh()

    def _log_ml(self, text):
        self.ml_page.logs.appendPlainText(text)

    def start_ml(self, term, quantity):
        if self.ml_process and self.ml_process.state() != QProcess.NotRunning:
            QMessageBox.information(self, "Mercado Livre", "Já existe uma busca do Mercado Livre em andamento.")
            return False
        if not term:
            QMessageBox.warning(self, "Mercado Livre", "Informe o produto que deseja pesquisar.")
            return False
        try:
            created = self.api.post("/api/desktop/executions/create/", {"marketplace": "MERCADO_LIVRE", "termo": term, "quantidade": quantity})
        except APIError as exc:
            QMessageBox.warning(self, "Mercado Livre", str(exc))
            return False
        self.ml_execution_id = created["execucao"]["id"]
        self.ml_term = term
        self.ml_output = ""
        self.ml_prompt_handled = False
        self.ml_stopping = False
        self.ml_page.logs.clear()
        process = QProcess(self)
        self.ml_process = process
        process.setProcessChannelMode(QProcess.MergedChannels)
        process.readyReadStandardOutput.connect(self._read_ml_output)
        process.finished.connect(self._ml_finished)
        process.errorOccurred.connect(lambda error: self._log_ml(f"Erro do processo: {error}"))
        workdir = Path(os.getenv("LOCALAPPDATA", Path.home())) / "Skallora" / "mercado_livre"
        workdir.mkdir(parents=True, exist_ok=True)
        process.setWorkingDirectory(str(workdir))
        if getattr(sys, "frozen", False):
            program, arguments = sys.executable, ["--ml-child"]
        else:
            program, arguments = sys.executable, ["-u", str(Path(__file__).resolve()), "--ml-child"]
        process.start(program, arguments)
        if not process.waitForStarted(5000):
            self._finish_ml("ERRO", "Não foi possível iniciar o processo do coletor Mercado Livre.")
            return False
        process.write((term + "\n" + str(quantity) + "\n").encode("utf-8"))
        self._log_ml(f"Busca iniciada: {term} · limite {quantity}.")
        return True

    def _read_ml_output(self):
        if not self.ml_process:
            return
        chunk = bytes(self.ml_process.readAllStandardOutput()).decode("utf-8", errors="replace")
        if not chunk:
            return
        self.ml_output += chunk
        self.ml_page.logs.appendPlainText(chunk.rstrip())
        if "Pressione Enter aqui no terminal" in self.ml_output and not self.ml_prompt_handled:
            self.ml_prompt_handled = True
            QMessageBox.information(
                self,
                "Ação necessária no navegador",
                "O navegador do Mercado Livre foi aberto. Faça login ou resolva o CAPTCHA manualmente, se solicitado. Quando a página de resultados estiver carregada, clique em OK para continuar.",
            )
            if self.ml_process and self.ml_process.state() != QProcess.NotRunning:
                self.ml_process.write(b"\n")
        if "Pressione Enter para fechar o navegador" in self.ml_output:
            if self.ml_process and self.ml_process.state() != QProcess.NotRunning:
                self.ml_process.write(b"\n")

    def stop_ml(self):
        if not self.ml_process or self.ml_process.state() == QProcess.NotRunning:
            return
        self.ml_stopping = True
        self.ml_process.terminate()
        QTimer.singleShot(1800, lambda: self.ml_process.kill() if self.ml_process and self.ml_process.state() != QProcess.NotRunning else None)

    def _ml_finished(self, exit_code, _exit_status):
        if self.ml_stopping:
            self._finish_ml("PARADO", "Busca interrompida pelo usuário.")
            self.ml_stopping = False
            return
        results = []
        results = parse_results(self.ml_output)
        errors = []
        for name, price_text, url in results:
            try:
                self.api.post("/api/desktop/products/ingest/", {
                    "execution_id": self.ml_execution_id,
                    "marketplace": "MERCADO_LIVRE",
                    "categoria": f"Busca: {self.ml_term}"[:120],
                    "nome": name,
                    "url_produto": url,
                    # O script original extrai somente a fração do preço; não
                    # persistimos esse valor parcial como se fosse preço completo.
                })
                self._log_ml(f"Importado: {name} · preço exibido pelo coletor: {price_text}")
            except APIError as exc:
                errors.append(f"{name}: {exc}")
        if exit_code == 0:
            message = f"Busca encerrada. {len(results)} produto(s) importado(s)."
            if errors:
                message += " Falhas de importação: " + " | ".join(errors[:3])
            self._finish_ml("FINALIZADO", message)
        else:
            message = f"O coletor encerrou com código {exit_code}. Produtos importados: {len(results)}."
            if errors:
                message += " " + " | ".join(errors[:3])
            self._finish_ml("ERRO", message)

    def _finish_ml(self, state, message):
        if self.ml_execution_id:
            try:
                self.api.post(f"/api/desktop/executions/{self.ml_execution_id}/finish/", {"estado": state, "erro": message if state == "ERRO" else ""})
            except APIError as exc:
                self._log_ml(f"Não foi possível sincronizar o encerramento: {exc}")
        self._log_ml(message)
        self.ml_execution_id = None
        self.ml_process = None

    def logout(self):
        closed = self.close()
        if not closed or self.isVisible():
            return
        try:
            import keyring
            username = self.user_data.get("username", "")
            if username:
                keyring.delete_password("SkalloraDesktop", username)
        except Exception:
            pass

    def closeEvent(self, event):
        if self.ml_process and self.ml_process.state() != QProcess.NotRunning:
            answer = QMessageBox.question(self, "Coletor em execução", "Há uma busca do Mercado Livre em execução. Deseja encerrá-la e sair?", QMessageBox.Yes | QMessageBox.No)
            if answer != QMessageBox.Yes:
                event.ignore()
                return
            self.stop_ml()
            if self.ml_process and self.ml_process.state() != QProcess.NotRunning:
                self.ml_process.waitForFinished(2500)
                if self.ml_process.state() != QProcess.NotRunning:
                    self.ml_process.kill()
                    self.ml_process.waitForFinished(2000)
        event.accept()


def main():
    app = QApplication(sys.argv)
    app.setApplicationName(APP_NAME)
    app.setStyle("Fusion")
    app.setStyleSheet(DARK_STYLE)
    settings = QSettings("Skallora", "Desktop")
    client = None
    user_data = None
    username = settings.value("username", "")
    base_url = settings.value("api_url", "http://127.0.0.1:8000")
    if username:
        try:
            import keyring
            saved_token = keyring.get_password("SkalloraDesktop", username)
            if saved_token:
                candidate = APIClient(base_url, saved_token)
                user_data = candidate.get("/api/desktop/me/").get("usuario")
                client = candidate
        except Exception:
            client = None
            user_data = None
    if client is None:
        dialog = LoginDialog(settings)
        if dialog.exec() != QDialog.Accepted:
            return 0
        client = dialog.client
        user_data = dialog.login_data["usuario"]
    window = MainWindow(client, user_data)
    window.show()
    return app.exec()


if __name__ == "__main__":
    raise SystemExit(main())
