from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

from django.test import SimpleTestCase, override_settings

from core.test_runner import TEST_SUITES, executar_suite_isolada


@override_settings(DEBUG=True)
class IsolatedTestRunnerTests(SimpleTestCase):
    def test_runner_uses_temporary_sqlite_and_only_allowlisted_labels(self):
        captured = {}

        def fake_subprocess_run(command, cwd, env, **kwargs):
            captured.update(command=command, cwd=cwd, env=env, kwargs=kwargs)
            database_url = env.get("DATABASE_URL", "")
            self.assertTrue(database_url.startswith("sqlite:///"))
            self.assertNotEqual(database_url, "")
            self.assertTrue(Path(cwd, "manage.py").is_file())
            self.assertIn("core.test_authentication.RegistrationTests", command)
            self.assertIn("--noinput", command)
            return SimpleNamespace(returncode=0, stdout="Ran 2 tests", stderr="")

        with patch("core.test_runner.subprocess.run", side_effect=fake_subprocess_run):
            result = executar_suite_isolada("cadastro")

        self.assertTrue(result["success"])
        self.assertIn("SQLite temporário", result["database"])
        self.assertEqual(captured["kwargs"]["timeout"], 300)

    def test_runner_rejects_unknown_suite_before_starting_process(self):
        with patch("core.test_runner.subprocess.run") as run_process:
            with self.assertRaises(ValueError):
                executar_suite_isolada("__import__('os').system('whoami')")
        run_process.assert_not_called()

    @override_settings(DEBUG=False)
    def test_runner_is_disabled_when_debug_is_false(self):
        with patch("core.test_runner.subprocess.run") as run_process:
            with self.assertRaises(PermissionError):
                executar_suite_isolada("cadastro")
        run_process.assert_not_called()

    def test_suite_registry_contains_every_documented_area(self):
        expected = {"cadastro", "login", "perfil", "exclusao_conta", "core", "magalu", "tpb", "ltv", "cpa", "roi", "desktop", "all"}
        self.assertEqual(set(TEST_SUITES), expected)
