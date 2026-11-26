from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse

from core.models import PerfilUsuario

User = get_user_model()


class RegistrationTests(TestCase):
    def payload(self, **overrides):
        data = {
            "nome": "Pessoa de Teste",
            "email": "pessoa@example.com",
            "data_nascimento": "1992-04-03",
            "telefone": "+55 11 99999-0000",
            "pais": "Brasil",
            "estado": "SP",
            "cidade": "Osasco",
            "timezone": "America/Sao_Paulo",
            "password": "SenhaForte123!",
            "password_confirm": "SenhaForte123!",
        }
        data.update(overrides)
        return data

    def test_registration_creates_user_profile_and_bcrypt_sha256_hash(self):
        response = self.client.post(reverse("cadastro"), self.payload())
        self.assertRedirects(response, reverse("home"))
        user = User.objects.get(email="pessoa@example.com")
        profile = PerfilUsuario.objects.get(owner=user)
        self.assertEqual(user.username, "pessoa@example.com")
        self.assertEqual(user.first_name, "Pessoa de Teste")
        self.assertTrue(user.check_password("SenhaForte123!"))
        self.assertTrue(user.password.startswith("bcrypt_sha256$"))
        self.assertEqual(str(profile.data_nascimento), "1992-04-03")
        self.assertEqual(profile.telefone, "+55 11 99999-0000")
        self.assertTrue(response.wsgi_request.user.is_authenticated)

    def test_duplicate_email_is_rejected_case_insensitively(self):
        User.objects.create_user(username="existing@example.com", email="existing@example.com", password="OldPass123!")
        response = self.client.post(reverse("cadastro"), self.payload(email="EXISTING@example.com"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Já existe uma conta com esse e-mail.")
        self.assertEqual(User.objects.filter(email__iexact="existing@example.com").count(), 1)

    def test_password_without_number_is_rejected(self):
        response = self.client.post(reverse("cadastro"), self.payload(password="SenhaForte!", password_confirm="SenhaForte!"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "pelo menos um número")
        self.assertFalse(User.objects.filter(email="pessoa@example.com").exists())

    def test_password_without_special_character_is_rejected(self):
        response = self.client.post(reverse("cadastro"), self.payload(password="SenhaForte123", password_confirm="SenhaForte123"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "caractere especial")
        self.assertFalse(User.objects.filter(email="pessoa@example.com").exists())

    def test_short_password_is_rejected(self):
        response = self.client.post(reverse("cadastro"), self.payload(password="Ab1!", password_confirm="Ab1!"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "pelo menos 8 caracteres")
        self.assertFalse(User.objects.filter(email="pessoa@example.com").exists())

    def test_mismatched_password_confirmation_is_rejected(self):
        response = self.client.post(reverse("cadastro"), self.payload(password_confirm="OutraSenha123!"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "As senhas não coincidem.")
        self.assertFalse(User.objects.filter(email="pessoa@example.com").exists())

    def test_future_birth_date_and_invalid_timezone_are_rejected(self):
        future_date = "2999-01-01"
        response = self.client.post(reverse("cadastro"), self.payload(data_nascimento=future_date))
        self.assertContains(response, "não pode estar no futuro")
        response = self.client.post(reverse("cadastro"), self.payload(timezone="Fuso/Inexistente"))
        self.assertContains(response, "fuso horário IANA válido")
        self.assertFalse(User.objects.filter(email="pessoa@example.com").exists())


class LoginTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="login@example.com",
            email="login@example.com",
            password="SenhaForte123!",
        )

    def test_login_accepts_email_case_insensitively(self):
        response = self.client.post(reverse("login"), {
            "username": "  LOGIN@EXAMPLE.COM ",
            "password": "SenhaForte123!",
        })
        self.assertRedirects(response, reverse("home"))
        self.assertEqual(int(self.client.session["_auth_user_id"]), self.user.pk)

    def test_login_accepts_legacy_mixed_case_username(self):
        legacy = User.objects.create_user(
            username="Legacy.User@Example.com",
            email="Legacy.User@Example.com",
            password="SenhaForte123!",
        )
        response = self.client.post(reverse("login"), {
            "username": "legacy.user@example.com",
            "password": "SenhaForte123!",
        })
        self.assertRedirects(response, reverse("home"))
        self.assertEqual(int(self.client.session["_auth_user_id"]), legacy.pk)

    def test_remember_me_extends_session_without_persisting_password(self):
        response = self.client.post(reverse("login"), {
            "username": "login@example.com",
            "password": "SenhaForte123!",
            "remember_me": "on",
        })
        self.assertRedirects(response, reverse("home"))
        self.assertAlmostEqual(self.client.session.get_expiry_age(), 60 * 60 * 24 * 14, delta=2)
        self.assertNotIn("password", self.client.session)

    def test_session_expires_at_browser_close_when_remember_me_is_unchecked(self):
        self.client.post(reverse("login"), {
            "username": "login@example.com",
            "password": "SenhaForte123!",
        })
        self.assertTrue(self.client.session.get_expire_at_browser_close())

    def test_external_next_url_is_not_allowed(self):
        response = self.client.post(reverse("login"), {
            "username": "login@example.com",
            "password": "SenhaForte123!",
            "next": "https://attacker.example/steal",
        })
        self.assertRedirects(response, reverse("home"))

    def test_invalid_credentials_do_not_authenticate(self):
        response = self.client.post(reverse("login"), {
            "username": "login@example.com",
            "password": "WrongPassword123!",
        })
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "E-mail ou senha inválidos.")
        self.assertNotIn("_auth_user_id", self.client.session)

    def test_legacy_pbkdf2_hash_is_accepted_and_upgraded_after_login(self):
        from django.contrib.auth.hashers import make_password

        self.user.password = make_password("SenhaAntiga123!", hasher="pbkdf2_sha256")
        self.user.save(update_fields=["password"])
        response = self.client.post(reverse("login"), {
            "username": "login@example.com",
            "password": "SenhaAntiga123!",
        })
        self.assertRedirects(response, reverse("home"))
        self.user.refresh_from_db()
        self.assertTrue(self.user.password.startswith("bcrypt_sha256$"))
