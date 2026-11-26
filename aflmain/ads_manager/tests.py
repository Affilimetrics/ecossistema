from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse
from django.utils import timezone
from cryptography.fernet import Fernet
from unittest.mock import patch

from .models import AdAccount, Campaign, ConnectedAccount
from .services.encryption import decrypt_token, encrypt_token
from .services.meta import MetaAPIError
from .services.campaign_sync import synchronize_campaigns


class DashboardTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="teste", password="senha-forte-123")

    def test_private_dashboard_redirects_to_host_login(self):
        response = self.client.get(reverse("ads_manager:dashboard"))
        self.assertEqual(response.status_code, 302)
        self.assertIn("/login/", response["Location"])

    def test_private_dashboard_uses_host_authentication(self):
        self.client.force_login(self.user)
        response = self.client.get(reverse("ads_manager:dashboard"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Conecte sua conta Meta")

    def test_user_cannot_select_another_users_ad_account(self):
        user_b = get_user_model().objects.create_user(username="b", password="senha-forte-123")
        connection = ConnectedAccount.objects.create(
            user=user_b, provider="META", external_user_id="123",
            display_name="Outro usuário", encrypted_access_token="encrypted-placeholder",
        )
        account = AdAccount.objects.create(connection=connection, external_id="act_987", name="Conta privada")
        self.client.force_login(self.user)
        response = self.client.post(reverse("ads_manager:select_account"), {"account_id": account.pk})
        self.assertEqual(response.status_code, 404)

    def test_main_dashboard_and_advanced_area_share_campaign_snapshot(self):
        connection = ConnectedAccount.objects.create(
            user=self.user, provider="META", external_user_id="meta-123",
            display_name="Perfil de teste", encrypted_access_token="encrypted-placeholder",
        )
        account = AdAccount.objects.create(
            connection=connection, external_id="act_100", name="Conta teste",
            last_campaign_sync_at=timezone.now(),
        )
        Campaign.objects.create(
            ad_account=account, external_id="campaign-1", name="Campanha ativa compartilhada",
            status="ACTIVE", effective_status="ACTIVE", objective="OUTCOME_SALES",
        )
        self.client.force_login(self.user)

        main_dashboard = self.client.get(reverse("home"))
        traffic_dashboard = self.client.get(reverse("ads_manager:dashboard"))
        campaigns_page = self.client.get(reverse("ads_manager:campaigns"))

        self.assertEqual(main_dashboard.status_code, 200)
        self.assertEqual(traffic_dashboard.status_code, 200)
        self.assertEqual(campaigns_page.status_code, 200)
        self.assertContains(main_dashboard, "Campanha ativa compartilhada")
        self.assertContains(traffic_dashboard, "Campanha ativa compartilhada")
        self.assertContains(campaigns_page, "Campanha ativa compartilhada")
        self.assertContains(main_dashboard, "Campanhas ativas")
        self.assertContains(traffic_dashboard, "Campanhas ativas")

    def test_failed_remote_sync_preserves_last_campaign_snapshot(self):
        key = Fernet.generate_key().decode()
        with override_settings(TOKEN_ENCRYPTION_KEY=key):
            connection = ConnectedAccount.objects.create(
                user=self.user, provider="META", external_user_id="meta-fail",
                encrypted_access_token=encrypt_token("token-de-teste"),
            )
            account = AdAccount.objects.create(connection=connection, external_id="act_200")
            existing = Campaign.objects.create(
                ad_account=account, external_id="campaign-kept", name="Snapshot preservado",
                status="ACTIVE", effective_status="ACTIVE",
            )
            with patch(
                "ads_manager.services.campaign_sync.MetaAdsProvider.list_campaigns",
                side_effect=MetaAPIError("API temporariamente indisponível"),
            ):
                with self.assertRaises(MetaAPIError):
                    synchronize_campaigns(connection, account, force=True)

            self.assertTrue(Campaign.objects.filter(pk=existing.pk).exists())
            account.refresh_from_db()
            self.assertIsNone(account.last_campaign_sync_at)


class TokenEncryptionTests(TestCase):
    @override_settings(TOKEN_ENCRYPTION_KEY=Fernet.generate_key().decode())
    def test_token_round_trip(self):
        token = "token-de-teste-nao-real"
        encrypted = encrypt_token(token)
        self.assertNotEqual(encrypted, token)
        self.assertEqual(decrypt_token(encrypted), token)
