import requests
from django.utils import timezone
from .models import ConfiguracaoCanal, Mensagem, Oferta


def formatar_oferta(produto, link=None):
    link = link or getattr(getattr(produto, "afiliado", None), "link_afiliado", None) or produto.url_produto
    atual = f"R$ {produto.preco_atual:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") if produto.preco_atual is not None else "consulte"
    anterior = f"R$ {produto.preco_anterior:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".") if produto.preco_anterior is not None else None
    linhas = ["🔥 OFERTA!", "", f"🛍️ {produto.nome or 'Produto'}"]
    if anterior:
        linhas += [f"De: {anterior}", f"Por: {atual}"]
    else:
        linhas += [f"Por: {atual}"]
    linhas += ["", f"🔗 Comprar: {link}"]
    return "\n".join(linhas)


def criar_oferta(produto):
    mensagem = formatar_oferta(produto)
    desconto = None
    if produto.preco_anterior and produto.preco_atual and produto.preco_anterior > 0:
        desconto = ((produto.preco_anterior - produto.preco_atual) / produto.preco_anterior) * 100
    oferta = Oferta.objects.filter(produto=produto, status__in=["RASCUNHO", "PRONTA"]).first()
    if oferta is None:
        oferta = Oferta(produto=produto, owner=produto.owner)
    oferta.titulo = produto.nome or "Oferta"
    oferta.mensagem = mensagem
    oferta.desconto_percentual = desconto
    oferta.status = "PRONTA"
    oferta.save()
    return oferta


def enviar_telegram(oferta):
    cfg = (ConfiguracaoCanal.objects.filter(owner=oferta.owner, canal="TELEGRAM", ativo=True).first() or
           ConfiguracaoCanal.objects.filter(owner__isnull=True, canal="TELEGRAM", ativo=True).first())
    if not cfg or not cfg.token or not cfg.destino:
        raise RuntimeError("Telegram não configurado.")
    url = f"https://api.telegram.org/bot{cfg.token}/sendMessage"
    response = requests.post(url, json={"chat_id": cfg.destino, "text": oferta.mensagem}, timeout=20)
    response.raise_for_status()
    return response.json()


def enviar_whatsapp(oferta):
    cfg = (ConfiguracaoCanal.objects.filter(owner=oferta.owner, canal="WHATSAPP", ativo=True).first() or
           ConfiguracaoCanal.objects.filter(owner__isnull=True, canal="WHATSAPP", ativo=True).first())
    if not cfg or not cfg.token or not cfg.destino or not cfg.endpoint:
        raise RuntimeError("WhatsApp não configurado. Informe endpoint, token e destino.")
    headers = {"Authorization": f"Bearer {cfg.token}", "Content-Type": "application/json"}
    payload = {
        "messaging_product": "whatsapp",
        "to": cfg.destino,
        "type": "text",
        "text": {"preview_url": True, "body": oferta.mensagem},
    }
    response = requests.post(cfg.endpoint, json=payload, headers=headers, timeout=20)
    response.raise_for_status()
    return response.json()


def enviar_oferta(oferta, canal):
    canal = canal.upper()
    if canal == "TELEGRAM":
        result = enviar_telegram(oferta)
    elif canal == "WHATSAPP":
        result = enviar_whatsapp(oferta)
    else:
        raise RuntimeError(f"Canal não suportado: {canal}")
    Mensagem.objects.create(
        owner=oferta.owner, produto=oferta.produto, canal=canal, status="ENVIADO",
        conteudo=oferta.mensagem, data_envio=timezone.now(),
    )
    oferta.status = "ENVIADA"
    oferta.save(update_fields=["status", "atualizada_em"])
    return result
