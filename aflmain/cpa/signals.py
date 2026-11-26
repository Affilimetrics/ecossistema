from django.conf import settings
from django.db import transaction
from django.db.models.signals import post_save
from django.dispatch import receiver

from .defaults import DEFAULT_PLATFORMS, DEFAULT_CHANNELS
from .models import Platform, Channel


@receiver(post_save, sender=settings.AUTH_USER_MODEL)
def create_default_dimensions(sender, instance, created, **kwargs):
    if not created:
        return

    db = kwargs.get("using") or instance._state.db or "default"
    with transaction.atomic(using=db):
        Platform.objects.using(db).bulk_create(
            [Platform(user=instance, code=code, name=name) for code, name in DEFAULT_PLATFORMS],
            ignore_conflicts=True,
        )
        Channel.objects.using(db).bulk_create(
            [Channel(user=instance, code=code, name=name) for code, name in DEFAULT_CHANNELS],
            ignore_conflicts=True,
        )
