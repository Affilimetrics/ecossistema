from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse


User = get_user_model()


@override_settings(DEBUG=True)
class LocalTestPortalTests(TestCase):
    def setUp(self):
        self.staff = User.objects.create_user(
            username="staff@example.com", email="staff@example.com",
            password="SenhaForte123!", is_staff=True,
        )
        self.client.force_login(self.staff)

    def test_staff_can_open_test_portal_in_debug(self):
        response = self.client.get(reverse("painel_testes"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Testes automatizados")
        self.assertContains(response, "SQLite temporário", html=False)

    @patch("core.views.executar_suite_isolada")
    def test_staff_can_run_only_a_predefined_suite(self, run_suite):
        run_suite.return_value = {
            "success": True,
            "output": "Ran 3 tests",
            "command": "python manage.py test core.test_authentication.RegistrationTests",
            "database": "SQLite temporário (descartado ao final)",
        }
        response = self.client.post(reverse("executar_testes"), {"suite": "cadastro"})
        self.assertEqual(response.status_code, 200)
        run_suite.assert_called_once_with("cadastro")
        self.assertContains(response, "Ran 3 tests")

    @patch("core.views.executar_suite_isolada")
    def test_unknown_suite_is_rejected_without_invoking_runner(self, run_suite):
        response = self.client.post(reverse("executar_testes"), {"suite": "os.system('whoami')"})
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Selecione uma suíte de testes válida.")
        run_suite.assert_not_called()

    @override_settings(DEBUG=False)
    def test_test_portal_is_not_available_outside_debug(self):
        response = self.client.get(reverse("painel_testes"))
        self.assertEqual(response.status_code, 404)


class LocalTestPortalPermissionTests(TestCase):
    @override_settings(DEBUG=True)
    def test_non_staff_user_cannot_open_test_portal(self):
        user = User.objects.create_user(username="ordinary@example.com", password="SenhaForte123!")
        self.client.force_login(user)
        response = self.client.get(reverse("painel_testes"))
        self.assertEqual(response.status_code, 302)
        self.assertIn("/admin/login/", response.url)
