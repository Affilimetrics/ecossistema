def alertas_usuario(request):
    if not getattr(request, "user", None) or not request.user.is_authenticated:
        return {"alertas_sistema": []}
    from .alerts import sincronizar_alertas_canais
    from .models import AlertaSistema
    sincronizar_alertas_canais(request.user)
    return {"alertas_sistema": AlertaSistema.objects.filter(owner=request.user, resolvido=False)[:5]}


def ferramentas_desenvolvimento(request):
    """Exibe links de ferramentas locais somente a usuários staff em DEBUG."""
    from django.conf import settings

    user = getattr(request, "user", None)
    return {
        "ferramentas_desenvolvimento_disponiveis": bool(
            settings.DEBUG and user and user.is_authenticated and user.is_staff
        )
    }
