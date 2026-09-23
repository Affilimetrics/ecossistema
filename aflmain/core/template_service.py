from __future__ import annotations

from django.utils import timezone
from datetime import timedelta
from django.db import transaction
from .models import TemplateOferta, Produto, ProdutoQuente
from .marketing import desconto
from magalu_bot.config.config import CATEGORIAS_PRINCIPAIS

DEFAULTS = {
    "cozinha": [
        "🍳 Achadinho para sua cozinha!",
        "🥘 Uma utilidade que pode facilitar sua rotina na cozinha!",
        "✨ Upgrade simples para deixar a cozinha ainda melhor!",
        "👩‍🍳 Encontramos um item interessante para quem ama praticidade na cozinha!",
        "🛒 Garimpo do dia para sua cozinha — vale conferir!",
    ],
    "quarto": [
        "🛏️ Achadinho para deixar seu quarto ainda mais confortável!",
        "✨ Um detalhe novo para renovar o quarto sem complicação!",
        "🌙 Garimpo perfeito para dar aquele upgrade no quarto!",
        "🏡 Seu cantinho merece esse achado!",
        "🛒 Encontramos algo interessante para transformar o quarto!",
    ],
    "sala": [
        "🛋️ Achadinho para deixar sua sala ainda mais completa!",
        "🏠 Um toque novo para renovar a sala!",
        "✨ Garimpo para quem gosta de casa bonita e prática!",
        "📺 Item interessante para dar um upgrade na sala!",
        "🛒 Achado do dia para o coração da casa!",
    ],
    "banheiro": [
        "🧼 Achadinho útil para organizar e renovar seu banheiro!",
        "✨ Um pequeno upgrade que faz diferença no banheiro!",
        "🚿 Garimpo prático para sua rotina!",
        "🏠 Item útil para deixar o banheiro mais organizado!",
        "🛒 Achado funcional para seu banheiro — confira!",
    ],
    "acessórios": [
        "✨ Aquele acessório que completa tudo apareceu no radar!",
        "🛍️ Achadinho de acessório para conferir agora!",
        "💎 Um detalhe simples que pode fazer diferença!",
        "🎯 Garimpo rápido: acessório interessante no radar!",
        "🔥 Mais um achado para completar seu dia a dia!",
    ],
}


def normalizar_chave(valor):
    return " ".join(str(valor or "").strip().lower().split())


def garantir_templates_nativos(owner):
    categorias = list(CATEGORIAS_PRINCIPAIS.values())
    for categoria in categorias:
        chave = normalizar_chave(categoria)
        chamadas = DEFAULTS.get(chave, [
            f"✨ Achadinho para {categoria}!",
            f"🛒 Garimpo do dia em {categoria}!",
            f"🔥 Item interessante de {categoria} no radar!",
            f"🎯 Seleção especial de {categoria} para conferir!",
            f"💎 Mais um achado de {categoria}!",
        ])
        TemplateOferta.objects.get_or_create(
            owner=owner, tipo="CATEGORIA", chave=chave,
            defaults={"chamadas": chamadas, "nativo": True, "ativo": True},
        )


def keywords_sem_template(owner, keywords):
    faltantes=[]
    for keyword in keywords:
        chave=normalizar_chave(keyword)
        if not chave:
            continue
        template=TemplateOferta.objects.filter(owner=owner, tipo="KEYWORD", chave__iexact=chave).first()
        configurado = bool(template and template.ativo and (template.divulgar_sem_template or template.chamadas))
        if not configurado:
            faltantes.append(chave)
    return faltantes


def garantir_registros_keywords(owner, keywords):
    for keyword in keywords:
        chave=normalizar_chave(keyword)
        if chave:
            TemplateOferta.objects.get_or_create(
                owner=owner, tipo="KEYWORD", chave=chave,
                defaults={"chamadas": [], "ativo": False, "nativo": False},
            )


def _score(produto):
    pct = desconto(produto.preco_anterior, produto.preco_atual)
    score = float(pct) * 2.0
    motivos=[]
    if pct:
        motivos.append(f"{pct}% de desconto")
    idade_h=(timezone.now()-produto.atualizado_em).total_seconds()/3600
    frescor=max(0, 50-(idade_h/24)*2)
    score += frescor
    if idade_h <= 48:
        motivos.append("coletado recentemente")
    hist=list(produto.historico_precos.order_by('-registrado_em').values_list('preco', flat=True)[:2])
    if len(hist)>=2 and hist[0] is not None and hist[1] is not None and hist[0] < hist[1]:
        score += 25
        motivos.append("preço caiu desde a coleta anterior")
    if produto.preco_atual:
        score += 5
    return round(score,2), ", ".join(motivos) or "link afiliado recente e válido"


@transaction.atomic
def atualizar_produtos_quentes(owner, forcar=False):
    ultimo=ProdutoQuente.objects.filter(owner=owner).order_by('-calculado_em').first()
    if ultimo and not forcar and ultimo.calculado_em >= timezone.now()-timedelta(days=5):
        return False
    ProdutoQuente.objects.filter(owner=owner).delete()
    produtos=Produto.objects.filter(owner=owner, afiliado__status="OK", afiliado__link_afiliado__isnull=False).exclude(afiliado__link_afiliado="").select_related('afiliado').prefetch_related('historico_precos')
    ranking=[]
    for p in produtos:
        score,motivo=_score(p)
        ranking.append((score,p,motivo))
    ranking.sort(key=lambda x:x[0], reverse=True)
    for score,p,motivo in ranking[:100]:
        ProdutoQuente.objects.create(owner=owner, produto=p, score=score, motivo=motivo)
    return True
