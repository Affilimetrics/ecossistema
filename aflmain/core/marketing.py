"""Motor de divulgação inteligente inspirado nas estratégias do Smart Affiliate Bot.

Não exige que o usuário escreva copy: escolhe automaticamente uma chamada,
bloco de preço, gatilho e CTA a partir do produto, desconto, histórico e turno.
"""
from __future__ import annotations

import random
import re
import html
import unicodedata
from decimal import Decimal
from datetime import datetime
from zoneinfo import ZoneInfo
from django.utils import timezone as django_timezone

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


# Sinais simples de intenção por família de produto. O objetivo não é
# classificar todo o catálogo, mas detectar conflitos fortes antes de usar
# uma copy contextual. Quando não há evidência suficiente, o fluxo atual é
# preservado; quando há conflito claro, usamos uma chamada neutra.
CATEGORY_SIGNALS = {
    "cozinha": (
        "air fryer", "fritadeira", "panela", "frigideira", "caçarola",
        "liquidificador", "batedeira", "cafeteira", "microondas",
        "micro ondas", "forno", "fogão", "fogao", "cooktop",
        "paneleiro", "armário de cozinha", "armario de cozinha",
        "balcão de cozinha", "balcao de cozinha", "jogo de talheres",
        "talher", "escorredor", "utensílio de cozinha", "utensilio de cozinha",
    ),
    "banheiro": (
        "gabinete para banheiro", "gabinete de banheiro", "armário de banheiro",
        "armario de banheiro", "chuveiro", "ducha", "vaso sanitário",
        "vaso sanitario", "assento sanitário", "assento sanitario",
        "toalheiro", "porta toalha", "saboneteira", "box banheiro",
        "kit banheiro", "cuba para banheiro", "espelho para banheiro",
    ),
    "quarto": (
        "cama", "colchão", "colchao", "travesseiro", "guarda roupa",
        "guarda-roupa", "cabeceira", "criado mudo", "criado-mudo",
        "mesa de cabeceira", "lençol", "lencol", "edredom", "cobertor",
    ),
    "sala": (
        "sofá", "sofa", "rack", "painel para tv", "painel tv", "poltrona",
        "mesa de centro", "aparador", "estante para sala", "home theater",
    ),
}


def _texto_normalizado(valor):
    texto = unicodedata.normalize("NFKD", str(valor or "").casefold())
    texto = "".join(ch for ch in texto if not unicodedata.combining(ch))
    texto = re.sub(r"[^a-z0-9]+", " ", texto)
    return " ".join(texto.split())


def _contem_sinal(texto, sinal):
    texto = _texto_normalizado(texto)
    sinal = _texto_normalizado(sinal)
    if not texto or not sinal:
        return False
    texto_delimitado = f" {texto} "
    if f" {sinal} " in texto_delimitado:
        return True

    # Plural simples é comum em títulos de marketplace (panela/panelas,
    # frigideira/frigideiras etc.). Para sinais de uma palavra, aceitamos
    # também a forma com "s" sem partir para fuzzy matching amplo.
    if " " not in sinal and len(sinal) >= 4:
        if f" {sinal}s " in texto_delimitado:
            return True
    return False


def _categorias_sugeridas_pelo_nome(nome):
    encontradas = set()
    for categoria, sinais in CATEGORY_SIGNALS.items():
        for sinal in sinais:
            if _contem_sinal(nome, sinal):
                encontradas.add(categoria)
                break
    return encontradas


def avaliar_compatibilidade_contexto(nome, categoria=""):
    """Valida se a categoria/keyword usada na coleta contradiz o produto.

    Retorna ``(compativel, motivo)``. A validação é propositalmente
    conservadora: só rejeita quando o nome aponta de forma clara para outra
    categoria conhecida. Itens sem sinal suficiente continuam seguindo o
    comportamento normal.
    """
    categoria_raw = str(categoria or "").strip()
    is_keyword = categoria_raw.casefold().startswith("keyword:")
    chave = categoria_raw.split(":", 1)[1].strip() if is_keyword and ":" in categoria_raw else categoria_raw
    chave_norm = _texto_normalizado(chave)
    sugeridas = _categorias_sugeridas_pelo_nome(nome)

    # Para categorias principais, um produto claramente identificado como
    # pertencente a outra família não deve receber a copy da categoria de
    # origem (ex.: panela coletada como banheiro).
    categorias_conhecidas = {_texto_normalizado(k): k for k in CATEGORY_SIGNALS}
    categoria_contexto = categorias_conhecidas.get(chave_norm)
    if categoria_contexto and sugeridas and categoria_contexto not in sugeridas:
        return False, f"produto sugere {', '.join(sorted(sugeridas))}, contexto informa {categoria_contexto}"

    # Keywords que representam uma das categorias conhecidas recebem a mesma
    # proteção. Keywords livres continuam válidas para não quebrar templates
    # personalizados do usuário.
    if is_keyword and categoria_contexto and sugeridas and categoria_contexto not in sugeridas:
        return False, f"produto sugere {', '.join(sorted(sugeridas))}, keyword informa {categoria_contexto}"

    return True, "sem conflito forte"


def _money(v):
    if v is None:
        return None
    return f"R$ {Decimal(str(v)):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")


def desconto(preco_anterior, preco_atual):
    if preco_anterior and preco_atual and preco_anterior > 0 and preco_atual < preco_anterior:
        return int(((preco_anterior - preco_atual) / preco_anterior) * 100)
    return 0


def detectar_turno(agora=None, limite=None, owner=None):
    if limite:
        return "RELAMPAGO"
    if agora is None:
        tz_name = "America/Sao_Paulo"
        if owner is not None:
            try:
                tz_name = owner.perfil_local.timezone or tz_name
            except Exception:
                pass
        try:
            agora = django_timezone.now().astimezone(ZoneInfo(tz_name))
        except Exception:
            agora = django_timezone.localtime(django_timezone.now())
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
    contexto_compativel, _motivo = avaliar_compatibilidade_contexto(nome, categoria_raw)

    # Template personalizado/nativo só é aplicado quando não existe conflito
    # forte entre o nome real do produto e o contexto salvo na coleta.
    if owner is not None and contexto_compativel:
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

    # Mesmo quando o contexto está errado, uma correspondência direta no nome
    # do produto continua segura (ex.: Air Fryer reconhecida como Air Fryer).
    for palavra, frase in KEYWORDS.items():
        if palavra in texto:
            return frase

    # Em caso de conflito forte NÃO usamos fallback por categoria. Assim uma
    # panela coletada acidentalmente como "banheiro" nunca recebe chamada de
    # banheiro; segue para uma copy neutra.
    if contexto_compativel:
        categoria_upper = categoria_limpa.upper()
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
    turno = turno or detectar_turno(owner=produto.owner)
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
