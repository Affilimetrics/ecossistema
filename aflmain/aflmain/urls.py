from django.contrib import admin
from django.urls import path, include


urlpatterns = [

    path(
        "admin/",
        admin.site.urls
    ),

    path("trafego-pago/", include("ads_manager.urls")),
    path("ltv/", include("ltv.urls", namespace="ltv")),
    path("cpa/", include("cpa.urls", namespace="cpa")),
    path("roi/", include("financeiro.urls", namespace="roi")),
    path("mercado-livre/", include("mercado_livre.urls", namespace="mercado_livre")),
    path(
        "",
        include("core.urls")
    ),
]