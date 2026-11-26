from django.urls import path
from . import views

app_name = "ads_manager"

urlpatterns = [
    path("", views.dashboard, name="dashboard"),
    path("auth/meta/connect/", views.connect_meta, name="connect_meta"),
    path("auth/meta/callback/", views.meta_callback, name="meta_callback"),
    path("ativos/", views.assets, name="assets"),
    path("contas/selecionar/", views.select_account, name="select_account"),
    path("campanhas/", views.campaigns, name="campaigns"),
    path("metricas/", views.insights, name="insights"),
    path("auth/meta/desconectar/", views.disconnect_meta, name="disconnect_meta"),
]
