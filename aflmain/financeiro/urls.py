from django.urls import path
from . import views

app_name = "roi"

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("automacao/", views.automation_dashboard, name="automation"),
    path("automacao/despesas/nova/", views.recurring_expense_create, name="recurring_expense_create"),
    path("automacao/despesas/<int:pk>/alternar/", views.recurring_expense_toggle, name="recurring_expense_toggle"),
    path("investimentos/", views.expense_list, name="expenses"),
    path("investimentos/novo/", views.expense_create, name="expense_create"),
    path("investimentos/excluir/<int:pk>/", views.expense_delete, name="expense_delete"),
    path("investimentos/importar/", views.import_expenses, name="import_expenses"),
    path("investimentos/exportar/", views.export_expenses, name="export_expenses"),
    path("comissoes/", views.commission_list, name="commissions"),
    path("comissoes/nova/", views.commission_create, name="commission_create"),
    path("comissoes/exportar/", views.export_commissions, name="export_commissions"),
    path("produtos/", views.product_list, name="products"),
    path("produtos/novo/", views.product_create, name="product_create"),
    path("campanhas/", views.campaign_list, name="campaigns"),
    path("campanhas/nova/", views.campaign_create, name="campaign_create"),
]
