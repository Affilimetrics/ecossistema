from decimal import Decimal
from datetime import date
from django.contrib.auth import get_user_model
from django.test import TestCase, Client
from cpa.models import Campaign, PerformanceRecord, Platform, Channel, IntegrationToken
from django.contrib.auth.hashers import make_password
from django.core.exceptions import ValidationError
from cpa.analytics import aggregate_metrics

class MetricsTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="ana", password="StrongPass123!")
        self.platform = Platform.objects.get(user=self.user, code="META")
        self.channel = Channel.objects.get(user=self.user, code="INSTAGRAM")
        self.campaign = Campaign.objects.create(user=self.user, name="Campanha A", platform=self.platform, channel=self.channel)
    def test_cpa_cpc_and_conversion_rate(self):
        PerformanceRecord.objects.create(user=self.user, campaign=self.campaign, date=date(2026, 1, 1), spend=Decimal("120.00"), clicks=80, conversions=4)
        values = aggregate_metrics(PerformanceRecord.objects.filter(user=self.user))
        self.assertEqual(values["cpc"], Decimal("1.50"))
        self.assertEqual(values["cpa"], Decimal("30.00"))
        self.assertEqual(values["conversion_rate"], Decimal("5.00"))
    def test_zero_clicks_and_conversions_are_not_divided(self):
        PerformanceRecord.objects.create(user=self.user, campaign=self.campaign, date=date(2026, 1, 1), spend=Decimal("20.00"), clicks=0, conversions=0)
        values = aggregate_metrics(PerformanceRecord.objects.filter(user=self.user))
        self.assertIsNone(values["cpc"]); self.assertIsNone(values["cpa"])
    def test_dashboard_requires_login(self):
        response = Client().get("/cpa/")
        self.assertEqual(response.status_code, 302)
    def test_cross_account_campaign_reference_is_rejected(self):
        other = get_user_model().objects.create_user(username="other_owner", password="StrongPass123!")
        foreign_campaign = Campaign.objects.create(user=other, name="Private campaign")
        with self.assertRaises(ValidationError):
            PerformanceRecord.objects.create(user=self.user, campaign=foreign_campaign, spend=Decimal("10.00"), clicks=2, conversions=1)
    def test_records_are_isolated_by_user(self):
        PerformanceRecord.objects.create(user=self.user, campaign=self.campaign, spend=Decimal("90.00"), clicks=30, conversions=3)
        get_user_model().objects.create_user(username="bia", password="StrongPass123!")
        self.client.login(username="bia", password="StrongPass123!")
        response = self.client.get("/cpa/api/v1/metrics/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["totals"]["clicks"], 0)
        self.assertEqual(response.json()["totals"]["spend"], "0.00")

    def test_archiving_campaign_preserves_performance_history(self):
        record = PerformanceRecord.objects.create(user=self.user, campaign=self.campaign, spend=Decimal("12.00"), clicks=4, conversions=1)
        self.client.login(username="ana", password="StrongPass123!")
        response = self.client.post(f"/cpa/campanhas/{self.campaign.pk}/excluir/")
        self.assertEqual(response.status_code, 302)
        self.campaign.refresh_from_db()
        self.assertFalse(self.campaign.is_active)
        self.assertTrue(PerformanceRecord.objects.filter(pk=record.pk).exists())


class IntegrationApiTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="api_user", password="StrongPass123!")
        self.campaign = Campaign.objects.create(user=self.user, name="Campanha API", integration_key="campanha-api", external_id="ads-91")
        PerformanceRecord.objects.create(user=self.user, campaign=self.campaign, date=date(2026, 11, 17), spend=Decimal("75.00"), clicks=150, conversions=3)
        self.raw_token = "cpa_test_token_0123456789abcdef"
        IntegrationToken.objects.create(user=self.user, name="Projeto principal", prefix=self.raw_token[:12], token_hash=make_password(self.raw_token))
    def test_bearer_token_reads_only_its_account_metrics(self):
        response = Client().get("/cpa/api/v1/metrics/?start=2026-11-17&end=2026-11-17", HTTP_AUTHORIZATION=f"Bearer {self.raw_token}")
        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload["totals"]["cpc"], "0.50")
        self.assertEqual(payload["totals"]["cpa"], "25.00")
        self.assertEqual(payload["campaigns"][0]["integration_key"], "campanha-api")
        self.assertEqual(payload["campaigns"][0]["external_id"], "ads-91")
        self.assertNotIn("id", payload["campaigns"][0])
    def test_invalid_bearer_token_is_rejected(self):
        response = Client().get("/cpa/api/v1/metrics/", HTTP_AUTHORIZATION="Bearer invalid-token")
        self.assertEqual(response.status_code, 401)
