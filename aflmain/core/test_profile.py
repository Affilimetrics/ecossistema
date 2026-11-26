from datetime import date
from io import BytesIO
from tempfile import TemporaryDirectory

from PIL import Image
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse

from core.models import PerfilUsuario, Produto

User = get_user_model()


class ProfileTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="profile@example.com",
            email="profile@example.com",
            first_name="Nome Original",
            password="SenhaForte123!",
        )
        self.profile = PerfilUsuario.objects.create(owner=self.user)
        self.client.force_login(self.user)

    def profile_payload(self, **overrides):
        data = {
            "nome": "Nome Atualizado",
            "email": "profile@example.com",
            "telefone": "+55 (11) 99999-0000",
            "data_nascimento": "1990-05-12",
            "pais": "Brasil",
            "estado": "SP",
            "cidade": "Osasco",
            "timezone": "America/Sao_Paulo",
            "meta_investimento_mensal": "1500.00",
            "meta_retorno_mensal": "3200.50",
            "plataformas_divulgacao": ["MAGALU", "OUTRA"],
            "nicho": "Casa e decoração",
            "password": "",
            "password_confirm": "",
        }
        data.update(overrides)
        return data

    def test_profile_page_requires_authentication(self):
        self.client.logout()
        response = self.client.get(reverse("perfil"))
        self.assertEqual(response.status_code, 302)
        self.assertIn(reverse("login"), response.url)

    def test_profile_updates_personal_data_goals_and_preferences(self):
        response = self.client.post(reverse("perfil"), self.profile_payload())
        self.assertRedirects(response, reverse("perfil"))
        self.user.refresh_from_db()
        self.profile.refresh_from_db()
        self.assertEqual(self.user.first_name, "Nome Atualizado")
        self.assertEqual(self.profile.telefone, "+55 (11) 99999-0000")
        self.assertEqual(self.profile.data_nascimento, date(1990, 5, 12))
        self.assertEqual(str(self.profile.meta_investimento_mensal), "1500.00")
        self.assertEqual(str(self.profile.meta_retorno_mensal), "3200.50")
        self.assertEqual(self.profile.plataformas_divulgacao, ["MAGALU", "OUTRA"])
        self.assertEqual(self.profile.nicho, "Casa e decoração")
        self.assertEqual(self.profile.pais, "Brasil")
        self.assertEqual(self.profile.estado, "SP")
        self.assertEqual(self.profile.cidade, "Osasco")

    def test_profile_email_change_updates_username_and_email(self):
        response = self.client.post(reverse("perfil"), self.profile_payload(email="novo@example.com"))
        self.assertRedirects(response, reverse("perfil"))
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "novo@example.com")
        self.assertEqual(self.user.username, "novo@example.com")

    def test_profile_rejects_email_already_used_by_another_account(self):
        User.objects.create_user(username="other@example.com", email="other@example.com", password="OtherPass123!")
        response = self.client.post(reverse("perfil"), self.profile_payload(email="OTHER@example.com"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Este e-mail já está sendo usado")
        self.user.refresh_from_db()
        self.assertEqual(self.user.email, "profile@example.com")

    def test_profile_rejects_negative_goals_and_future_birth_date(self):
        response = self.client.post(reverse("perfil"), self.profile_payload(meta_investimento_mensal="-1"))
        self.assertEqual(response.status_code, 200)
        self.profile.refresh_from_db()
        self.assertIsNone(self.profile.meta_investimento_mensal)
        response = self.client.post(reverse("perfil"), self.profile_payload(data_nascimento="2999-01-01"))
        self.assertContains(response, "não pode estar no futuro")

    def test_profile_can_change_password_without_losing_session(self):
        response = self.client.post(reverse("perfil"), self.profile_payload(
            password="NovaSenha456!", password_confirm="NovaSenha456!"
        ))
        self.assertRedirects(response, reverse("perfil"))
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NovaSenha456!"))
        self.assertTrue(self.client.get(reverse("perfil")).wsgi_request.user.is_authenticated)

    def test_profile_rejects_new_password_without_number_or_special_character(self):
        invalid_passwords = (
            ("SenhaForte!", "pelo menos um número"),
            ("SenhaForte123", "caractere especial"),
        )
        for password, expected_message in invalid_passwords:
            with self.subTest(password=password):
                response = self.client.post(reverse("perfil"), self.profile_payload(
                    password=password, password_confirm=password,
                ))
                self.assertEqual(response.status_code, 200)
                self.assertContains(response, expected_message)
                self.user.refresh_from_db()
                self.assertTrue(self.user.check_password("SenhaForte123!"))

    def test_profile_rejects_mismatched_new_password(self):
        response = self.client.post(reverse("perfil"), self.profile_payload(
            password="NovaSenha456!", password_confirm="SenhaDiferente456!"
        ))
        self.assertEqual(response.status_code, 200)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("SenhaForte123!"))

    def test_profile_accepts_valid_uploaded_photo(self):
        buffer = BytesIO()
        Image.new("RGB", (20, 20), color=(40, 80, 120)).save(buffer, format="PNG")
        photo = SimpleUploadedFile("avatar.png", buffer.getvalue(), content_type="image/png")
        with TemporaryDirectory() as media_dir, override_settings(MEDIA_ROOT=media_dir):
            payload = self.profile_payload()
            payload["foto"] = photo
            response = self.client.post(reverse("perfil"), payload)
            self.assertRedirects(response, reverse("perfil"))
            self.profile.refresh_from_db()
            self.assertTrue(self.profile.foto.name.startswith("perfis/"))
            self.assertTrue(self.profile.foto.storage.exists(self.profile.foto.name))

    def test_profile_rejects_non_image_upload(self):
        fake_image = SimpleUploadedFile("not-image.png", b"this is not an image", content_type="image/png")
        payload = self.profile_payload()
        payload["foto"] = fake_image
        response = self.client.post(reverse("perfil"), payload)
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "imagem válida")

    def test_profile_can_remove_existing_photo(self):
        buffer = BytesIO()
        Image.new("RGB", (20, 20), color=(80, 40, 120)).save(buffer, format="PNG")
        photo = SimpleUploadedFile("avatar.png", buffer.getvalue(), content_type="image/png")
        with TemporaryDirectory() as media_dir, override_settings(MEDIA_ROOT=media_dir):
            self.profile.foto = photo
            self.profile.save()
            old_name = self.profile.foto.name
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.post(reverse("perfil"), self.profile_payload(remover_foto="on"))
            self.assertRedirects(response, reverse("perfil"))
            self.profile.refresh_from_db()
            self.assertFalse(self.profile.foto)
            self.assertFalse(self.profile.foto.storage.exists(old_name))

    def test_profile_rejects_invalid_timezone(self):
        response = self.client.post(reverse("perfil"), self.profile_payload(timezone="Fuso/Inexistente"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "fuso horário IANA válido")


class AccountDeletionTests(TestCase):
    def setUp(self):
        self.owner = User.objects.create_user(
            username="delete@example.com",
            email="delete@example.com",
            password="SenhaForte123!",
        )
        PerfilUsuario.objects.create(owner=self.owner)
        Produto.objects.create(
            owner=self.owner,
            categoria="casa",
            nome="Produto a excluir",
            url_produto="https://example.com/produto-excluir",
        )
        from cpa.models import Campaign as CPACampaign, PerformanceRecord
        self.cpa_campaign = CPACampaign.objects.create(user=self.owner, name="Campanha a excluir")
        self.cpa_record = PerformanceRecord.objects.create(
            user=self.owner, campaign=self.cpa_campaign, spend="12.50", clicks=10, conversions=1,
        )
        from ltv.models import Acquisition
        self.ltv_acquisition = Acquisition.objects.create(user=self.owner, external_reference="delete-acquisition")
        from financeiro.models import Marketplace as ROIMarketplace, Channel as ROIChannel
        from financeiro.models import Product as ROIProduct, Campaign as ROICampaign
        from financeiro.models import Expense, Commission as ROICommission, RecurringExpense
        self.roi_marketplace = ROIMarketplace.objects.create(user=self.owner, name="Marketplace para excluir")
        self.roi_channel = ROIChannel.objects.create(user=self.owner, name="Canal para excluir")
        self.roi_product = ROIProduct.objects.create(
            user=self.owner, marketplace=self.roi_marketplace, name="Produto ROI para excluir",
        )
        self.roi_campaign = ROICampaign.objects.create(user=self.owner, name="Campanha ROI para excluir")
        Expense.objects.create(
            user=self.owner, description="Despesa protegida", amount="20.00",
            marketplace=self.roi_marketplace, product=self.roi_product,
            campaign=self.roi_campaign, channel=self.roi_channel,
        )
        ROICommission.objects.create(
            user=self.owner, amount="5.00", marketplace=self.roi_marketplace,
            product=self.roi_product, campaign=self.roi_campaign, channel=self.roi_channel,
        )
        RecurringExpense.objects.create(
            user=self.owner, description="Despesa recorrente protegida", amount="3.00",
            next_date=date(2026, 12, 1), marketplace=self.roi_marketplace, channel=self.roi_channel,
        )
        self.other_user = User.objects.create_user(
            username="keep@example.com", email="keep@example.com", password="OutraSenha123!"
        )
        Produto.objects.create(
            owner=self.other_user,
            categoria="casa",
            nome="Produto de outra conta",
            url_produto="https://example.com/produto-preservar",
        )
        self.client.force_login(self.owner)

    def test_wrong_password_does_not_delete_account(self):
        response = self.client.post(reverse("excluir_conta"), {
            "password": "SenhaIncorreta123!", "confirmacao": "EXCLUIR",
        })
        self.assertRedirects(response, reverse("perfil"))
        self.assertTrue(User.objects.filter(pk=self.owner.pk).exists())

    def test_missing_confirmation_does_not_delete_account(self):
        response = self.client.post(reverse("excluir_conta"), {
            "password": "SenhaForte123!", "confirmacao": "APAGAR",
        })
        self.assertRedirects(response, reverse("perfil"))
        self.assertTrue(User.objects.filter(pk=self.owner.pk).exists())

    def test_account_deletion_cascades_owned_core_cpa_ltv_roi_data_only(self):
        owner_id = self.owner.pk
        other_id = self.other_user.pk
        self.assertEqual(Produto.objects.filter(owner_id=owner_id).count(), 1)
        response = self.client.post(reverse("excluir_conta"), {
            "password": "SenhaForte123!", "confirmacao": "EXCLUIR",
        })
        self.assertRedirects(response, reverse("index"))
        self.assertFalse(User.objects.filter(pk=owner_id).exists())
        self.assertFalse(Produto.objects.filter(owner_id=owner_id).exists())
        self.assertFalse(self.cpa_campaign.__class__.objects.filter(pk=self.cpa_campaign.pk).exists())
        self.assertFalse(self.cpa_record.__class__.objects.filter(pk=self.cpa_record.pk).exists())
        self.assertFalse(self.ltv_acquisition.__class__.objects.filter(pk=self.ltv_acquisition.pk).exists())
        from financeiro.models import Expense, Commission as ROICommission, RecurringExpense
        self.assertFalse(Expense.objects.filter(user_id=owner_id).exists())
        self.assertFalse(ROICommission.objects.filter(user_id=owner_id).exists())
        self.assertFalse(RecurringExpense.objects.filter(user_id=owner_id).exists())
        self.assertFalse(self.roi_marketplace.__class__.objects.filter(pk=self.roi_marketplace.pk).exists())
        self.assertFalse(self.roi_channel.__class__.objects.filter(pk=self.roi_channel.pk).exists())
        self.assertFalse(self.roi_product.__class__.objects.filter(pk=self.roi_product.pk).exists())
        self.assertFalse(self.roi_campaign.__class__.objects.filter(pk=self.roi_campaign.pk).exists())
        self.assertTrue(User.objects.filter(pk=other_id).exists())
        self.assertTrue(Produto.objects.filter(owner_id=other_id).exists())
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_account_deletion_removes_profile_photo_after_commit(self):
        buffer = BytesIO()
        Image.new("RGB", (20, 20), color=(20, 120, 80)).save(buffer, format="PNG")
        photo = SimpleUploadedFile("avatar.png", buffer.getvalue(), content_type="image/png")
        with TemporaryDirectory() as media_dir, override_settings(MEDIA_ROOT=media_dir):
            self.profile = PerfilUsuario.objects.get(owner=self.owner)
            self.profile.foto = photo
            self.profile.save()
            old_name = self.profile.foto.name
            storage = self.profile.foto.storage
            self.assertTrue(storage.exists(old_name))
            with self.captureOnCommitCallbacks(execute=True):
                response = self.client.post(reverse("excluir_conta"), {
                    "password": "SenhaForte123!", "confirmacao": "EXCLUIR",
                })
            self.assertRedirects(response, reverse("index"))
            self.assertFalse(storage.exists(old_name))

    def test_account_deletion_rejects_get(self):
        response = self.client.get(reverse("excluir_conta"))
        self.assertEqual(response.status_code, 405)
        self.assertTrue(User.objects.filter(pk=self.owner.pk).exists())
