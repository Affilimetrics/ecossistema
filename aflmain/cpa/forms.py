from django import forms
from .models import Campaign, PerformanceRecord, Platform, Channel

class StyledFormMixin:
    def apply_classes(self):
        for field in self.fields.values():
            cls = field.widget.attrs.get("class", "")
            field.widget.attrs["class"] = (cls + " form-control").strip()

class CampaignForm(StyledFormMixin, forms.ModelForm):
    class Meta:
        model = Campaign
        fields = ["name", "external_id", "integration_key", "platform", "channel", "objective", "conversion_label", "is_active", "notes"]
        widgets = {"notes": forms.Textarea(attrs={"rows": 3})}
    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        if user:
            self.instance.user = user
        self.fields["platform"].queryset = Platform.objects.filter(user=user) if user else Platform.objects.none()
        self.fields["channel"].queryset = Channel.objects.filter(user=user) if user else Channel.objects.none()
        self.apply_classes()
        self.fields["name"].widget.attrs["placeholder"] = "Ex.: Campanha Black Friday"
        self.fields["integration_key"].widget.attrs["placeholder"] = "ex.: black-friday-2026"

class PerformanceRecordForm(StyledFormMixin, forms.ModelForm):
    class Meta:
        model = PerformanceRecord
        fields = ["campaign", "date", "spend", "clicks", "conversions", "impressions", "external_id", "notes"]
        widgets = {"date": forms.DateInput(attrs={"type": "date"}), "spend": forms.NumberInput(attrs={"step": "0.01", "min": "0"}), "notes": forms.TextInput()}
    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        if user:
            self.instance.user = user
        self.fields["campaign"].queryset = Campaign.objects.filter(user=user) if user else Campaign.objects.none()
        self.apply_classes()

class ImportUploadForm(forms.Form):
    file = forms.FileField(label="Arquivo CSV ou XLSX")


class IntegrationTokenForm(forms.Form):
    name = forms.CharField(max_length=100, label="Nome da integração", help_text="Ex.: Projeto principal / Skallora")
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field in self.fields.values():
            field.widget.attrs["class"] = "form-control"
