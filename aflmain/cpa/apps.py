from django.apps import AppConfig
class CpaConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "cpa"
    verbose_name = "CPA Manager"
    def ready(self):
        import cpa.signals
