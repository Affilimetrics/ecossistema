from django.urls import reverse


def global_context(request):
    return {"app_name": "LTV Manager", "current_path": request.path}
