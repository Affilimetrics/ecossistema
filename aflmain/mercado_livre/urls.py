from django.urls import path

from . import views

app_name = "mercado_livre"

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("buscar/", views.search, name="search"),
    path("configuracoes/", views.save_settings, name="save_settings"),
    path("importar-mapeamento/", views.import_affiliate_mapping, name="import_affiliate_mapping"),
    path("produto/<int:item_id>/afiliado/", views.update_affiliate_link, name="update_affiliate_link"),
    path("exportar/csv/", views.export_csv, name="export_csv"),
    path("exportar/json/", views.export_json, name="export_json"),
]
