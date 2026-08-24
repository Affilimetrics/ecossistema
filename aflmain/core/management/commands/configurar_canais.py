from decouple import config
from django.core.management.base import BaseCommand
from core.models import ConfiguracaoCanal


class Command(BaseCommand):
    help = "Cria/atualiza configurações de Telegram e WhatsApp a partir do ambiente."

    def handle(self, *args, **options):
        telegram_token = config("TELEGRAM_BOT_TOKEN", default="")
        telegram_destino = config("TELEGRAM_CHAT_ID", default="")
        ConfiguracaoCanal.objects.update_or_create(
            canal="TELEGRAM",
            defaults={"token": telegram_token, "destino": telegram_destino, "ativo": bool(telegram_token and telegram_destino)},
        )
        whatsapp_token = config("WHATSAPP_API_TOKEN", default="")
        whatsapp_endpoint = config("WHATSAPP_API_ENDPOINT", default="")
        whatsapp_destino = config("WHATSAPP_DESTINATION", default="")
        ConfiguracaoCanal.objects.update_or_create(
            canal="WHATSAPP",
            defaults={"token": whatsapp_token, "endpoint": whatsapp_endpoint, "destino": whatsapp_destino, "ativo": bool(whatsapp_token and whatsapp_endpoint and whatsapp_destino)},
        )
        self.stdout.write(self.style.SUCCESS("Configurações de canais sincronizadas."))
