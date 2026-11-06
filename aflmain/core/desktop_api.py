"""API autenticada para o aplicativo desktop Skallora.

A API usa tokens assinados com prazo de validade e vinculados ao hash de sessão
Django do usuário. Não armazena senhas nem exige uma tabela adicional.
"""
from __future__ import annotations

import json
from decimal import Decimal, InvalidOperation
from functools import wraps
from urllib.parse import urlparse

from django.conf import settings
from django.contrib.auth import authenticate, get_user_model
from django.core import signing
from django.core.signing import BadSignature, SignatureExpired
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from django.utils.crypto import constant_time_compare
from django.views.decorators.csrf import csrf_exempt

from .models import Afiliado, AlertaSistema, Execucao, HistoricoPreco, LogExecucao, Oferta, Produto

TOKEN_SALT = "skallora.desktop.api.v1"
TOKEN_MAX_AGE = getattr(settings, "DESKTOP_API_TOKEN_MAX_AGE", 60 * 60 * 24 * 30)
MARKETPLACES = {"MAGALU", "MERCADO_LIVRE", "AMAZON", "OUTROS"}
FINAL_STATES = {"FINALIZADO", "PARADO", "ERRO"}


def _json_body(request):
    try:
        data = json.loads(request.body.decode("utf-8") or "{}")
    except (UnicodeDecodeError, json.JSONDecodeError):
        return None
    return data if isinstance(data, dict) else None


def _error(message, status=400, **extra):
    return JsonResponse({"sucesso": False, "erro": message, **extra}, status=status)


def _token_for(user):
    payload = {
        "uid": user.pk,
        "auth": user.get_session_auth_hash(),
        "v": 1,
    }
    signing_key = getattr(settings, "DESKTOP_API_SIGNING_KEY", "") or settings.SECRET_KEY
    return signing.dumps(payload, key=signing_key, salt=TOKEN_SALT, compress=True)


def _user_from_token(request):
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    try:
        signing_key = getattr(settings, "DESKTOP_API_SIGNING_KEY", "") or settings.SECRET_KEY
        payload = signing.loads(token.strip(), key=signing_key, salt=TOKEN_SALT, max_age=TOKEN_MAX_AGE)
    except (BadSignature, SignatureExpired, TypeError, ValueError):
        return None
    if not isinstance(payload, dict) or payload.get("v") != 1:
        return None
    User = get_user_model()
    user = User.objects.filter(pk=payload.get("uid"), is_active=True).first()
    if not user:
        return None
    current_hash = user.get_session_auth_hash()
    if not constant_time_compare(str(payload.get("auth", "")), current_hash):
        return None
    return user


def desktop_auth_required(view):
    @csrf_exempt
    @wraps(view)
    def wrapped(request, *args, **kwargs):
        user = _user_from_token(request)
        if user is None:
            return _error("Autenticação inválida ou expirada. Entre novamente.", 401)
        request.desktop_user = user
        return view(request, *args, **kwargs)
    return wrapped


def _produto_json(produto):
    try:
        afiliado = produto.afiliado
    except Afiliado.DoesNotExist:
        afiliado = None
    return {
        "id": produto.pk,
        "marketplace": produto.marketplace,
        "categoria": produto.categoria,
        "nome": produto.nome,
        "url_produto": produto.url_produto,
        "link_afiliado": afiliado.link_afiliado if afiliado else "",
        "status_afiliado": afiliado.status if afiliado else "REVISAR",
        "preco_anterior": str(produto.preco_anterior) if produto.preco_anterior is not None else None,
        "preco_atual": str(produto.preco_atual) if produto.preco_atual is not None else None,
        "imagem_url": produto.imagem_url,
        "desconto": str(produto.calcular_desconto_porcentagem()),
        "criado_em": produto.criado_em.isoformat() if produto.criado_em else None,
        "atualizado_em": produto.atualizado_em.isoformat() if produto.atualizado_em else None,
    }


def _execucao_json(execucao):
    return {
        "id": execucao.pk,
        "estado": execucao.estado,
        "inicio": execucao.inicio.isoformat() if execucao.inicio else None,
        "fim": execucao.fim.isoformat() if execucao.fim else None,
        "produtos_processados": execucao.produtos_processados,
        "produtos_total": execucao.produtos_total,
        "links_obtidos": execucao.links_obtidos,
        "categorias": execucao.categorias or [],
        "keywords": execucao.keywords or [],
        "erro": execucao.erro,
    }


@csrf_exempt
def desktop_login(request):
    if request.method != "POST":
        return _error("Use POST.", 405)
    data = _json_body(request)
    if data is None:
        return _error("JSON inválido.")
    username = str(data.get("username", "")).strip()
    password = str(data.get("password", ""))
    if not username or not password:
        return _error("Informe usuário e senha.")
    user = authenticate(request=request, username=username, password=password)
    if not user or not user.is_active:
        return _error("Usuário ou senha inválidos.", 401)
    return JsonResponse({
        "sucesso": True,
        "token": _token_for(user),
        "expires_in": TOKEN_MAX_AGE,
        "usuario": {"id": user.pk, "username": user.get_username(), "nome": user.get_full_name() or user.get_username()},
    })


@desktop_auth_required
def desktop_me(request):
    if request.method != "GET":
        return _error("Use GET.", 405)
    user = request.desktop_user
    return JsonResponse({"sucesso": True, "usuario": {"id": user.pk, "username": user.get_username(), "nome": user.get_full_name() or user.get_username()}})


@desktop_auth_required
def desktop_dashboard(request):
    if request.method != "GET":
        return _error("Use GET.", 405)
    user = request.desktop_user
    produtos = Produto.objects.filter(owner=user)
    execucoes = Execucao.objects.filter(owner=user)
    chief = None
    from .services import obter_produto_chefe_usuario
    produto_chefe = obter_produto_chefe_usuario(user)
    if produto_chefe:
        chief = _produto_json(produto_chefe)
        chief["score"] = str(produto_chefe.score_chefe())
        chief["motivo"] = produto_chefe.obter_motivo_chefe()
    ultima = execucoes.first()
    return JsonResponse({
        "sucesso": True,
        "metricas": {
            "produtos": produtos.count(),
            "links_afiliados": produtos.filter(afiliado__link_afiliado__isnull=False).exclude(afiliado__link_afiliado="").count(),
            "ofertas": Oferta.objects.filter(owner=user).count(),
            "ofertas_enviadas": Oferta.objects.filter(owner=user, status="ENVIADA").count(),
        },
        "produto_chefe": chief,
        "ultima_execucao": _execucao_json(ultima) if ultima else None,
        "execucoes_recentes": [_execucao_json(item) for item in execucoes[:8]],
        "alertas": list(AlertaSistema.objects.filter(owner=user, resolvido=False).values("id", "nivel", "titulo", "mensagem")[:5]),
    })


@desktop_auth_required
def desktop_products(request):
    if request.method != "GET":
        return _error("Use GET.", 405)
    user = request.desktop_user
    marketplace = str(request.GET.get("marketplace", "")).strip().upper()
    try:
        limit = min(max(int(request.GET.get("limit", 100)), 1), 200)
        offset = max(int(request.GET.get("offset", 0)), 0)
    except ValueError:
        return _error("limit e offset devem ser números inteiros.")
    qs = Produto.objects.filter(owner=user).select_related("afiliado")
    if marketplace:
        qs = qs.filter(marketplace=marketplace)
    total = qs.count()
    return JsonResponse({"sucesso": True, "total": total, "produtos": [_produto_json(p) for p in qs[offset:offset + limit]]})


@desktop_auth_required
def desktop_executions(request):
    if request.method != "GET":
        return _error("Use GET.", 405)
    user = request.desktop_user
    try:
        limit = min(max(int(request.GET.get("limit", 50)), 1), 200)
    except ValueError:
        return _error("limit deve ser um número inteiro.")
    items = Execucao.objects.filter(owner=user)[:limit]
    return JsonResponse({"sucesso": True, "execucoes": [_execucao_json(item) for item in items]})


@desktop_auth_required
def desktop_logs(request):
    if request.method != "GET":
        return _error("Use GET.", 405)
    user = request.desktop_user
    try:
        since_id = max(int(request.GET.get("since", 0)), 0)
        execution_id = request.GET.get("execution_id")
        limit = min(max(int(request.GET.get("limit", 200)), 1), 500)
    except ValueError:
        return _error("Parâmetros numéricos inválidos.")
    qs = LogExecucao.objects.filter(execucao__owner=user, id__gt=since_id)
    if execution_id:
        qs = qs.filter(execucao_id=execution_id)
    logs = qs.order_by("id")[:limit]
    return JsonResponse({"sucesso": True, "logs": [{
        "id": log.pk, "execucao_id": log.execucao_id, "nivel": log.nivel,
        "mensagem": log.mensagem, "criado_em": log.criado_em.isoformat(),
    } for log in logs]})


@desktop_auth_required
def desktop_create_execution(request):
    if request.method != "POST":
        return _error("Use POST.", 405)
    data = _json_body(request)
    if data is None:
        return _error("JSON inválido.")
    marketplace = str(data.get("marketplace", "")).strip().upper()
    term = str(data.get("termo", "")).strip()
    try:
        quantity = min(max(int(data.get("quantidade", 10)), 1), 50)
    except (ValueError, TypeError):
        return _error("Quantidade inválida.")
    if marketplace not in MARKETPLACES or not term:
        return _error("Marketplace ou termo de busca inválido.")
    execution = Execucao.objects.create(
        owner=request.desktop_user,
        estado="EXECUTANDO",
        categorias=[f"Marketplace: {marketplace}"],
        keywords=[term],
        produtos_total=quantity,
    )
    LogExecucao.objects.create(execucao=execution, nivel="INFO", mensagem=f"Coleta desktop iniciada: {marketplace} — {term}.")
    return JsonResponse({"sucesso": True, "execucao": _execucao_json(execution)}, status=201)


@desktop_auth_required
def desktop_ingest_product(request):
    if request.method != "POST":
        return _error("Use POST.", 405)
    data = _json_body(request)
    if data is None:
        return _error("JSON inválido.")
    user = request.desktop_user
    try:
        execution_id = int(data.get("execution_id"))
    except (ValueError, TypeError):
        return _error("execution_id inválido.")
    execution = Execucao.objects.filter(pk=execution_id, owner=user).first()
    if not execution:
        return _error("Execução não encontrada.", 404)
    marketplace = str(data.get("marketplace", "MERCADO_LIVRE")).strip().upper()
    name = str(data.get("nome", "")).strip()[:500]
    url = str(data.get("url_produto", "")).strip()
    category = str(data.get("categoria", "Busca desktop" )).strip()[:120]
    parsed = urlparse(url)
    allowed_hosts = ("mercadolivre.com.br", "mercadolibre.com", "meli.la")
    host_ok = bool(parsed.hostname) and any(parsed.hostname == host or parsed.hostname.endswith("." + host) for host in allowed_hosts)
    if marketplace != "MERCADO_LIVRE" or not name or parsed.scheme not in {"http", "https"} or not host_ok:
        return _error("Produto inválido. Esta rota aceita apenas links válidos do Mercado Livre.")
    def _price(value):
        if value in (None, ""):
            return None
        try:
            result = Decimal(str(value))
            return result if result >= 0 else None
        except (InvalidOperation, TypeError, ValueError):
            return None
    current_price = _price(data.get("preco_atual"))
    previous_price = _price(data.get("preco_anterior"))
    with transaction.atomic():
        product, _ = Produto.objects.update_or_create(
            owner=user,
            url_produto=url,
            defaults={
                "marketplace": marketplace,
                "categoria": category,
                "nome": name,
                "preco_atual": current_price,
                "preco_anterior": previous_price,
                "imagem_url": str(data.get("imagem_url", ""))[:3000],
            },
        )
        affiliate_link = str(data.get("link_afiliado", "")).strip()
        Afiliado.objects.update_or_create(
            produto=product,
            defaults={"link_afiliado": affiliate_link or None, "status": "OK" if affiliate_link else "REVISAR"},
        )
        if current_price is not None:
            HistoricoPreco.objects.create(produto=product, preco=current_price)
        execution.produtos_processados += 1
        if affiliate_link:
            execution.links_obtidos += 1
        execution.save(update_fields=["produtos_processados", "links_obtidos"])
        LogExecucao.objects.create(execucao=execution, nivel="OK", mensagem=f"Produto importado: {name[:180]}.")
    return JsonResponse({"sucesso": True, "produto": _produto_json(product)}, status=201)


@desktop_auth_required
def desktop_execution_finish(request, execution_id):
    if request.method != "POST":
        return _error("Use POST.", 405)
    data = _json_body(request)
    if data is None:
        return _error("JSON inválido.")
    state = str(data.get("estado", "FINALIZADO")).upper()
    if state not in FINAL_STATES:
        return _error("Estado final inválido.")
    execution = Execucao.objects.filter(pk=execution_id, owner=request.desktop_user).first()
    if not execution:
        return _error("Execução não encontrada.", 404)
    execution.estado = state
    execution.erro = str(data.get("erro", ""))[:5000]
    execution.fim = timezone.now()
    execution.save(update_fields=["estado", "erro", "fim"])
    if execution.erro:
        LogExecucao.objects.create(execucao=execution, nivel="ERROR" if state == "ERRO" else "WARNING", mensagem=execution.erro[:2000])
    else:
        LogExecucao.objects.create(execucao=execution, nivel="INFO", mensagem=f"Execução encerrada: {state}.")
    return JsonResponse({"sucesso": True, "execucao": _execucao_json(execution)})


# O controlador Magalu continua sendo o mesmo descrito na documentação original.
# Estas rotas apenas permitem que o cliente desktop use a mesma máquina de estados.
def _magalu_status(user):
    from magalu_bot.controlador import controlador_bot
    if controlador_bot.esta_executando() and controlador_bot.owner_id not in (None, user.pk):
        return {"sucesso": True, "executando": True, "estado": "ocupado", "status": "ocupado", "execucao_id": None, "progresso": {"processados": 0, "links": 0, "total": 0}}
    if controlador_bot.owner_id not in (None, user.pk):
        last = Execucao.objects.filter(owner=user).first()
        if last:
            return {
                "sucesso": True, "executando": False, "estado": last.estado.lower(),
                "status": last.estado.lower(), "erro": last.erro or "",
                "execucao_id": last.pk, "categorias": last.categorias or [],
                "keywords": last.keywords or [],
                "progresso": {"processados": last.produtos_processados, "links": last.links_obtidos, "total": last.produtos_total},
            }
        return {"sucesso": True, "executando": False, "estado": "parado", "status": "parado", "execucao_id": None, "progresso": {"processados": 0, "links": 0, "total": 0}}
    status = controlador_bot.status()
    if not status.get("execucao_id"):
        last = Execucao.objects.filter(owner=user).first()
        if last:
            status.update({"execucao_id": last.pk, "categorias": last.categorias or [], "keywords": last.keywords or [], "progresso": {"processados": last.produtos_processados, "links": last.links_obtidos, "total": last.produtos_total}})
    return status


@desktop_auth_required
def desktop_magalu_status(request):
    if request.method != "GET":
        return _error("Use GET.", 405)
    return JsonResponse(_magalu_status(request.desktop_user))


@desktop_auth_required
def _channel_warnings(user):
    """Espelha os avisos não bloqueantes já usados pelo painel web."""
    from .models import ConfiguracaoCanal
    missing = []
    for channel in ("TELEGRAM", "WHATSAPP"):
        config = ConfiguracaoCanal.objects.filter(owner=user, canal=channel).first()
        if channel == "TELEGRAM":
            valid = bool(config and config.token and config.destino)
            label = "Telegram"
        else:
            valid = bool(config and config.token and config.destino and config.endpoint)
            label = "WhatsApp"
        if not valid:
            missing.append(label)
    if not missing:
        return []
    names = " e ".join(missing)
    return [{
        "nivel": "WARNING",
        "titulo": "Divulgação não configurada",
        "mensagem": f"{names} ainda não possui configuração completa. A coleta continuará normalmente, mas os produtos não serão divulgados por esses canais.",
    }]


def desktop_magalu_start(request):
    if request.method != "POST":
        return _error("Use POST.", 405)
    data = _json_body(request)
    if data is None:
        return _error("JSON inválido.")
    categories = data.get("categorias", [])
    keywords = data.get("keywords", [])
    categories_loop = data.get("categorias_loop", [])
    keywords_loop = data.get("keywords_loop", [])
    if not all(isinstance(x, list) for x in (categories, keywords, categories_loop, keywords_loop)):
        return _error("Categorias e palavras-chave devem ser listas.")
    clean = lambda values: list(dict.fromkeys(str(v).strip()[:180] for v in values if str(v).strip()))
    categories, keywords = clean(categories), clean(keywords)
    categories_loop, keywords_loop = clean(categories_loop), clean(keywords_loop)
    if not categories and not keywords:
        return _error("Selecione ao menos uma categoria ou palavra-chave.")
    from magalu_bot.controlador import controlador_bot
    if controlador_bot.esta_executando():
        return _error("O coletor está ocupado ou já está em execução.", 409)
    from .template_service import garantir_templates_nativos, keywords_sem_template, garantir_registros_keywords
    garantir_templates_nativos(request.desktop_user)
    missing = keywords_sem_template(request.desktop_user, keywords)
    if missing:
        garantir_registros_keywords(request.desktop_user, missing)
        return _error("Configure um template para as palavras-chave antes de iniciar.", 422, keywords_sem_template=missing)
    started = controlador_bot.iniciar(
        categorias_selecionadas=categories,
        keywords=keywords,
        categorias_loop=categories_loop,
        keywords_loop=keywords_loop,
        owner_id=request.desktop_user.pk,
    )
    if not started:
        return _error("Não foi possível iniciar o coletor Magalu.", 409)
    return JsonResponse({"sucesso": True, "status": controlador_bot.status(), "avisos": _channel_warnings(request.desktop_user)})


def _magalu_action(request, action):
    if request.method != "POST":
        return _error("Use POST.", 405)
    from magalu_bot.controlador import controlador_bot
    user = request.desktop_user
    if controlador_bot.esta_executando() and controlador_bot.owner_id not in (None, user.pk):
        return _error("A execução pertence a outro usuário.", 409)
    ok = {"pause": controlador_bot.pausar, "resume": controlador_bot.retomar, "stop": controlador_bot.parar}[action]()
    if not ok:
        return _error("Não foi possível executar o comando no estado atual.", 409, status=controlador_bot.status().get("status"))
    return JsonResponse({"sucesso": True, "status": controlador_bot.status()})


@desktop_auth_required
def desktop_magalu_pause(request):
    return _magalu_action(request, "pause")


@desktop_auth_required
def desktop_magalu_resume(request):
    return _magalu_action(request, "resume")


@desktop_auth_required
def desktop_magalu_stop(request):
    return _magalu_action(request, "stop")


@desktop_auth_required
def desktop_magalu_logs(request):
    if request.method != "GET":
        return _error("Use GET.", 405)
    user = request.desktop_user
    try:
        since = max(int(request.GET.get("since", 0)), 0)
    except ValueError:
        return _error("since inválido.")
    execution_id = request.GET.get("execution_id")
    qs = LogExecucao.objects.filter(execucao__owner=user, id__gt=since)
    if execution_id:
        qs = qs.filter(execucao_id=execution_id)
    return JsonResponse({"sucesso": True, "logs": [{"id": x.pk, "execucao_id": x.execucao_id, "nivel": x.nivel, "mensagem": x.mensagem, "criado_em": x.criado_em.isoformat()} for x in qs.order_by("id")[:300]]})
