from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import AutomationSettings, Marketplace, Channel

DEFAULT_MARKETPLACES = [("Magalu", "magalu"), ("Mercado Livre", "mercado-livre"), ("Amazon", "amazon"), ("Shopee", "shopee"), ("Outros", "outros")]
DEFAULT_CHANNELS = [("Telegram", "telegram"), ("WhatsApp", "whatsapp"), ("Instagram", "instagram"), ("TikTok", "tiktok"), ("YouTube", "youtube"), ("Facebook", "facebook"), ("Site / Blog", "site-blog"), ("Outros", "outros")]

@receiver(post_save, sender=get_user_model())
def create_user_defaults(sender, instance, created, **kwargs):
    if not created:
        return
    AutomationSettings.objects.get_or_create(user=instance)
    for name, code in DEFAULT_MARKETPLACES:
        Marketplace.objects.get_or_create(user=instance, code=code, defaults={"name": name})
    for name, code in DEFAULT_CHANNELS:
        Channel.objects.get_or_create(user=instance, code=code, defaults={"name": name})
