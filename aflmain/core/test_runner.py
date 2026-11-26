"""Execução local e isolada das suítes automatizadas do ecossistema."""

import os
import subprocess
import sys
import tempfile
from pathlib import Path

from django.conf import settings


ALL_TEST_LABELS = [
    "core.test_authentication",
    "core.test_profile",
    "core.tests",
    "core.test_advanced_tools",
    "core.test_desktop_api",
    "core.test_testing_portal",
    "core.test_test_runner",
    "magalu_bot.tests.test_afiliados",
    "ads_manager.tests",
    "ltv.tests.test_importer",
    "ltv.tests.test_metrics",
    "cpa.tests.test_analytics",
    "cpa.tests.test_importer",
    "financeiro.tests.test_frontend",
    "financeiro.tests.test_roi",
    "desktop_app.tests.test_ml_output",
]


TEST_SUITES = {
    "cadastro": {
        "title": "Cadastro e política de senha",
        "description": "Criação da conta, campos cadastrais, e-mail duplicado e validação da senha.",
        "labels": ["core.test_authentication.RegistrationTests"],
    },
    "login": {
        "title": "Login e sessão",
        "description": "Login por e-mail, compatibilidade legada, lembrar sessão, credenciais inválidas e redirecionamento seguro.",
        "labels": ["core.test_authentication.LoginTests"],
    },
    "perfil": {
        "title": "Perfil e preferências",
        "description": "Dados pessoais, e-mail, metas, fuso, preferências, senha e foto de perfil.",
        "labels": ["core.test_profile.ProfileTests"],
    },
    "exclusao_conta": {
        "title": "Exclusão de conta e dados vinculados",
        "description": "Senha e confirmação, limpeza de relações protegidas, dados de outras contas e foto de perfil.",
        "labels": ["core.test_profile.AccountDeletionTests"],
    },
    "core": {
        "title": "Core, dashboard e API Desktop",
        "description": "Fluxos principais, ferramentas avançadas, isolamento de dados e API desktop.",
        "labels": ["core.tests", "core.test_advanced_tools", "core.test_desktop_api", "core.test_testing_portal", "core.test_test_runner"],
    },
    "magalu": {
        "title": "Magalu e validação de afiliados",
        "description": "Validação de domínios, extração de links e leitura de comissão.",
        "labels": ["magalu_bot.tests.test_afiliados"],
    },
    "tpb": {
        "title": "Tráfego Pago (TPB)",
        "description": "Autenticação compartilhada, isolamento de contas, snapshots e criptografia.",
        "labels": ["ads_manager.tests"],
    },
    "ltv": {
        "title": "LTV Manager",
        "description": "Importação, idempotência, métricas, coortes e isolamento por usuário.",
        "labels": ["ltv.tests.test_importer", "ltv.tests.test_metrics"],
    },
    "cpa": {
        "title": "CPA Manager",
        "description": "Importadores, normalização, métricas, APIs e isolamento de campanhas.",
        "labels": ["cpa.tests.test_analytics", "cpa.tests.test_importer"],
    },
    "roi": {
        "title": "ROI Manager",
        "description": "Cálculos financeiros, interfaces, importação e dimensões por usuário.",
        "labels": ["financeiro.tests.test_frontend", "financeiro.tests.test_roi"],
    },
    "desktop": {
        "title": "Ferramentas Desktop e Mercado Livre",
        "description": "Leitura e validação de resultados do parser desktop do Mercado Livre.",
        "labels": ["desktop_app.tests.test_ml_output"],
    },
    "all": {
        "title": "Suíte completa do projeto",
        "description": "Executa todos os módulos de teste catalogados, inclusive pacotes fora de INSTALLED_APPS, em SQLite temporário.",
        "labels": ALL_TEST_LABELS,
    },
}


def _sqlite_database_url(path: Path) -> str:
    # dj-database-url espera quatro barras para caminhos POSIX absolutos.
    normalized = path.resolve().as_posix()
    return f"sqlite:///{normalized}" if not normalized.startswith("/") else f"sqlite:////{normalized.lstrip('/')}"


def executar_suite_isolada(suite_key: str) -> dict:
    """Executa somente uma suíte allowlisted em banco temporário, nunca no DB real."""
    if not settings.DEBUG:
        raise PermissionError("A execução pela interface só é permitida com DEBUG=True.")
    if suite_key not in TEST_SUITES:
        raise ValueError("Suíte de testes desconhecida.")

    suite = TEST_SUITES[suite_key]
    with tempfile.TemporaryDirectory(prefix="affilimetrics-tests-") as temp_dir:
        database_file = Path(temp_dir) / "isolated.sqlite3"
        env = os.environ.copy()
        env["DATABASE_URL"] = _sqlite_database_url(database_file)
        env["DEBUG"] = "True"
        env.setdefault("SECRET_KEY", "somente-para-testes-locais-nao-usar-em-producao")
        command = [sys.executable, str(settings.BASE_DIR / "manage.py"), "test"]
        command.extend(suite["labels"])
        command.extend(["--verbosity", "2", "--noinput"])
        try:
            result = subprocess.run(
                command,
                cwd=str(settings.BASE_DIR),
                env=env,
                text=True,
                capture_output=True,
                timeout=300,
                check=False,
            )
            output = "\n".join(part for part in (result.stdout, result.stderr) if part).strip()
            return {
                "success": result.returncode == 0,
                "returncode": result.returncode,
                "output": output or "O executor terminou sem produzir saída.",
                "command": "python manage.py test " + " ".join(suite["labels"]),
                "database": "SQLite temporário (descartado ao final)",
            }
        except subprocess.TimeoutExpired as exc:
            partial = []
            for item in (exc.stdout, exc.stderr):
                if item:
                    partial.append(item.decode(errors="replace") if isinstance(item, bytes) else item)
            return {
                "success": False,
                "returncode": None,
                "output": "\n".join(partial + ["Tempo limite de 300 segundos atingido; o processo foi encerrado."]),
                "command": "python manage.py test " + " ".join(suite["labels"]),
                "database": "SQLite temporário (descartado ao final)",
            }
        except OSError as exc:
            return {
                "success": False,
                "returncode": None,
                "output": f"Não foi possível iniciar o executor: {exc}",
                "command": "python manage.py test " + " ".join(suite["labels"]),
                "database": "SQLite temporário (descartado ao final)",
            }
