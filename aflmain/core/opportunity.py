"""Heurística experimental do Termômetro de Oportunidade.

A UI consome somente o resultado deste módulo. No futuro, a implementação pode
ser trocada por métricas de clique, conversão, vendas, marketplace, categoria,
dia da semana e histórico sem reescrever o template da Dashboard.
"""
from dataclasses import dataclass
from datetime import datetime, timezone as datetime_timezone
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from django.utils import timezone


@dataclass(frozen=True)
class OpportunityReading:
    score: int
    label: str
    timezone_name: str
    local_time: datetime
    reason: str


# Faixas iniciais/simbólicas. score = 0 (frio) ... 100 (quente).
_TIME_BANDS = (
    (0, 6, 18, "Baixa atividade esperada"),
    (6, 8, 42, "Movimento começando"),
    (8, 11, 78, "Faixa favorável da manhã"),
    (11, 14, 88, "Faixa favorável do almoço"),
    (14, 16, 58, "Atividade moderada"),
    (16, 19, 76, "Faixa favorável do fim da tarde"),
    (19, 23, 94, "Faixa favorável da noite"),
    (23, 24, 46, "Atividade em redução"),
)


def _label(score):
    if score >= 85:
        return "Muito quente"
    if score >= 70:
        return "Quente"
    if score >= 45:
        return "Morno"
    if score >= 25:
        return "Fresco"
    return "Frio"


def calcular_oportunidade(timezone_name, now=None):
    tz_name = (timezone_name or "America/Sao_Paulo").strip()
    try:
        tz = ZoneInfo(tz_name)
    except (ZoneInfoNotFoundError, ValueError):
        tz_name = "America/Sao_Paulo"
        tz = ZoneInfo(tz_name)

    base = now or timezone.now()
    if timezone.is_naive(base):
        base = timezone.make_aware(base, datetime_timezone.utc)
    local = base.astimezone(tz)

    score, reason = 35, "Faixa intermediária"
    for start, end, band_score, band_reason in _TIME_BANDS:
        if start <= local.hour < end:
            score, reason = band_score, band_reason
            break

    return OpportunityReading(
        score=score,
        label=_label(score),
        timezone_name=tz_name,
        local_time=local,
        reason=reason,
    )
