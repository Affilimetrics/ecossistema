import json
from decimal import Decimal
from unittest.mock import Mock, patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse

from core.models import Afiliado, Produto
from .models import MarketplaceItem, SearchRun


class MercadoLivreIntegrationTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="ml-owner", password="SafePass123!")
        self.other = get_user_model().objects.create_user(username="ml-other", password="SafePass123!")
        self.client.force_login(self.user)

    def api_payload(self, product_id="MLB123456789", permalink="https://produto.mercadolivre.com.br/MLB-123456789-produto"):
        return {
            "results": [{
                "id": product_id,
                "title": "Fone Bluetooth de Teste",
                "price": 99.90,
                "original_price": 149.90,
                "permalink": permalink,
                "thumbnail": "https://http2.mlstatic.com/D_NQ_NP_test.jpg",
            }]
        }

    @patch("mercado_livre.services.requests.get")
    def test_search_persists_product_in_shared_catalog_without_fabricating_affiliate_url(self, mocked_get):
        response = Mock(ok=True, status_code=200)
        response.json.return_value = self.api_payload()
        mocked_get.return_value = response

        result = self.client.post(reverse("mercado_livre:search"), {"query": "fone bluetooth", "quantity": 10})

        self.assertRedirects(result, reverse("mercado_livre:dashboard"))
        product = Produto.objects.get(owner=self.user, marketplace="MERCADO_LIVRE")
        item = MarketplaceItem.objects.get(user=self.user, product=product)
        self.assertEqual(product.preco_atual, Decimal("99.90"))
        self.assertEqual(product.preco_anterior, Decimal("149.90"))
        self.assertEqual(item.external_id, "MLB123456789")
        self.assertEqual(item.affiliate_url, "")
        self.assertFalse(Afiliado.objects.filter(produto=product, link_afiliado__gt="").exists())
        self.assertEqual(SearchRun.objects.get(user=self.user).returned_count, 1)
        self.assertNotIn("Authorization", mocked_get.call_args.kwargs["headers"])

    @patch("mercado_livre.services.requests.get")
    def test_official_affiliate_link_updates_shared_core_affiliate_record_and_dashboard(self, mocked_get):
        response = Mock(ok=True, status_code=200)
        response.json.return_value = self.api_payload()
        mocked_get.return_value = response
        self.client.post(reverse("mercado_livre:search"), {"query": "fone", "quantity": 1})
        item = MarketplaceItem.objects.get(user=self.user)

        response = self.client.post(
            reverse("mercado_livre:update_affiliate_link", args=[item.pk]),
            {"affiliate_url": "https://mercadolivre.com/sec/afiliado-oficial"},
        )
        self.assertRedirects(response, reverse("mercado_livre:dashboard"))
        item.refresh_from_db()
        self.assertEqual(item.affiliate_url, "https://mercadolivre.com/sec/afiliado-oficial")
        self.assertEqual(item.product.afiliado.link_afiliado, item.affiliate_url)

        magalu = Produto.objects.create(
            owner=self.user,
            marketplace="MAGALU",
            categoria="cozinha",
            nome="Produto Magalu",
            url_produto="https://www.magazineluiza.com.br/produto-teste/p/123",
        )
        Afiliado.objects.create(produto=magalu, link_afiliado="https://divulgador.magalu.com/teste")
        home = self.client.get(reverse("home"))
        self.assertEqual(home.status_code, 200)
        market_data = json.loads(home.context["marketplaces_chart"])
        data_by_name = {row[0]: row[1] for row in market_data[1:]}
        self.assertEqual(data_by_name["Magalu"], 1)
        self.assertEqual(data_by_name["Mercado Livre"], 1)
        self.assertEqual(home.context["links"], 2)
        self.assertEqual(home.context["ml_products_count"], 1)
        self.assertEqual(home.context["ml_affiliate_links_count"], 1)

    @patch("mercado_livre.services.requests.get")
    def test_repeat_search_updates_existing_item_instead_of_duplicating(self, mocked_get):
        response = Mock(ok=True, status_code=200)
        response.json.return_value = self.api_payload()
        mocked_get.return_value = response
        self.client.post(reverse("mercado_livre:search"), {"query": "fone", "quantity": 1})
        self.client.post(reverse("mercado_livre:search"), {"query": "fone bluetooth", "quantity": 1})
        self.assertEqual(Produto.objects.filter(owner=self.user, marketplace="MERCADO_LIVRE").count(), 1)
        self.assertEqual(MarketplaceItem.objects.filter(user=self.user).count(), 1)
        self.assertEqual(SearchRun.objects.filter(user=self.user, status="SUCCESS").count(), 2)

    def test_user_cannot_change_another_users_marketplace_item(self):
        product = Produto.objects.create(
            owner=self.other,
            marketplace="MERCADO_LIVRE",
            categoria="ML: teste",
            nome="Privado",
            url_produto="https://produto.mercadolivre.com.br/MLB-999-privado",
        )
        item = MarketplaceItem.objects.create(
            user=self.other,
            product=product,
            external_id="MLB999",
            original_url=product.url_produto,
        )
        response = self.client.post(
            reverse("mercado_livre:update_affiliate_link", args=[item.pk]),
            {"affiliate_url": "https://mercadolivre.com/sec/nao-autorizado"},
        )
        self.assertEqual(response.status_code, 404)
        item.refresh_from_db()
        self.assertEqual(item.affiliate_url, "")


    def test_import_mapping_supports_external_id_and_original_url(self):
        first = Produto.objects.create(
            owner=self.user, marketplace="MERCADO_LIVRE", categoria="ML: teste",
            nome="Por ID", url_produto="https://produto.mercadolivre.com.br/MLB-300-id",
        )
        first_item = MarketplaceItem.objects.create(
            user=self.user, product=first, external_id="MLB300", original_url=first.url_produto,
        )
        second = Produto.objects.create(
            owner=self.user, marketplace="MERCADO_LIVRE", categoria="ML: teste",
            nome="Por URL", url_produto="https://produto.mercadolivre.com.br/MLB-400-url",
        )
        second_item = MarketplaceItem.objects.create(
            user=self.user, product=second, external_id="MLB400", original_url=second.url_produto,
        )
        other_product = Produto.objects.create(
            owner=self.other, marketplace="MERCADO_LIVRE", categoria="ML: teste",
            nome="Não pertence a esta conta", url_produto="https://produto.mercadolivre.com.br/MLB-500-outro",
        )
        MarketplaceItem.objects.create(
            user=self.other, product=other_product, external_id="MLB500", original_url=other_product.url_produto,
        )
        mapping = {
            "MLB300": "https://meli.la/link-oficial-300",
            first.url_produto: "https://meli.la/link-por-url-que-nao-deve-prevalecer",
            second.url_produto: "https://meli.la/link-oficial-400",
            "MLB404": "https://meli.la/nao-cadastrado",
            "MLB500": "https://meli.la/outro-usuario",
        }
        uploaded = SimpleUploadedFile(
            "affiliate_links.json", json.dumps(mapping).encode("utf-8"), content_type="application/json",
        )
        response = self.client.post(
            reverse("mercado_livre:import_affiliate_mapping"),
            {"mapping_file": uploaded},
        )
        self.assertRedirects(response, reverse("mercado_livre:dashboard"))
        first_item.refresh_from_db()
        second_item.refresh_from_db()
        self.assertEqual(first_item.affiliate_url, mapping["MLB300"])
        self.assertEqual(second_item.affiliate_url, mapping[second.url_produto])
        self.assertEqual(first.afiliado.link_afiliado, mapping["MLB300"])
        self.assertEqual(second.afiliado.link_afiliado, mapping[second.url_produto])
        self.assertFalse(hasattr(other_product, "afiliado"))

    def test_module_requires_main_login(self):
        self.client.logout()
        response = self.client.get(reverse("mercado_livre:dashboard"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("login"), response.url)

    def test_export_is_scoped_to_authenticated_user(self):
        product = Produto.objects.create(
            owner=self.user,
            marketplace="MERCADO_LIVRE",
            categoria="ML: teste",
            nome="Exportar",
            url_produto="https://produto.mercadolivre.com.br/MLB-100-exportar",
        )
        MarketplaceItem.objects.create(user=self.user, product=product, external_id="MLB100", original_url=product.url_produto)
        other_product = Produto.objects.create(
            owner=self.other,
            marketplace="MERCADO_LIVRE",
            categoria="ML: teste",
            nome="Não exportar",
            url_produto="https://produto.mercadolivre.com.br/MLB-200-outro",
        )
        MarketplaceItem.objects.create(user=self.other, product=other_product, external_id="MLB200", original_url=other_product.url_produto)
        response = self.client.get(reverse("mercado_livre:export_json"))
        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.content)
        self.assertEqual(payload["count"], 1)
        self.assertEqual(payload["products"][0]["product_id"], "MLB100")
