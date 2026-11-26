# Resolve a colisão de reverse accessor entre cpa.Channel e financeiro.Channel.
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("cpa", "0002_seed_existing_users"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AlterField(
            model_name="channel",
            name="user",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="cpa_channels",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
