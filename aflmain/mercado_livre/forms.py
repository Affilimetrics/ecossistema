import re
from urllib.parse import urlsplit

from django import forms


class SearchForm(forms.Form):
    query = forms.CharField(
        label="Termo de busca",
        max_length=180,
        strip=True,
        widget=forms.TextInput(attrs={"class": "form-control", "placeholder": "Ex.: fone bluetooth", "autocomplete": "off"}),
    )
    quantity = forms.IntegerField(
        label="Quantidade",
        min_value=1,
        max_value=50,
        initial=10,
        widget=forms.NumberInput(attrs={"class": "form-control", "min": 1, "max": 50}),
    )


class SettingsForm(forms.Form):
    site_id = forms.CharField(
        label="Site / país",
        max_length=8,
        initial="MLB",
        widget=forms.TextInput(attrs={"class": "form-control", "maxlength": 8}),
    )
    access_token = forms.CharField(
        required=False,
        strip=True,
        label="Access Token (opcional)",
        widget=forms.PasswordInput(attrs={
            "class": "form-control",
            "autocomplete": "new-password",
            "placeholder": "Deixe vazio para manter o token salvo",
        }, render_value=False),
    )
    clear_access_token = forms.BooleanField(required=False, label="Remover token salvo")
    affiliate_id = forms.CharField(
        required=False,
        max_length=120,
        label="ID/apelido de afiliado (referência)",
        widget=forms.TextInput(attrs={"class": "form-control"}),
    )
    request_timeout = forms.IntegerField(
        min_value=5,
        max_value=60,
        initial=20,
        label="Timeout (segundos)",
        widget=forms.NumberInput(attrs={"class": "form-control", "min": 5, "max": 60}),
    )

    def clean_site_id(self):
        value = self.cleaned_data["site_id"].strip().upper()
        if not re.fullmatch(r"[A-Z]{2,8}", value):
            raise forms.ValidationError("Informe um código de site válido, por exemplo MLB.")
        return value


class AffiliateLinkForm(forms.Form):
    affiliate_url = forms.URLField(
        required=False,
        max_length=3000,
        label="Link oficial de afiliado",
        widget=forms.URLInput(attrs={"class": "form-control form-control-sm", "placeholder": "https://..."}),
    )

    def clean_affiliate_url(self):
        value = (self.cleaned_data.get("affiliate_url") or "").strip()
        if not value:
            return ""
        try:
            parsed = urlsplit(value)
        except ValueError as exc:
            raise forms.ValidationError("O link de afiliado precisa ser uma URL HTTP ou HTTPS válida.") from exc
        if parsed.scheme not in {"http", "https"} or not parsed.netloc:
            raise forms.ValidationError("O link de afiliado precisa ser uma URL HTTP ou HTTPS válida.")
        return value


class AffiliateMappingUploadForm(forms.Form):
    mapping_file = forms.FileField(
        label="Arquivo affiliate_links.json",
        widget=forms.ClearableFileInput(attrs={
            "class": "form-control",
            "accept": ".json,application/json",
        }),
    )

    def clean_mapping_file(self):
        uploaded = self.cleaned_data["mapping_file"]
        if uploaded.size > 1_048_576:
            raise forms.ValidationError("O arquivo JSON deve ter no máximo 1 MB.")
        if not uploaded.name.lower().endswith(".json"):
            raise forms.ValidationError("Envie um arquivo com extensão .json.")
        return uploaded
