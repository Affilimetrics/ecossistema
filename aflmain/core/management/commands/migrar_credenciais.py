from django.core.management.base import BaseCommand
from core.models import ConfiguracaoCanal
class Command(BaseCommand):
    help="Regrava credenciais legadas com CREDENTIAL_ENCRYPTION_KEY."
    def handle(self,*args,**opts):
        n=0
        for c in ConfiguracaoCanal.objects.all().iterator():
            if c.token:
                c.token=c.token; c.save(update_fields=["token"]); n+=1
        self.stdout.write(self.style.SUCCESS(f"Credenciais migradas: {n}"))
