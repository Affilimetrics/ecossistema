from django.urls import path

from . import views


urlpatterns = [

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
<<<<<<< HEAD
    path("coleta/", views.coleta_geral, name="coleta_geral"),
=======
>>>>>>> origin/main
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
    path("magalu/logs/", views.logs_bot_view, name="logs_bot"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("ofertas/", views.ofertas_view, name="ofertas"),
    path("ofertas/templates/", views.templates_oferta_view, name="templates_oferta"),
    path("produtos-quentes/", views.produtos_quentes_view, name="produtos_quentes"),
    path("configuracoes/", views.configuracoes_view, name="configuracoes"),
    path("alertas/<int:alerta_id>/resolver/", views.resolver_alerta_view, name="resolver_alerta"),
    path("ofertas/<int:oferta_id>/enviar/", views.enviar_oferta_view, name="enviar_oferta"),

]