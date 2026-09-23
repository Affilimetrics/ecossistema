from decimal import Decimal, InvalidOperation
from django.utils import timezone
from core.models import Produto, Afiliado, Execucao, LogExecucao, HistoricoPreco


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
