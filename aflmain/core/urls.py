from django.urls import path

from . import views
from . import desktop_api


urlpatterns = [
    # API autenticada para o aplicativo desktop Skallora.
    path("api/desktop/login/", desktop_api.desktop_login, name="desktop_api_login"),
    path("api/desktop/me/", desktop_api.desktop_me, name="desktop_api_me"),
    path("api/desktop/dashboard/", desktop_api.desktop_dashboard, name="desktop_api_dashboard"),
    path("api/desktop/products/", desktop_api.desktop_products, name="desktop_api_products"),
    path("api/desktop/executions/", desktop_api.desktop_executions, name="desktop_api_executions"),
    path("api/desktop/executions/create/", desktop_api.desktop_create_execution, name="desktop_api_create_execution"),
    path("api/desktop/executions/<int:execution_id>/finish/", desktop_api.desktop_execution_finish, name="desktop_api_finish_execution"),
    path("api/desktop/logs/", desktop_api.desktop_logs, name="desktop_api_logs"),
    path("api/desktop/products/ingest/", desktop_api.desktop_ingest_product, name="desktop_api_ingest_product"),
    path("api/desktop/magalu/status/", desktop_api.desktop_magalu_status, name="desktop_api_magalu_status"),
    path("api/desktop/magalu/start/", desktop_api.desktop_magalu_start, name="desktop_api_magalu_start"),
    path("api/desktop/magalu/pause/", desktop_api.desktop_magalu_pause, name="desktop_api_magalu_pause"),
    path("api/desktop/magalu/resume/", desktop_api.desktop_magalu_resume, name="desktop_api_magalu_resume"),
    path("api/desktop/magalu/stop/", desktop_api.desktop_magalu_stop, name="desktop_api_magalu_stop"),
    path("api/desktop/magalu/logs/", desktop_api.desktop_magalu_logs, name="desktop_api_magalu_logs"),

    # =====================================================
    # PÁGINAS
    # =====================================================

    path(
        "",
        views.index,
        name="index"
    ),

    path(
        "login/",
        views.login,
        name="login"
    ),

    path("cadastro/", views.cadastro, name="cadastro"),
    path("home/", views.home, name="home"),
    path("coleta/", views.coleta_geral, name="coleta_geral"),
    path("coleta/categoria-personalizada/", views.criar_categoria_personalizada_view, name="criar_categoria_personalizada"),
    path("logout/", views.logout_view, name="logout"),

    path(
        "magalu/",
        views.magalu_bot,
        name="magalu_bot"
    ),

    # =====================================================
    # BOT MAGALU
    # =====================================================

    path(
        "magalu/iniciar/",
        views.iniciar_bot_view,
        name="iniciar_bot"
    ),

    path(
        "magalu/pausar/",
        views.pausar_bot_view,
        name="pausar_bot"
    ),

    path(
        "magalu/retomar/",
        views.retomar_bot_view,
        name="retomar_bot"
    ),

    path(
        "magalu/parar/",
        views.parar_bot_view,
        name="parar_bot"
    ),

    path("magalu/status/", views.status_bot_view, name="status_bot"),
    path("dashboard/coleta/controlar/", views.controlar_coleta_dashboard_view, name="controlar_coleta_dashboard"),
    path("magalu/logs/", views.logs_bot_view, name="logs_bot"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("ofertas/", views.ofertas_view, name="ofertas"),
    path("ofertas/templates/", views.templates_oferta_view, name="templates_oferta"),
    path("produtos-quentes/", views.produtos_quentes_view, name="produtos_quentes"),
    path("configuracoes/", views.configuracoes_view, name="configuracoes"),
    path("alertas/<int:alerta_id>/resolver/", views.resolver_alerta_view, name="resolver_alerta"),
    path("ofertas/<int:oferta_id>/enviar/", views.enviar_oferta_view, name="enviar_oferta"),

]