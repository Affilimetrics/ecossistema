import json
from django.contrib.auth import get_user_model
from django.test import TestCase

from .models import Produto, Execucao


class DesktopApiTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.user = User.objects.create_user(username="desktop_tester", password="Senha-forte-123")
        self.other = User.objects.create_user(username="other_tester", password="Senha-forte-456")

    def _token(self, username="desktop_tester", password="Senha-forte-123"):
        response = self.client.post(
            "/api/desktop/login/",
            data=json.dumps({"username": username, "password": password}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 200)
        return response.json()["token"]

    def _auth(self, token):
        self.client.defaults["HTTP_AUTHORIZATION"] = f"Bearer {token}"

    def test_login_and_me(self):
        self._auth(self._token())
        response = self.client.get("/api/desktop/me/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["usuario"]["username"], "desktop_tester")

    def test_invalid_login_is_rejected(self):
        response = self.client.post(
            "/api/desktop/login/",
            data=json.dumps({"username": "desktop_tester", "password": "errada"}),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 401)

    def test_products_are_isolated_by_owner(self):
        Produto.objects.create(owner=self.user, marketplace="MERCADO_LIVRE", categoria="Busca", nome="Meu produto", url_produto="https://www.mercadolivre.com.br/p/MLB111")
        Produto.objects.create(owner=self.other, marketplace="MERCADO_LIVRE", categoria="Busca", nome="Produto alheio", url_produto="https://www.mercadolivre.com.br/p/MLB222")
        self._auth(self._token())
        response = self.client.get("/api/desktop/products/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([p["nome"] for p in response.json()["produtos"]], ["Meu produto"])

    def test_ingest_requires_owned_execution(self):
        execution = Execucao.objects.create(owner=self.other, estado="EXECUTANDO")
        self._auth(self._token())
        response = self.client.post(
            "/api/desktop/products/ingest/",
            data=json.dumps({
                "execution_id": execution.pk,
                "marketplace": "MERCADO_LIVRE",
                "nome": "Produto",
                "url_produto": "https://www.mercadolivre.com.br/p/MLB333",
            }),
            content_type="application/json",
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(Produto.objects.count(), 0)

    def test_unauthenticated_data_request_is_rejected(self):
        response = self.client.get("/api/desktop/dashboard/")
        self.assertEqual(response.status_code, 401)
