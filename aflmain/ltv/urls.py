"""URLs do LTV Manager, montadas sob /ltv/ no ecossistema Skallora."""
app_name = "ltv"

from django.urls import path
from . import views

urlpatterns = [
    path("dashboard/", views.dashboard, name="dashboard"),
    path("aquisicoes/", views.acquisition_list, name="acquisition_list"),
    path("aquisicoes/nova/", views.acquisition_form, name="acquisition_create"),
    path("aquisicoes/<int:pk>/editar/", views.acquisition_form, name="acquisition_edit"),
    path("aquisicoes/<int:pk>/excluir/", views.acquisition_delete, name="acquisition_delete"),
    path("comissoes/", views.commission_list, name="commission_list"),
    path("comissoes/nova/", views.commission_form, name="commission_create"),
    path("comissoes/<int:pk>/editar/", views.commission_form, name="commission_edit"),
    path("comissoes/<int:pk>/excluir/", views.commission_delete, name="commission_delete"),
    path("marketplaces/", views.resource_list, {"kind": "marketplaces"}, name="marketplaces"),
    path("marketplaces/novo/", views.resource_form, {"kind": "marketplaces"}, name="marketplace_create"),
    path("marketplaces/<int:pk>/editar/", views.resource_form, {"kind": "marketplaces"}, name="marketplace_edit"),
    path("marketplaces/<int:pk>/excluir/", views.resource_delete, {"kind": "marketplaces"}, name="marketplace_delete"),
    path("produtos/", views.resource_list, {"kind": "products"}, name="products"),
    path("produtos/novo/", views.resource_form, {"kind": "products"}, name="product_create"),
    path("produtos/<int:pk>/editar/", views.resource_form, {"kind": "products"}, name="product_edit"),
    path("produtos/<int:pk>/excluir/", views.resource_delete, {"kind": "products"}, name="product_delete"),
    path("campanhas/", views.resource_list, {"kind": "campaigns"}, name="campaigns"),
    path("campanhas/nova/", views.resource_form, {"kind": "campaigns"}, name="campaign_create"),
    path("campanhas/<int:pk>/editar/", views.resource_form, {"kind": "campaigns"}, name="campaign_edit"),
    path("campanhas/<int:pk>/excluir/", views.resource_delete, {"kind": "campaigns"}, name="campaign_delete"),
    path("canais/", views.resource_list, {"kind": "channels"}, name="channels"),
    path("canais/novo/", views.resource_form, {"kind": "channels"}, name="channel_create"),
    path("canais/<int:pk>/editar/", views.resource_form, {"kind": "channels"}, name="channel_edit"),
    path("canais/<int:pk>/excluir/", views.resource_delete, {"kind": "channels"}, name="channel_delete"),
    path("analises/", views.analysis, name="analysis"),
    path("coortes/", views.cohorts_page, name="cohorts"),
    path("importacoes/", views.import_view, name="import"),
    path("automacoes/", views.automation, name="automation"),
    path("automacoes/executar/", views.run_automation_now, name="automation_run"),
    path("relatorios/", views.reports, name="reports"),
    path("relatorios/exportar-comissoes/", views.export_commissions, name="export_commissions"),
    path("api/graficos/", views.chart_data, name="chart_data"),
]
