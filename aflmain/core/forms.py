from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django import forms
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.utils import timezone

from .models import PerfilUsuario

User = get_user_model()

PLATAFORMAS_DIVULGACAO = (
    ("MAGALU", "Magalu"),
    ("MERCADO_LIVRE", "Mercado Livre"),
    ("SHOPEE", "Shopee"),
    ("AMAZON", "Amazon"),
    ("OUTRA", "Outra"),
)


class CadastroForm(forms.Form):
    nome = forms.CharField(max_length=150, label="Nome")
    email = forms.EmailField(label="E-mail")
    data_nascimento = forms.DateField(
        required=False,
        label="Data de nascimento",
        widget=forms.DateInput(attrs={"type": "date"}),
    )
    telefone = forms.CharField(max_length=30, required=False, label="Telefone")
    pais = forms.CharField(max_length=80, required=False, initial="Brasil")
    estado = forms.CharField(max_length=100, required=False)
    cidade = forms.CharField(max_length=120, required=False)
    timezone = forms.CharField(max_length=80, required=False, initial="America/Sao_Paulo")
    password = forms.CharField(
        label="Senha", strip=False,
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
    )
    password_confirm = forms.CharField(
        label="Confirmar senha", strip=False,
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
    )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs.setdefault("class", "form-control")

    def clean_nome(self):
        nome = self.cleaned_data["nome"].strip()
        if not nome:
            raise ValidationError("Informe seu nome.")
        return nome

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()
        if User.objects.filter(username__iexact=email).exists() or User.objects.filter(email__iexact=email).exists():
            raise ValidationError("Já existe uma conta com esse e-mail.")
        return email

    def clean_data_nascimento(self):
        data = self.cleaned_data.get("data_nascimento")
        if data and data > timezone.localdate():
            raise ValidationError("A data de nascimento não pode estar no futuro.")
        return data

    def clean_timezone(self):
        value = (self.cleaned_data.get("timezone") or "America/Sao_Paulo").strip()
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError:
            raise ValidationError("Informe um fuso horário IANA válido, por exemplo America/Sao_Paulo.")
        return value

    def clean(self):
        cleaned = super().clean()
        password = cleaned.get("password")
        confirmation = cleaned.get("password_confirm")
        if password and confirmation and password != confirmation:
            self.add_error("password_confirm", "As senhas não coincidem.")
        if password:
            email = cleaned.get("email", "")
            nome = cleaned.get("nome", "")
            validation_user = User(username=email or "", email=email or "", first_name=nome or "")
            try:
                validate_password(password, user=validation_user)
            except ValidationError as exc:
                self.add_error("password", exc)
        return cleaned


class PerfilForm(forms.Form):
    nome = forms.CharField(max_length=150, label="Nome")
    email = forms.EmailField(label="E-mail")
    telefone = forms.CharField(max_length=30, required=False, label="Telefone")
    data_nascimento = forms.DateField(
        required=False, label="Data de nascimento",
        widget=forms.DateInput(attrs={"type": "date"}),
    )
    pais = forms.CharField(max_length=80, required=False, label="País")
    estado = forms.CharField(max_length=100, required=False, label="Estado")
    cidade = forms.CharField(max_length=120, required=False, label="Cidade")
    timezone = forms.CharField(max_length=80, label="Fuso horário")
    meta_investimento_mensal = forms.DecimalField(
        required=False, min_value=0, max_digits=12, decimal_places=2,
        label="Meta de investimento mensal",
    )
    meta_retorno_mensal = forms.DecimalField(
        required=False, min_value=0, max_digits=12, decimal_places=2,
        label="Meta de retorno mensal",
    )
    plataformas_divulgacao = forms.MultipleChoiceField(
        required=False, choices=PLATAFORMAS_DIVULGACAO,
        widget=forms.CheckboxSelectMultiple, label="Plataformas de interesse",
    )
    nicho = forms.CharField(max_length=120, required=False, label="Nicho de atuação")
    foto = forms.ImageField(required=False, label="Foto de perfil")
    remover_foto = forms.BooleanField(required=False, label="Remover foto atual")
    password = forms.CharField(
        required=False, strip=False, label="Nova senha",
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
    )
    password_confirm = forms.CharField(
        required=False, strip=False, label="Confirmar nova senha",
        widget=forms.PasswordInput(attrs={"autocomplete": "new-password"}),
    )

    def __init__(self, *args, user, profile, **kwargs):
        self.user = user
        self.profile = profile
        initial = {
            "nome": user.first_name,
            "email": user.email,
            "telefone": profile.telefone,
            "data_nascimento": profile.data_nascimento,
            "pais": profile.pais,
            "estado": profile.estado,
            "cidade": profile.cidade,
            "timezone": profile.timezone,
            "meta_investimento_mensal": profile.meta_investimento_mensal,
            "meta_retorno_mensal": profile.meta_retorno_mensal,
            "plataformas_divulgacao": profile.plataformas_divulgacao,
            "nicho": profile.nicho,
        }
        initial.update(kwargs.pop("initial", {}))
        super().__init__(*args, initial=initial, **kwargs)
        for name, field in self.fields.items():
            if name == "plataformas_divulgacao":
                continue
            if name == "remover_foto":
                field.widget.attrs.setdefault("class", "form-check-input")
            else:
                field.widget.attrs.setdefault("class", "form-control")

    def clean_nome(self):
        nome = self.cleaned_data["nome"].strip()
        if not nome:
            raise ValidationError("Informe seu nome.")
        return nome

    def clean_email(self):
        email = self.cleaned_data["email"].strip().lower()
        duplicates = User.objects.filter(email__iexact=email).exclude(pk=self.user.pk)
        username_duplicates = User.objects.filter(username__iexact=email).exclude(pk=self.user.pk)
        if duplicates.exists() or username_duplicates.exists():
            raise ValidationError("Este e-mail já está sendo usado por outra conta.")
        return email

    def clean_data_nascimento(self):
        data = self.cleaned_data.get("data_nascimento")
        if data and data > timezone.localdate():
            raise ValidationError("A data de nascimento não pode estar no futuro.")
        return data

    def clean_timezone(self):
        value = (self.cleaned_data.get("timezone") or "").strip()
        try:
            ZoneInfo(value)
        except ZoneInfoNotFoundError:
            raise ValidationError("Informe um fuso horário IANA válido, por exemplo America/Sao_Paulo.")
        return value

    def clean_foto(self):
        foto = self.cleaned_data.get("foto")
        if foto and foto.size > 5 * 1024 * 1024:
            raise ValidationError("A foto deve ter no máximo 5 MB.")
        return foto

    def clean_password(self):
        password = self.cleaned_data.get("password")
        if password:
            validate_password(password, user=self.user)
        return password

    def clean(self):
        cleaned = super().clean()
        password = cleaned.get("password")
        confirmation = cleaned.get("password_confirm")
        if password and password != confirmation:
            self.add_error("password_confirm", "As senhas não coincidem.")
        elif confirmation and not password:
            self.add_error("password", "Informe a nova senha para confirmar a alteração.")
        return cleaned


class ExclusaoContaForm(forms.Form):
    password = forms.CharField(
        label="Senha atual", strip=False,
        widget=forms.PasswordInput(attrs={"autocomplete": "current-password"}),
    )
    confirmacao = forms.CharField(
        label='Digite EXCLUIR para confirmar', max_length=20,
    )

    def __init__(self, *args, user, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)

    def clean_password(self):
        password = self.cleaned_data["password"]
        if not self.user.check_password(password):
            raise ValidationError("A senha atual está incorreta.")
        return password

    def clean_confirmacao(self):
        value = self.cleaned_data["confirmacao"].strip()
        if value != "EXCLUIR":
            raise ValidationError('Digite exatamente EXCLUIR para confirmar.')
        return value
