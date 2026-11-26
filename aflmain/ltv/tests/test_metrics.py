from datetime import timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone
from ltv.analytics.metrics import dashboard_metrics, cohort_matrix
from ltv.models import Acquisition, Campaign, Channel, Commission, Marketplace, Product

User = get_user_model()

class LTVMetricTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="metric-user", password="SafePassword123!")
        self.marketplace = Marketplace.objects.get(user=self.user, code="magalu")

    def test_ltv_uses_only_approved_and_attributed_commissions(self):
        acquisition = Acquisition.objects.create(user=self.user, external_reference="acq-001", acquired_at=timezone.now() - timedelta(days=45), marketplace=self.marketplace, attribution_method="external_id", confidence=Decimal("100"))
        Commission.objects.create(user=self.user, acquisition=acquisition, marketplace=self.marketplace, amount=Decimal("100.00"), status="approved", sale_date=timezone.now() - timedelta(days=30))
        Commission.objects.create(user=self.user, acquisition=acquisition, marketplace=self.marketplace, amount=Decimal("50.00"), status="pending", sale_date=timezone.now() - timedelta(days=20))
        Commission.objects.create(user=self.user, marketplace=self.marketplace, amount=Decimal("200.00"), status="approved", sale_date=timezone.now() - timedelta(days=10))
        metrics = dashboard_metrics(self.user)
        self.assertEqual(metrics["approved_total"], Decimal("300.00"))
        self.assertEqual(metrics["attributed_total"], Decimal("100.00"))
        self.assertEqual(metrics["pending_total"], Decimal("50.00"))
        self.assertEqual(metrics["average_ltv"], Decimal("100.00"))

    def test_dimension_charts_fall_back_to_acquisition_relationships(self):
        channel = Channel.objects.get(user=self.user, code="telegram")
        product = Product.objects.create(user=self.user, name="Produto associado", marketplace=self.marketplace)
        campaign = Campaign.objects.create(user=self.user, name="Campanha associada", marketplace=self.marketplace, channel=channel)
        acquisition = Acquisition.objects.create(
            user=self.user, external_reference="acq-dimensions",
            acquired_at=timezone.now() - timedelta(days=20),
            marketplace=self.marketplace, product=product, campaign=campaign, channel=channel,
        )
        Commission.objects.create(
            user=self.user, acquisition=acquisition, amount=Decimal("42.00"),
            status="approved", sale_date=timezone.now() - timedelta(days=5),
        )
        metrics = dashboard_metrics(self.user)
        self.assertIn("Produto associado", metrics["product_labels"])
        self.assertIn("Campanha associada", metrics["campaign_labels"])
        self.assertIn("Telegram", metrics["channel_labels"])
        self.assertIn("Magalu", metrics["marketplace_labels"])

    def test_cohort_horizon_is_blank_until_mature(self):
        acquired = timezone.now() - timedelta(days=12)
        acquisition = Acquisition.objects.create(user=self.user, external_reference="acq-cohort", acquired_at=acquired, attribution_method="external_id")
        Commission.objects.create(user=self.user, acquisition=acquisition, amount=Decimal("35.00"), status="approved", sale_date=acquired + timedelta(days=2))
        rows = cohort_matrix(self.user)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]["d7"], Decimal("35.00"))
        self.assertIsNone(rows[0]["d30"])


class LTVViewTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="view-user", password="SafePassword123!")

    def test_dashboard_redirects_anonymous_user(self):
        response = self.client.get(reverse("ltv:dashboard"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("login"), response.url)

    def test_dashboard_loads_static_assets_and_real_empty_state(self):
        self.client.login(username="view-user", password="SafePassword123!")
        response = self.client.get(reverse("ltv:dashboard"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "/static/ltv/css/variables.css")
        self.assertContains(response, "Ainda não há comissões aprovadas")

    def test_user_cannot_see_another_users_acquisitions(self):
        other = User.objects.create_user(username="other-view", password="SafePassword123!")
        Acquisition.objects.create(user=other, external_reference="secret-reference")
        self.client.login(username="view-user", password="SafePassword123!")
        response = self.client.get(reverse("ltv:acquisition_list"))
        self.assertEqual(response.status_code, 200)
        self.assertNotContains(response, "secret-reference")
