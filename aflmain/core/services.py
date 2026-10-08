"""Serviços de ofertas. A copy é gerada automaticamente pelo motor de marketing."""
from django.utils import timezone
from .models import ConfiguracaoCanal, Mensagem, Oferta, Produto
from .marketing import gerar_mensagem, desconto
from .publicacao import enviar_telegram as _enviar_telegram, enviar_whatsapp_api as _enviar_whatsapp
from .alerts import registrar_alerta_canal, resolver_alerta_canal


def obter_produto_chefe_usuario(user):
    """Retorna o melhor produto acionável do usuário para o destaque da Home.

    O filtro é sempre restrito ao usuário autenticado e exige um link de
    afiliado válido armazenado. Em caso de empate, o produto mais recentemente
    atualizado vence.
    """
    if not getattr(user, "is_authenticated", False):
        return None

    produtos = (
        Produto.objects
        .filter(owner=user, afiliado__link_afiliado__isnull=False)
        .exclude(afiliado__link_afiliado="")
        .select_related("afiliado")
    )

    melhor = None
    melhor_score = None
    for produto in produtos.iterator():
        score = produto.score_chefe()
        if melhor is None or score > melhor_score:
            melhor = produto
            melhor_score = score

    return melhor


def formatar_oferta(produto, link=None, turno=None, campanha=None):
    link = link or getattr(getattr(produto, "afiliado", None), "link_afiliado", None)
    if not link:
        raise ValueError("Produto não possui link de afiliado válido para divulgação.")
    return gerar_mensagem(produto, turno=turno, campanha=campanha)


def criar_oferta(produto, turno=None, campanha=None):
    if not getattr(getattr(produto, "afiliado", None), "link_afiliado", None):
        raise ValueError("Produto sem link de afiliado validado.")
    oferta = Oferta.objects.filter(produto=produto, status__in=["RASCUNHO", "PRONTA"]).first()
    if oferta is None:
        oferta = Oferta(produto=produto, owner=produto.owner)
    oferta.titulo = produto.nome or "Oferta"
    oferta.mensagem = formatar_oferta(produto, turno=turno, campanha=campanha)
    oferta.desconto_percentual = desconto(produto.preco_anterior, produto.preco_atual) or None
    oferta.status = "PRONTA"
    oferta.save()
    return oferta


def enviar_telegram(oferta):
    return _enviar_telegram(oferta)


def enviar_whatsapp(oferta):
    return _enviar_whatsapp(oferta)


def enviar_oferta(oferta, canal):
    canal = canal.upper()
    try:
        if canal == "TELEGRAM":
            result = enviar_telegram(oferta)
        elif canal == "WHATSAPP":
            result = enviar_whatsapp(oferta)
        else:
            raise RuntimeError(f"Canal não suportado: {canal}")
        Mensagem.objects.create(owner=oferta.owner, produto=oferta.produto, canal=canal, status="ENVIADO", conteudo=oferta.mensagem, data_envio=timezone.now())
        resolver_alerta_canal(oferta.owner, canal)
        oferta.status = "ENVIADA"
        oferta.save(update_fields=["status", "atualizada_em"])
        return result
    except Exception as exc:
        Mensagem.objects.create(owner=oferta.owner, produto=oferta.produto, canal=canal, status="ERRO", conteudo=oferta.mensagem, erro=str(exc))
        registrar_alerta_canal(oferta.owner, canal, str(exc))
        raise
