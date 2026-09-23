"""Motor de divulgação inteligente inspirado nas estratégias do Smart Affiliate Bot.

Não exige que o usuário escreva copy: escolhe automaticamente uma chamada,
bloco de preço, gatilho e CTA a partir do produto, desconto, histórico e turno.
"""
from __future__ import annotations

import random
import re
import html
from decimal import Decimal
from datetime import datetime

GENERIC = [
    "🕵️‍♀️ Olha o que eu acabei de garimpar para vocês! ✨",
    "🚨 Alerta de preço baixo na tela! 📉",
    "🤖 Mais um achadinho liberado pela Celle! 💎",
    "✨ Meus algoritmos encontraram esse tesouro escondido! 🔍",
    "🎯 Mais um achadinho que merece entrar no carrinho! 🔥",
]

CATEGORY = {
    "BELEZA": ["✨ Beleza em promoção e com preço que a carteira agradece!", "💄 Achadinho de beleza detectado!"],
    "CASA": ["🏠 Um upgrade pra casa sem pesar tanto no bolso!", "🧹 Achadinho útil para deixar a rotina mais fácil!"],
    "COZINHA": ["🍳 A cozinha agradece esse achadinho!", "⚡ Utilidade de cozinha com preço de oportunidade!"],
    "ELETRODOMESTICOS": ["⚡ Eletro em oferta detectado pelos radares!", "🏠 Aquele upgrade de casa que apareceu no precinho!"],
    "CELULARES": ["📱 Achado tech no radar!", "🚨 Tecnologia em promoção: vale conferir!"],
    "ELETRONICOS": ["🤖 Meus sensores detectaram um achado tech!", "⚡ Upgrade de tecnologia no precinho!"],
    "GAMES": ["🎮 Setup de respeito começa por uma boa oferta!", "🕹️ Achadinho gamer liberado!"],
    "INFORMATICA": ["💻 Upgrade de setup detectado!", "🚀 Tecnologia para trabalhar ou jogar pagando menos!"],
    "LIVROS": ["📚 Mais uma leitura para a estante com desconto!", "☕ Achadinho para quem ama ler!"],
}

KEYWORDS = {
    "perfume": "✨ Cheirinho de milhões sem pagar preço de milhões!",
    "air fryer": "🍟 A salvação da cozinha apareceu no precinho!",
    "fone": "🎧 Aumenta o som: esse achadinho merece atenção!",
    "headset": "🎮🎧 Upgrade de áudio no radar!",
    "notebook": "💻 Máquina nova no radar com preço de oportunidade!",
    "celular": "📱 Upgrade de bolso detectado!",
    "smartwatch": "⌚ Tecnologia no pulso com preço que chamou atenção!",
    "playstation": "🎮 O setup gamer agradece essa oferta!",
    "xbox": "🎮 Achadinho gamer liberado!",
    "tv": "📺 Tela grande no radar: confira o preço!",
    "fralda": "👶 Hora de fazer estoque sem estourar o orçamento!",
    "shampoo": "🧴 Cuidados pessoais no precinho!",
    "organizador": "📦 A paz de ver tudo organizado chegou com desconto!",
}

URGENCY = {
    "RELAMPAGO": "⚡ <b>OFERTA RELÂMPAGO</b> — oportunidade para agir rápido!",
    "NOITE": "🌙 <b>ACHADO DA NOITE</b> — apareceu no radar agora!",
    "ALMOCO": "☀️ <b>ACHADO DO ALMOÇO</b> — pausa rápida para conferir!",
    "MANHA": "☕ <b>ACHADINHO DA MANHÃ</b> — começando o dia com preço bom!",
    "TARDE": "🔥 <b>ACHADO DA TARDE</b> — hora de conferir!",
}


def _money(v):
    if v is None:
        return None
    return f"R$ {Decimal(str(v)):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def desconto(preco_anterior, preco_atual):
    if preco_anterior and preco_atual and preco_anterior > 0 and preco_atual < preco_anterior:
        return int(((preco_anterior - preco_atual) / preco_anterior) * 100)
    return 0


def detectar_turno(agora=None, limite=None):
    if limite:
        return "RELAMPAGO"
    agora = agora or datetime.now()
    h = agora.hour + agora.minute / 60
    if 8.5 <= h < 10.5:
        return "MANHA"
    if 12 <= h < 14:
        return "ALMOCO"
    if 15.5 <= h < 18.5:
        return "TARDE"
    if h >= 20 or h < 1:
        return "NOITE"
    return "MANHA"


def chamada_inteligente(nome, categoria="", preco_atual=None, owner=None):
    texto = (nome or "").casefold()
    categoria_raw = (categoria or "").strip()
    categoria_limpa = categoria_raw.replace("keyword:", "", 1).strip()

    if owner is not None:
        try:
            from .models import TemplateOferta
            tipo = "KEYWORD" if categoria_raw.casefold().startswith("keyword:") else "CATEGORIA"
            template = TemplateOferta.objects.filter(
                owner=owner, tipo=tipo, chave__iexact=categoria_limpa, ativo=True
            ).first()
            if template:
                if template.divulgar_sem_template:
                    return ""
                chamadas = [str(x).strip() for x in (template.chamadas or []) if str(x).strip()]
                if chamadas:
                    return random.choice(chamadas)
        except Exception:
            pass

    categoria_upper = categoria_limpa.upper()
    for palavra, frase in KEYWORDS.items():
        if palavra in texto:
            return frase
    for chave, frases in CATEGORY.items():
        if chave in categoria_upper or chave.casefold() in texto:
            return random.choice(frases)
    if preco_atual is not None and Decimal(str(preco_atual)) <= 40:
        return random.choice(["💰 Precinho camarada detectado!", "🛒 Menos de R$ 40: meu radar aprovou!"])
    return random.choice(GENERIC)


def gerar_mensagem(produto, turno=None, campanha=None):
    """Gera automaticamente uma mensagem HTML pronta para Telegram/WhatsApp."""
    anterior = produto.preco_anterior
    atual = produto.preco_atual
    pct = desconto(anterior, atual)
    turno = turno or detectar_turno()
    chamada = chamada_inteligente(produto.nome, produto.categoria, atual, owner=produto.owner)
    linhas = [chamada] if chamada else []
    if turno in URGENCY:
        linhas += ["", URGENCY[turno]]
    # Valores vindos do produto precisam ser escapados porque a mensagem usa HTML do Telegram.
    # Sem isso, nomes contendo &, <, > ou aspas podem gerar "Bad Request: can't parse entities".
    nome = html.escape((produto.nome or "Oferta")[:350], quote=False)
    link = html.escape(produto.afiliado.link_afiliado or "", quote=True)
    linhas += ["", f"📦 <b>{nome}</b>", ""]
    if anterior and atual and anterior > atual:
        linhas += [f"❌ <s>De: {_money(anterior)}</s>", f"✅ <b>Por: {_money(atual)}</b> <b>({pct}% OFF)</b> 📉"]
    elif atual:
        linhas += [f"💰 <b>Preço: {_money(atual)}</b>"]
    if campanha and campanha != "NENHUM":
        linhas += [f"\n🎯 <b>Seleção {html.escape(str(campanha), quote=False)}</b>"]
    linhas += ["", "🛒 <b>COMPRE AQUI:</b> 👇", f"👉 <a href='{link}'>CLIQUE PARA VER NO SITE</a>"]
    return "\n".join(linhas)
