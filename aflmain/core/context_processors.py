def alertas_usuario(request):
    if not getattr(request, "user", None) or not request.user.is_authenticated:
        return {"alertas_sistema": []}
    from .models import AlertaSistema
    return {"alertas_sistema": AlertaSistema.objects.filter(owner=request.user, resolvido=False)[:5]}
