from django.conf import settings
from django.db import migrations


DEFAULT_PLATFORMS = [
    ("META", "Meta Ads"),
    ("GOOGLE", "Google Ads"),
    ("TIKTOK", "TikTok Ads"),
    ("OTHER", "Outros"),
]
DEFAULT_CHANNELS = [
    ("INSTAGRAM", "Instagram"),
    ("FACEBOOK", "Facebook"),
    ("GOOGLE", "Google"),
    ("TIKTOK", "TikTok"),
    ("SITE", "Site/Blog"),
    ("OTHER", "Outros"),
]


def _bulk_seed(model, user_ids, defaults, db):
    """Insere dimensões padrão em blocos e ignora usuários já provisionados."""
    pending = []
    manager = model.objects.using(db)
    for user_id in user_ids:
        pending.extend(
            model(user_id=user_id, code=code, name=name)
            for code, name in defaults
        )
        # Mantém baixo o número de parâmetros por INSERT também no SQLite.
        if len(pending) >= 300:
            manager.bulk_create(pending, ignore_conflicts=True, batch_size=300)
            pending = []
    if pending:
        manager.bulk_create(pending, ignore_conflicts=True, batch_size=300)


def seed_existing_users(apps, schema_editor):
    User = apps.get_model(*settings.AUTH_USER_MODEL.split("."))
    Platform = apps.get_model("cpa", "Platform")
    Channel = apps.get_model("cpa", "Channel")
    db = schema_editor.connection.alias

    _bulk_seed(
        Platform,
        User.objects.using(db).values_list("pk", flat=True).iterator(chunk_size=500),
        DEFAULT_PLATFORMS,
        db,
    )
    _bulk_seed(
        Channel,
        User.objects.using(db).values_list("pk", flat=True).iterator(chunk_size=500),
        DEFAULT_CHANNELS,
        db,
    )


class Migration(migrations.Migration):
    dependencies = [
        ("cpa", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [migrations.RunPython(seed_existing_users, migrations.RunPython.noop)]
