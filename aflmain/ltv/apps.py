from django.apps import AppConfig

class LtvConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "ltv"
    verbose_name = "LTV Manager"

    def ready(self):
        from . import signals  # noqa: F401
