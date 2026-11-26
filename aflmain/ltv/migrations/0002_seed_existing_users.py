from django.conf import settings
from django.db import migrations


DEFAULT_MARKETPLACES = [
    ("Magalu", "magalu"),
    ("Mercado Livre", "mercado-livre"),
    ("Amazon", "amazon"),
    ("Shopee", "shopee"),
    ("Outros", "outros"),
]
DEFAULT_CHANNELS = [
    ("Telegram", "telegram"),
    ("WhatsApp", "whatsapp"),
    ("Instagram", "instagram"),
    ("TikTok", "tiktok"),
    ("YouTube", "youtube"),
    ("Facebook", "facebook"),
    ("Site / Blog", "site-blog"),
    ("Outros", "outros"),
]


def seed_existing_users(apps, schema_editor):
    User = apps.get_model(*settings.AUTH_USER_MODEL.split("."))
    Marketplace = apps.get_model("ltv", "Marketplace")
    Channel = apps.get_model("ltv", "Channel")
    AutomationSettings = apps.get_model("ltv", "AutomationSettings")
    db = schema_editor.connection.alias

    for user_id in User.objects.using(db).values_list("pk", flat=True).iterator():
        AutomationSettings.objects.using(db).get_or_create(user_id=user_id)
        for name, code in DEFAULT_MARKETPLACES:
            Marketplace.objects.using(db).get_or_create(
                user_id=user_id, code=code, defaults={"name": name}
            )
        for name, code in DEFAULT_CHANNELS:
            Channel.objects.using(db).get_or_create(
                user_id=user_id, code=code, defaults={"name": name}
            )


def noop_reverse(apps, schema_editor):
    # Do not remove user-owned dimensions when rolling back this migration.
    pass


class Migration(migrations.Migration):
    dependencies = [
        ("ltv", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.RunPython(seed_existing_users, noop_reverse),
    ]
