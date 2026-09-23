import os
from .models import ConfiguracaoAutomacao


def _bool_env(nome, default=False):
    valor = os.getenv(nome)
    if valor is None:
        return default
    return valor.strip().lower() in {"1", "true", "yes", "on", "sim"}


def obter_config_automacao(owner=None, owner_id=None):
    if owner is None and owner_id is None:
        raise ValueError("Informe owner ou owner_id.")
    filtros = {"owner": owner} if owner is not None else {"owner_id": owner_id}
    canais = [c.strip().upper() for c in os.getenv("CANAIS_AUTOMATICOS", "TELEGRAM").split(",") if c.strip()]
    try:
        cache = max(1, int(os.getenv("CACHE_RETENCAO_HOURS", "120")))
    except ValueError:
        cache = 120
    obj, _ = ConfiguracaoAutomacao.objects.get_or_create(
        **filtros,
        defaults={
            "auto_publicar_ofertas": _bool_env("AUTO_PUBLICAR_OFERTAS", False),
            "canais_automaticos": canais,
            "cache_retencao_hours": cache,
            "campanha_sazonal": os.getenv("CAMPANHA_SAZONAL", "NENHUM") or "NENHUM",
            "turno_padrao": os.getenv("TURNO_PADRAO", ""),
        },
    )
    return obj
