from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.db import DEFAULT_DB_ALIAS, transaction

from cpa.defaults import DEFAULT_PLATFORMS, DEFAULT_CHANNELS
from cpa.models import Platform, Channel


class Command(BaseCommand):
    help = "Cria plataformas e canais padrão do CPA Manager para usuários existentes."

    def handle(self, *args, **options):
        user_model = get_user_model()
        db = DEFAULT_DB_ALIAS
        users_count = user_model.objects.using(db).count()

        with transaction.atomic(using=db):
            for model, defaults in (
                (Platform, DEFAULT_PLATFORMS),
                (Channel, DEFAULT_CHANNELS),
            ):
                pending = []
                user_ids = user_model.objects.using(db).values_list("pk", flat=True).iterator(chunk_size=500)
                manager = model.objects.using(db)
                for user_id in user_ids:
                    pending.extend(
                        model(user_id=user_id, code=code, name=name)
                        for code, name in defaults
                    )
                    if len(pending) >= 300:
                        manager.bulk_create(pending, ignore_conflicts=True, batch_size=300)
                        pending = []
                if pending:
                    manager.bulk_create(pending, ignore_conflicts=True, batch_size=300)

        self.stdout.write(self.style.SUCCESS(
            f"Dimensões padrão verificadas em lotes para {users_count} usuário(s)."
        ))
