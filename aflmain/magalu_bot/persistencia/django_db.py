from decimal import Decimal, InvalidOperation
from datetime import timedelta
from django.utils import timezone
from core.models import Produto, Afiliado, Execucao, LogExecucao, HistoricoPreco, ProgressoColeta


def decimal_or_none(value):
    if value in (None, ""):
        return None
    if isinstance(value, (int, float, Decimal)):
        return Decimal(str(value))
    text = str(value).replace("R$", "").replace(" ", "").replace(".", "").replace(",", ".")
    try:
        return Decimal(text)
    except (InvalidOperation, ValueError):
        return None


def registrar_log(execucao_id, mensagem, nivel="INFO"):
    if not execucao_id:
        return
    try:
        LogExecucao.objects.create(execucao_id=execucao_id, nivel=nivel, mensagem=str(mensagem)[:2000])
    except Exception:
        # Logging jamais pode derrubar o coletor.
        pass


def atualizar_execucao(execucao_id, **kwargs):
    if not execucao_id:
        return
    campos = {}
    for key in ("estado", "produtos_processados", "produtos_total", "links_obtidos", "erro", "fim"):
        if key in kwargs:
            campos[key] = kwargs[key]
    if campos:
        Execucao.objects.filter(pk=execucao_id).update(**campos)


def salvar_produto_resultado(execucao_id, categoria, url_produto, dados, numero=None, owner_id=None):
    if not url_produto:
        return None
    nome = dados.get("nome") or url_produto.rstrip("/").rsplit("/", 1)[-1]
    preco_anterior = decimal_or_none(dados.get("preco_anterior"))
    preco_atual = decimal_or_none(dados.get("preco_atual"))
    link = dados.get("link_afiliado")
    status = dados.get("status") or ("OK" if link else "REVISAR")

    produto, _ = Produto.objects.update_or_create(
        owner_id=owner_id,
        url_produto=url_produto,
        defaults={
            "marketplace": dados.get("marketplace") or "MAGALU",
            "categoria": categoria or "",
            "nome": nome,
            "preco_anterior": preco_anterior,
            "preco_atual": preco_atual,
            "imagem_url": dados.get("imagem_url") or "",
        },
    )
    Afiliado.objects.update_or_create(
        produto=produto,
        defaults={"link_afiliado": link, "status": status},
    )
    if preco_atual is not None:
        HistoricoPreco.objects.create(produto=produto, preco=preco_atual)
    if execucao_id:
        Execucao.objects.filter(pk=execucao_id).update(
            produtos_processados=numero or 0,
        )
    return produto


def finalizar_execucao(execucao_id, estado, erro=""):
    if not execucao_id:
        return
    Execucao.objects.filter(pk=execucao_id).update(
        estado=estado, erro=erro or "", fim=timezone.now()
    )


def obter_progresso_coleta(owner_id, tipo_alvo, alvo, marketplace="MAGALU", recente_horas=12):
    """Retorna cursor recente do alvo; progresso antigo reinicia na página 1."""
    if not owner_id or not alvo:
        return {"pagina": 1, "familias_recentes": [], "retomado": False}

    progresso = ProgressoColeta.objects.filter(
        owner_id=owner_id,
        marketplace=marketplace,
        tipo_alvo=tipo_alvo,
        alvo=alvo,
    ).first()

    if not progresso:
        return {"pagina": 1, "familias_recentes": [], "retomado": False}

    limite = timezone.now() - timedelta(hours=recente_horas)
    if progresso.atualizado_em < limite:
        return {"pagina": 1, "familias_recentes": [], "retomado": False}

    return {
        "pagina": max(1, int(progresso.proxima_pagina or 1)),
        "familias_recentes": list(progresso.familias_recentes or []),
        "retomado": True,
    }


def salvar_progresso_coleta(owner_id, tipo_alvo, alvo, proxima_pagina, familias_recentes=None, marketplace="MAGALU"):
    if not owner_id or not alvo:
        return
    defaults = {"proxima_pagina": max(1, int(proxima_pagina or 1))}
    if familias_recentes is not None:
        defaults["familias_recentes"] = list(familias_recentes)[-8:]
    ProgressoColeta.objects.update_or_create(
        owner_id=owner_id,
        marketplace=marketplace,
        tipo_alvo=tipo_alvo,
        alvo=alvo,
        defaults=defaults,
    )
