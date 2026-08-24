from django.test import TestCase
from .models import Produto, Afiliado, Execucao, Oferta
from .services import criar_oferta


class OfertaServiceTests(TestCase):
    def test_cria_oferta_com_desconto(self):
        produto = Produto.objects.create(
            categoria="cozinha",
            nome="Air Fryer X",
            url_produto="https://example.com/produto",
            preco_anterior="399.90",
            preco_atual="249.90",
        )
        Afiliado.objects.create(produto=produto, link_afiliado="https://example.com/afiliado")
        oferta = criar_oferta(produto)
        self.assertEqual(oferta.status, "PRONTA")
        self.assertIn("Air Fryer X", oferta.mensagem)
        self.assertIsNotNone(oferta.desconto_percentual)


class ExecutionModelTests(TestCase):
    def test_execucao_defaults(self):
        execucao = Execucao.objects.create(categorias=["cozinha"])
        self.assertEqual(execucao.produtos_processados, 0)
        self.assertEqual(execucao.estado, "INICIANDO")

class AuthenticationFlowTests(TestCase):
    def test_cadastro_cria_usuario_e_autentica(self):
        response = self.client.post("/cadastro/", {
            "nome": "Usuário Teste",
            "email": "teste@example.com",
            "password": "UmaSenhaForte123!",
            "password_confirm": "UmaSenhaForte123!",
        })
        self.assertRedirects(response, "/home/")
        self.assertTrue(response.wsgi_request.user.is_authenticated)

    def test_dashboard_exige_login(self):
        response = self.client.get("/dashboard/")
        self.assertEqual(response.status_code, 302)
        self.assertIn("/login/", response["Location"])

    def test_coletor_exige_login(self):
        response = self.client.get("/magalu/")
        self.assertEqual(response.status_code, 302)
        self.assertIn("/login/", response["Location"])
