from pathlib import Path

from django.contrib.auth import get_user_model
from django.contrib.staticfiles import finders
from django.test import TestCase
from django.urls import reverse


class FrontendSmokeTests(TestCase):
    def setUp(self):
        user_model = get_user_model()
        self.user = user_model.objects.create_user(
            username="frontend_test", password="Test-password-12345"
        )
        self.client.force_login(self.user)

    def test_css_and_javascript_are_registered_static_assets(self):
        css_path = finders.find("roi/css/app.css")
        js_path = finders.find("roi/js/app.js")
        self.assertTrue(css_path and Path(css_path).is_file())
        self.assertTrue(js_path and Path(js_path).is_file())

    def test_dashboard_references_absolute_stylesheet_url(self):
        response = self.client.get(reverse("roi:dashboard"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'href="/static/roi/css/app.css"', html=False)
        self.assertContains(response, 'src="/static/roi/js/app.js"', html=False)

    def test_static_paths_remain_root_relative_on_nested_routes(self):
        response = self.client.get(reverse("roi:expense_create"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, 'href="/static/roi/css/app.css"', html=False)

    def test_authenticated_pages_render(self):
        routes = [
            "roi:dashboard", "roi:automation", "roi:expenses", "roi:commissions",
            "roi:products", "roi:campaigns", "roi:expense_create", "roi:commission_create",
            "roi:product_create", "roi:campaign_create", "roi:import_expenses",
        ]
        for route_name in routes:
            with self.subTest(route=route_name):
                response = self.client.get(reverse(route_name))
                self.assertEqual(response.status_code, 200)

    def test_manual_csv_import_requires_confirmation(self):
        from django.core.files.uploadedfile import SimpleUploadedFile
        from financeiro.models import Expense

        upload = SimpleUploadedFile(
            "investimentos.csv",
            "descricao;valor;data;categoria\nHospedagem;39,90;2026-11-17;assinaturas\n".encode("utf-8"),
            content_type="text/csv",
        )
        preview = self.client.post(reverse("roi:import_expenses"), {"arquivo": upload})
        self.assertEqual(preview.status_code, 200)
        self.assertContains(preview, "Prévia da importação")
        self.assertEqual(Expense.objects.filter(user=self.user).count(), 0)

        confirmation = self.client.post(reverse("roi:import_expenses"), {"confirmar": "1"})
        self.assertRedirects(confirmation, reverse("roi:expenses"))
        self.assertEqual(Expense.objects.filter(user=self.user).count(), 1)

    def test_first_use_creates_marketplace_choices(self):
        from financeiro.models import Marketplace, Channel

        response = self.client.get(reverse("roi:product_create"))
        self.assertEqual(response.status_code, 200)
        self.assertGreaterEqual(Marketplace.objects.filter(user=self.user).count(), 5)
        self.assertGreaterEqual(Channel.objects.filter(user=self.user).count(), 8)
