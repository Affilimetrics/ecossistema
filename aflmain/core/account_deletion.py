from django.db import transaction

from .models import PerfilUsuario


def excluir_conta_e_dados_relacionados(user):
    """Exclui a conta e trata dependências PROTECT dos módulos CPA e ROI.

    Os registros transacionais que referenciam dimensões/produtos por
    on_delete=PROTECT são removidos primeiro. Em seguida, o delete do usuário
    aplica os CASCADE definidos nos demais modelos do ecossistema.
    """
    database = user._state.db or "default"
    try:
        profile = user.perfil_local
    except PerfilUsuario.DoesNotExist:
        profile = None
    profile_photo = profile.foto if profile and profile.foto else None
    photo_storage = profile_photo.storage if profile_photo else None
    photo_name = profile_photo.name if profile_photo else ""

    with transaction.atomic(using=database):
        from cpa.models import PerformanceRecord
        from financeiro.models import Expense, Commission, RecurringExpense, Product

        PerformanceRecord.objects.using(database).filter(user_id=user.pk).delete()

        Expense.objects.using(database).filter(user_id=user.pk).delete()
        Commission.objects.using(database).filter(user_id=user.pk).delete()
        RecurringExpense.objects.using(database).filter(user_id=user.pk).delete()
        # Product referencia Marketplace com PROTECT; após remover despesas e
        # comissões dependentes, os produtos devem sair antes do usuário.
        Product.objects.using(database).filter(user_id=user.pk).delete()

        user.delete(using=database)
        if photo_storage and photo_name:
            transaction.on_commit(
                lambda storage=photo_storage, name=photo_name: storage.delete(name),
                using=database,
            )
