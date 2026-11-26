from django import forms
from django.core.exceptions import ValidationError
from .models import Acquisition, Commission, Product, Campaign, Channel, Marketplace, AutomationSettings


class StyledModelForm(forms.ModelForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            if isinstance(field.widget, forms.CheckboxInput):
                field.widget.attrs.setdefault("class", "form-check-input")
            elif isinstance(field.widget, forms.Select):
                field.widget.attrs.setdefault("class", "form-select")
            elif isinstance(field.widget, forms.Textarea):
                field.widget.attrs.setdefault("class", "form-control form-textarea")
            else:
                field.widget.attrs.setdefault("class", "form-control")
        for name, field in self.fields.items():
            if isinstance(field.widget, forms.DateTimeInput):
                field.widget.attrs.setdefault("type", "datetime-local")


class AcquisitionForm(StyledModelForm):
    class Meta:
        model = Acquisition
        fields = ["external_reference", "acquired_at", "marketplace", "product", "campaign", "channel", "source", "attribution_method", "confidence", "notes"]
        widgets = {"acquired_at": forms.DateTimeInput(format="%Y-%m-%dT%H:%M", attrs={"type": "datetime-local"}), "notes": forms.Textarea(attrs={"rows": 3})}
        labels = {"external_reference": "Referência externa / pseudonimizada", "acquired_at": "Data da aquisição", "attribution_method": "Método de atribuição", "confidence": "Confiança (%)"}

    def __init__(self, *args, user=None, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)
        if user:
            self.fields["marketplace"].queryset = self.fields["marketplace"].queryset.filter(user=user)
            self.fields["product"].queryset = self.fields["product"].queryset.filter(user=user)
            self.fields["campaign"].queryset = self.fields["campaign"].queryset.filter(user=user)
            self.fields["channel"].queryset = self.fields["channel"].queryset.filter(user=user)

    def clean(self):
        cleaned = super().clean()
        reference = cleaned.get("external_reference", "").strip()
        if self.user and reference:
            duplicates = Acquisition.objects.filter(user=self.user, external_reference=reference)
            if self.instance.pk:
                duplicates = duplicates.exclude(pk=self.instance.pk)
            if duplicates.exists():
                self.add_error("external_reference", "Essa referência já está cadastrada na sua conta.")
        return cleaned


class CommissionForm(StyledModelForm):
    class Meta:
        model = Commission
        fields = ["external_id", "source", "acquisition", "marketplace", "product", "campaign", "channel", "amount", "sale_date", "approved_at", "status", "attribution_evidence", "notes"]
        widgets = {"sale_date": forms.DateTimeInput(format="%Y-%m-%dT%H:%M", attrs={"type": "datetime-local"}), "approved_at": forms.DateTimeInput(format="%Y-%m-%dT%H:%M", attrs={"type": "datetime-local"}), "notes": forms.Textarea(attrs={"rows": 3})}
        labels = {"external_id": "ID externo", "amount": "Valor da comissão (R$)", "sale_date": "Data da venda", "approved_at": "Data da aprovação", "attribution_evidence": "Evidência da atribuição"}

    def __init__(self, *args, user=None, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)
        if user:
            for field in ("acquisition", "marketplace", "product", "campaign", "channel"):
                self.fields[field].queryset = self.fields[field].queryset.filter(user=user)
        self.fields["acquisition"].required = False
        self.fields["acquisition"].help_text = "Deixe vazio quando não houver evidência suficiente para atribuir a comissão."

    def clean(self):
        cleaned = super().clean()
        acquisition = cleaned.get("acquisition")
        external_id = (cleaned.get("external_id") or "").strip()
        source = cleaned.get("source") or "manual"
        if self.user and external_id:
            duplicates = Commission.objects.filter(user=self.user, source=source, external_id=external_id)
            if self.instance.pk:
                duplicates = duplicates.exclude(pk=self.instance.pk)
            if duplicates.exists():
                self.add_error("external_id", "Esse ID externo já existe para esta origem na sua conta.")
        if acquisition and cleaned.get("attribution_evidence") == "":
            self.add_error("attribution_evidence", "Descreva a evidência que justifica a atribuição.")
        if cleaned.get("status") == "approved" and not cleaned.get("approved_at"):
            cleaned["approved_at"] = cleaned.get("sale_date")
        return cleaned


class ProductForm(StyledModelForm):
    class Meta:
        model = Product
        fields = ["name", "marketplace", "external_id", "category", "active"]
    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        if user: self.fields["marketplace"].queryset = self.fields["marketplace"].queryset.filter(user=user)


class CampaignForm(StyledModelForm):
    class Meta:
        model = Campaign
        fields = ["name", "marketplace", "channel", "start_date", "end_date", "status"]
        widgets = {"start_date": forms.DateInput(attrs={"type": "date"}), "end_date": forms.DateInput(attrs={"type": "date"})}
    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        if user:
            self.fields["marketplace"].queryset = self.fields["marketplace"].queryset.filter(user=user)
            self.fields["channel"].queryset = self.fields["channel"].queryset.filter(user=user)


class ChannelForm(StyledModelForm):
    def __init__(self, *args, user=None, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)

    class Meta:
        model = Channel
        fields = ["name", "code", "active"]

    def clean_code(self):
        return self.cleaned_data["code"].strip().lower()

    def clean(self):
        cleaned = super().clean()
        code = cleaned.get("code")
        if self.user and code:
            duplicates = Channel.objects.filter(user=self.user, code=code)
            if self.instance.pk:
                duplicates = duplicates.exclude(pk=self.instance.pk)
            if duplicates.exists():
                self.add_error("code", "Este código já está em uso na sua conta.")
        return cleaned


class MarketplaceForm(StyledModelForm):
    def __init__(self, *args, user=None, **kwargs):
        self.user = user
        super().__init__(*args, **kwargs)

    class Meta:
        model = Marketplace
        fields = ["name", "code", "active"]

    def clean_code(self):
        return self.cleaned_data["code"].strip().lower()

    def clean(self):
        cleaned = super().clean()
        code = cleaned.get("code")
        if self.user and code:
            duplicates = Marketplace.objects.filter(user=self.user, code=code)
            if self.instance.pk:
                duplicates = duplicates.exclude(pk=self.instance.pk)
            if duplicates.exists():
                self.add_error("code", "Este código já está em uso na sua conta.")
        return cleaned


class AutomationSettingsForm(StyledModelForm):
    class Meta:
        model = AutomationSettings
        fields = ["enabled", "interval_seconds", "pending_alert_days"]
        labels = {"enabled": "Ativar manutenção automática", "interval_seconds": "Intervalo entre verificações (segundos)", "pending_alert_days": "Alertar comissão pendente após (dias)"}


class ImportFileForm(forms.Form):
    file = forms.FileField(label="Arquivo CSV ou XLSX", help_text="Até 10 MB. A primeira linha deve conter os cabeçalhos das colunas.")
    def clean_file(self):
        f = self.cleaned_data["file"]
        if f.size > 10 * 1024 * 1024:
            raise ValidationError("O arquivo ultrapassa o limite de 10 MB.")
        if not f.name.lower().endswith((".csv", ".xlsx")):
            raise ValidationError("Formato não suportado. Envie CSV ou XLSX.")
        return f
