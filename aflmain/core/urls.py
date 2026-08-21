from django.urls import path

from . import views


urlpatterns = [

    # Página principal
    path(
        "",
        views.index,
        name="index"
    ),

    # Login
    path(
        "login/",
        views.login,
        name="login"
    ),

    # =====================================================
    # MAGALU
    # =====================================================

    # Interface do coletor
    path(
        "magalu/",
        views.magalu_bot,
        name="magalu_bot"
    ),

    # API para iniciar o bot
    path(
        "magalu/iniciar/",
        views.iniciar_bot_view,
        name="iniciar_bot"
    ),
]