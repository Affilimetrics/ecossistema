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
    categoria: str | None = None
    melhor_horario: str = ""


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

# Heurística inicial por categoria nativa. Ela não finge ter dados de vendas
# que o banco ainda não possui: representa os horários mais favoráveis para
# cada nicho e pode ser substituída futuramente por histórico real.
_CATEGORY_SCHEDULES = {
    "cozinha": ((7, 9), (11, 13), (18, 21)),
    "quarto": ((9, 11), (19, 23)),
    "sala": ((12, 14), (19, 23)),
    "banheiro": ((7, 9), (18, 21)),
    "acessórios": ((8, 10), (12, 14), (19, 22)),
}


def _melhor_janela(categoria):
    janelas = _CATEGORY_SCHEDULES.get((categoria or "").strip().casefold())
    if not janelas:
        return ""
    return " · ".join(f"{inicio:02d}h–{fim:02d}h" for inicio, fim in janelas)


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


def calcular_oportunidade(timezone_name, categoria=None, now=None):
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

    categoria_normalizada = (categoria or "").strip().casefold()
    score, reason = 35, "Faixa intermediária"

    if categoria_normalizada in _CATEGORY_SCHEDULES:
        janelas = _CATEGORY_SCHEDULES[categoria_normalizada]
        if any(inicio <= local.hour < fim for inicio, fim in janelas):
            score, reason = 96, f"Horário favorável para {categoria}"
        else:
            # Mantém uma leitura gradual fora da janela principal, em vez de
            # zerar o termômetro. O objetivo é indicar interesse, não bloquear coleta.
            distancia = min(
                min(abs(local.hour - inicio), abs(local.hour - fim))
                for inicio, fim in janelas
            )
            score = max(30, 78 - (distancia * 9))
            reason = f"Fora da janela principal de {categoria}"
    else:
        for start, end, band_score, band_reason in _TIME_BANDS:
            if start <= local.hour < end:
                score, reason = band_score, band_reason
                break

    return OpportunityReading(
        score=int(score),
        label=_label(int(score)),
        timezone_name=tz_name,
        local_time=local,
        reason=reason,
        categoria=categoria or None,
        melhor_horario=_melhor_janela(categoria),
    )
