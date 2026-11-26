from datetime import date
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse


class AdvancedToolsIntegrationTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="advanced_user", password="Strong-password-123!"
        )
        self.client.force_login(self.user)

    def test_cpa_and_roi_have_distinct_namespaced_routes(self):
        cpa = self.client.get(reverse("cpa:dashboard"))
        roi = self.client.get(reverse("roi:dashboard"))
        self.assertEqual(cpa.status_code, 200)
        self.assertEqual(roi.status_code, 200)
        self.assertTrue(cpa.request["PATH_INFO"].startswith("/cpa/"))
        self.assertTrue(roi.request["PATH_INFO"].startswith("/roi/"))

    def test_advanced_tools_require_the_shared_login(self):
        self.client.logout()
        for route in ("cpa:dashboard", "roi:dashboard"):
            response = self.client.get(reverse(route))
            self.assertEqual(response.status_code, 302)
            self.assertIn("/login/", response.url)

    def test_home_and_cpa_dashboard_share_the_same_aggregated_data(self):
        from cpa.models import Campaign, PerformanceRecord
        from cpa.analytics import build_dashboard_data

        campaign = Campaign.objects.create(user=self.user, name="CPA Home Test")
        PerformanceRecord.objects.create(
            user=self.user, campaign=campaign, date=date.today(),
            spend=Decimal("120.00"), clicks=60, conversions=3,
        )
        home = self.client.get(reverse("home"))
        cpa_page = self.client.get(reverse("cpa:dashboard"))
        self.assertEqual(home.status_code, 200)
        self.assertEqual(cpa_page.status_code, 200)
        service_data = build_dashboard_data(self.user)
        self.assertEqual(
            home.context["cpa_metrics"]["totals"]["spend"],
            service_data["totals"]["spend"],
        )
        self.assertEqual(
            home.context["cpa_metrics"]["totals"]["cpa"],
            service_data["totals"]["cpa"],
        )
        self.assertEqual(cpa_page.context["data"]["totals"], service_data["totals"])
        self.assertEqual(home.context["cpa_metrics"]["daily"], [])
        self.assertEqual(home.context["cpa_metrics"]["campaigns"], [])
        self.assertIsNone(home.context["cpa_metrics"]["record_count"])
        self.assertEqual(home.context["cpa_active_campaigns_count"], 1)

    def test_home_and_roi_dashboard_share_same_metrics_service(self):
        from financeiro.models import Expense, Commission, Marketplace
        from financeiro.services.indicadores import dashboard_metrics

        market = Marketplace.objects.create(user=self.user, name="Teste")
        Expense.objects.create(user=self.user, description="Anúncio", amount=Decimal("50.00"))
        Commission.objects.create(
            user=self.user, marketplace=market, amount=Decimal("100.00"),
            status="approved", commission_date=date.today(),
        )
        home = self.client.get(reverse("home"))
        roi_page = self.client.get(reverse("roi:dashboard"))
        self.assertEqual(home.status_code, 200)
        self.assertEqual(roi_page.status_code, 200)
        expected = dashboard_metrics(self.user)
        self.assertEqual(home.context["roi_metrics"]["approved"], expected["approved"])
        self.assertEqual(home.context["roi_metrics"]["investment"], expected["investment"])
        self.assertEqual(roi_page.context["approved"], expected["approved"])

    def test_roi_user_data_is_not_visible_to_other_accounts(self):
        from financeiro.models import Expense
        other = get_user_model().objects.create_user(
            username="roi_private_other", password="Strong-password-123!"
        )
        Expense.objects.create(
            user=other, description="Despesa privada de outra conta",
            amount=Decimal("999.00"),
        )
        response = self.client.get(reverse("roi:expenses"))
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "Despesa privada de outra conta")

    def test_cpa_user_data_is_not_visible_to_other_accounts(self):
        from cpa.models import Campaign
        other = get_user_model().objects.create_user(
            username="advanced_other", password="Strong-password-123!"
        )
        Campaign.objects.create(user=other, name="Private CPA campaign")
        response = self.client.get(reverse("cpa:campaign_list"))
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "Private CPA campaign")
