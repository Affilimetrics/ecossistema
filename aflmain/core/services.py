"""Serviços de ofertas. A copy é gerada automaticamente pelo motor de marketing."""
from django.utils import timezone
from .models import ConfiguracaoCanal, Mensagem, Oferta
from .marketing import gerar_mensagem, desconto
from .publicacao import enviar_telegram as _enviar_telegram, enviar_whatsapp_api as _enviar_whatsapp


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
    if canal == "TELEGRAM":
        result = enviar_telegram(oferta)
    elif canal == "WHATSAPP":
        result = enviar_whatsapp(oferta)
    else:
        raise RuntimeError(f"Canal não suportado: {canal}")
    Mensagem.objects.create(owner=oferta.owner, produto=oferta.produto, canal=canal, status="ENVIADO", conteudo=oferta.mensagem, data_envio=timezone.now())
    oferta.status = "ENVIADA"
    oferta.save(update_fields=["status", "atualizada_em"])
    return result
