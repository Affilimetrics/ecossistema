from django import forms
from .models import Expense, Commission, Product, Campaign

class UserScopedForm(forms.ModelForm):
    def __init__(self, *args, user=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.user = user
        if user:
            for field in self.fields.values():
                qs = getattr(field, "queryset", None)
                if qs is not None and hasattr(qs.model, "user"):
                    field.queryset = qs.filter(user=user)

class ExpenseForm(UserScopedForm):
    class Meta:
        model = Expense
        exclude = ("user", "created_at", "updated_at")

class CommissionForm(UserScopedForm):
    class Meta:
        model = Commission
        exclude = ("user", "created_at", "updated_at", "approved_at")

class ProductForm(UserScopedForm):
    class Meta:
        model = Product
        exclude = ("user", "created_at")

class CampaignForm(UserScopedForm):
    class Meta:
        model = Campaign
        exclude = ("user", "created_at")
