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

class TelegramPublicationTests(TestCase):
    def test_mensagem_telegram_escapa_dados_dinamicos(self):
        produto = Produto.objects.create(
            categoria="cozinha",
            nome='Cafeteira <Inox> & "Top"',
            url_produto="https://example.com/produto-telegram",
            preco_atual="99.90",
        )
        Afiliado.objects.create(
            produto=produto,
            link_afiliado="https://divulgador.magalu.com/oferta?a=1&b=2",
        )
        oferta = criar_oferta(produto)
        self.assertIn("&lt;Inox&gt;", oferta.mensagem)
        self.assertIn("&amp;", oferta.mensagem)
        self.assertIn("a=1&amp;b=2", oferta.mensagem)


class TemplateCompatibilityTests(TestCase):
    def test_panela_coletada_como_banheiro_nao_usa_template_de_banheiro(self):
        from django.contrib.auth import get_user_model
        from .marketing import chamada_inteligente, avaliar_compatibilidade_contexto
        from .models import TemplateOferta

        owner = get_user_model().objects.create_user(username="template-owner", password="x")
        TemplateOferta.objects.create(
            owner=owner,
            tipo="CATEGORIA",
            chave="banheiro",
            chamadas=["🚿 CHAMADA EXCLUSIVA DE BANHEIRO"],
            ativo=True,
        )

        compativel, _ = avaliar_compatibilidade_contexto(
            "Jogo de Panelas Antiaderente 5 Peças",
            "banheiro",
        )
        chamada = chamada_inteligente(
            "Jogo de Panelas Antiaderente 5 Peças",
            "banheiro",
            preco_atual="199.90",
            owner=owner,
        )

        self.assertFalse(compativel)
        self.assertNotEqual(chamada, "🚿 CHAMADA EXCLUSIVA DE BANHEIRO")
        self.assertNotIn("banheiro", chamada.casefold())

    def test_produto_compativel_continua_usando_template_da_categoria(self):
        from django.contrib.auth import get_user_model
        from .marketing import chamada_inteligente, avaliar_compatibilidade_contexto
        from .models import TemplateOferta

        owner = get_user_model().objects.create_user(username="template-owner-ok", password="x")
        TemplateOferta.objects.create(
            owner=owner,
            tipo="CATEGORIA",
            chave="banheiro",
            chamadas=["🚿 CHAMADA EXCLUSIVA DE BANHEIRO"],
            ativo=True,
        )

        compativel, _ = avaliar_compatibilidade_contexto(
            "Gabinete para Banheiro com Cuba e Espelho",
            "banheiro",
        )
        chamada = chamada_inteligente(
            "Gabinete para Banheiro com Cuba e Espelho",
            "banheiro",
            preco_atual="299.90",
            owner=owner,
        )

        self.assertTrue(compativel)
        self.assertEqual(chamada, "🚿 CHAMADA EXCLUSIVA DE BANHEIRO")

    def test_contexto_sem_evidencia_forte_nao_e_bloqueado(self):
        from .marketing import avaliar_compatibilidade_contexto

        compativel, _ = avaliar_compatibilidade_contexto(
            "Organizador Multiuso Premium",
            "banheiro",
        )
        self.assertTrue(compativel)
