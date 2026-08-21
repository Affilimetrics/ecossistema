from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('login/', views.login, name='login'),
    path("bot/", views.iniciar_bot_view, name="iniciar_bot"),
]