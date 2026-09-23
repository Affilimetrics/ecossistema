import json

import pandas as pd

from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.views.decorators.http import require_GET
from django.contrib import messages
from django.db.models import Count
from django.utils import timezone
from django.views.decorators.http import require_POST
from .models import (Produto, Execucao, Oferta, LogExecucao, ConfiguracaoCanal,
                     ConfiguracaoAutomacao, TemplateOferta, AlertaSistema, ProdutoQuente)
from .services import criar_oferta, enviar_oferta
from .template_service import garantir_templates_nativos, keywords_sem_template, garantir_registros_keywords, atualizar_produtos_quentes, normalizar_chave
from .config_service import obter_config_automacao
from .alerts import registrar_alerta_canal, resolver_alerta_canal
from magalu_bot.config.config import CATEGORIAS_PRINCIPAIS

from magalu_bot.controlador import controlador_bot


def index(request):
    if request.user.is_authenticated:
        return redirect("home")
    return render(request, "core/index.html")


@login_required
def home(request):
    """Home operacional do usuário autenticado, com métricas e gráficos."""
    produtos_qs = list(
        Produto.objects.filter(
            owner=request.user,
            afiliado__link_afiliado__isnull=False,
        ).exclude(afiliado__link_afiliado="").values(
            "categoria", "marketplace"
        )
    )

    df = pd.DataFrame(produtos_qs, columns=["categoria", "marketplace"])

    categorias_predefinidas = list(CATEGORIAS_PRINCIPAIS.values())
    categorias_lower = {str(c).strip().casefold(): c for c in categorias_predefinidas}

    if df.empty:
        categorias_chart = [["Categoria", "Links"], ["Outros", 0]]
        marketplaces_chart = [["Marketplace", "Links"], ["Nenhum", 0]]
    else:
        def classificar_categoria(valor):
            texto = str(valor or "").strip()
            if texto.casefold().startswith("keyword:"):
                return "Outros"
            return categorias_lower.get(texto.casefold(), "Outros")

        df["categoria_grafico"] = df["categoria"].map(classificar_categoria)
        categoria_counts = (
            df.groupby("categoria_grafico", dropna=False)
            .size()
            .sort_values(ascending=False)
        )
        # Mantém todas as categorias predefinidas no gráfico, mesmo sem links.
        categoria_rows = [[categoria, int(categoria_counts.get(categoria, 0))]
                          for categoria in categorias_predefinidas]
        outros = int(categoria_counts.get("Outros", 0))
        if outros or not categoria_rows:
            categoria_rows.append(["Outros", outros])
        categorias_chart = [["Categoria", "Links"], *categoria_rows]

        marketplace_counts = df["marketplace"].fillna("OUTROS").replace("", "OUTROS").str.upper().value_counts()
        marketplaces_chart = [["Marketplace", "Links"], *[[str(k), int(v)] for k, v in marketplace_counts.items()]]

    produtos = Produto.objects.filter(owner=request.user).count()
    links = Produto.objects.filter(owner=request.user, afiliado__link_afiliado__isnull=False).exclude(afiliado__link_afiliado="").count()
    ofertas = Oferta.objects.filter(owner=request.user).count()
    enviadas = Oferta.objects.filter(owner=request.user, status="ENVIADA").count()
    ultima_execucao = Execucao.objects.filter(owner=request.user).first()

    return render(request, "core/home.html", {
        "produtos": produtos,
        "links": links,
        "ofertas": ofertas,
        "enviadas": enviadas,
        "ultima_execucao": ultima_execucao,
        "categorias_chart": json.dumps(categorias_chart, ensure_ascii=False),
        "marketplaces_chart": json.dumps(marketplaces_chart, ensure_ascii=False),
    })


def login(request):
    if request.user.is_authenticated:
        return redirect("home")
    if request.method == "POST":
        username = (request.POST.get("username") or "").strip().lower()
        password = request.POST.get("password") or ""
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request, user)
            if not request.POST.get("remember_me"):
                request.session.set_expiry(0)
            return redirect(request.GET.get("next") or "home")
        messages.error(request, "E-mail ou senha inválidos.")
    return render(request, "core/login.html")


def cadastro(request):
    if request.user.is_authenticated:
        return redirect("home")
    if request.method == "POST":
        nome = (request.POST.get("nome") or "").strip()
        email = (request.POST.get("email") or "").strip().lower()
        senha = request.POST.get("password") or ""
        confirmacao = request.POST.get("password_confirm") or ""
        if not nome or not email or not senha:
            messages.error(request, "Preencha todos os campos obrigatórios.")
        elif senha != confirmacao:
            messages.error(request, "As senhas não coincidem.")
        elif User.objects.filter(username=email).exists() or User.objects.filter(email__iexact=email).exists():
            messages.error(request, "Já existe uma conta com esse e-mail.")
        else:
            try:
                validate_email(email)
                validate_password(senha)
                user = User.objects.create_user(username=email, email=email, password=senha, first_name=nome)
                auth_login(request, user)
                messages.success(request, "Conta criada com sucesso.")
                return redirect("home")
            except ValidationError as exc:
                for erro in exc.messages:
                    messages.error(request, erro)
    return render(request, "core/cadastro.html")


def logout_view(request):
    if request.method == "POST":
        auth_logout(request)
    return redirect("index")


@login_required
<<<<<<< HEAD
def coleta_geral(request):
    return render(request, "core/coleta_geral.html", {"categorias": list(CATEGORIAS_PRINCIPAIS.items())})


@login_required
=======
>>>>>>> origin/main
def magalu_bot(request):
    return render(request, "core/magalu_bot.html")


def _somente_post(request):
    if request.method != "POST":
        return JsonResponse(
            {"sucesso": False, "erro": "Método não permitido. Use POST."},
            status=405,
        )
    return None


def _bot_de_outro_usuario(request):
    return (
        controlador_bot.esta_executando()
        and controlador_bot.owner_id not in (None, request.user.id)
    )


@login_required
def iniciar_bot_view(request):
    erro_metodo = _somente_post(request)
    if erro_metodo:
        return erro_metodo

    if controlador_bot.esta_executando() and controlador_bot.owner_id not in (None, request.user.id):
        return JsonResponse({
            "sucesso": False,
            "erro": "O coletor está em execução por outro usuário. Aguarde a finalização.",
            "status": "ocupado",
        }, status=409)

    if controlador_bot.esta_executando():
        status = controlador_bot.status()
        return JsonResponse(
            {
                "sucesso": False,
                "erro": "O bot já está em execução.",
                "status": status["status"],
            },
            status=409,
        )

    try:
        dados = json.loads(request.body.decode("utf-8") or "{}")
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {"sucesso": False, "erro": "JSON inválido.", "status": "parado"},
            status=400,
        )

    categorias = dados.get("categorias", [])
    keywords = dados.get("keywords", [])
    keywords_loop = dados.get("keywords_loop", [])

    if not isinstance(categorias, list):
        return JsonResponse(
            {"sucesso": False, "erro": "'categorias' deve ser uma lista.", "status": "parado"},
            status=400,
        )
    if not isinstance(keywords, list):
        return JsonResponse(
            {"sucesso": False, "erro": "'keywords' deve ser uma lista.", "status": "parado"},
            status=400,
        )
    if not isinstance(keywords_loop, list):
        return JsonResponse(
            {"sucesso": False, "erro": "'keywords_loop' deve ser uma lista.", "status": "parado"},
            status=400,
        )

    if not categorias and not keywords:
        return JsonResponse(
            {"sucesso": False, "erro": "Selecione ao menos uma categoria ou palavra-chave.", "status": "parado"},
            status=400,
        )

    garantir_templates_nativos(request.user)
    faltantes = keywords_sem_template(request.user, keywords)
    if faltantes:
        garantir_registros_keywords(request.user, faltantes)
        return JsonResponse({
            "sucesso": False,
            "erro": "Antes de processar novas palavras-chave, configure um template de divulgação ou marque 'divulgar sem template'.",
            "status": "parado",
            "keywords_sem_template": faltantes,
            "configurar_url": "/ofertas/templates/",
        }, status=422)

    iniciou = controlador_bot.iniciar(
        categorias_selecionadas=categorias,
        keywords_loop=keywords_loop,
        keywords=keywords,
        owner_id=request.user.id,
    )

    if not iniciou:
        status = controlador_bot.status()
        return JsonResponse(
            {
                "sucesso": False,
                "erro": "Não foi possível iniciar o bot.",
                "status": status["status"],
            },
            status=409,
        )

    status = controlador_bot.status()
    return JsonResponse(
        {
            "sucesso": True,
            "mensagem": "Bot iniciado em segundo plano.",
            "status": status["status"],
            "categorias": categorias,
            "keywords": keywords,
            "keywords_loop": keywords_loop,
        }
    )


@login_required
def pausar_bot_view(request):
    erro_metodo = _somente_post(request)
    if erro_metodo:
        return erro_metodo

    if _bot_de_outro_usuario(request):
        return JsonResponse({"sucesso": False, "erro": "Você não pode pausar a execução de outro usuário.", "status": "ocupado"}, status=409)

    if controlador_bot.esta_pausado():
        return JsonResponse(
            {"sucesso": False, "erro": "O bot já está pausado.", "status": "pausado"}
        )

    if not controlador_bot.esta_executando():
        status = controlador_bot.status()
        return JsonResponse(
            {"sucesso": False, "erro": "O bot não está em execução.", "status": status["status"]},
            status=409,
        )

    if controlador_bot.pausar():
        # A thread muda para PAUSADO somente quando chegar ao próximo
        # ponto seguro. O polling da interface mostrará a transição real.
        return JsonResponse(
            {
                "sucesso": True,
                "mensagem": "Solicitação de pausa enviada; aguardando ponto seguro.",
                "status": "executando",
            }
        )

    status = controlador_bot.status()
    return JsonResponse(
        {"sucesso": False, "erro": "Não foi possível solicitar a pausa.", "status": status["status"]},
        status=409,
    )


@login_required
def retomar_bot_view(request):
    erro_metodo = _somente_post(request)
    if erro_metodo:
        return erro_metodo

    if _bot_de_outro_usuario(request):
        return JsonResponse({"sucesso": False, "erro": "Você não pode retomar a execução de outro usuário.", "status": "ocupado"}, status=409)

    if not controlador_bot.esta_pausado():
        status = controlador_bot.status()
        return JsonResponse(
            {
                "sucesso": False,
                "erro": "O bot não está pausado. Retomar só continua uma execução pausada.",
                "status": status["status"],
            },
            status=409,
        )

    if controlador_bot.retomar():
        return JsonResponse(
            {
                "sucesso": True,
                "mensagem": "A mesma execução foi retomada.",
                "status": "executando",
            }
        )

    status = controlador_bot.status()
    return JsonResponse(
        {"sucesso": False, "erro": "Não foi possível retomar o bot.", "status": status["status"]},
        status=409,
    )


@login_required
def parar_bot_view(request):
    erro_metodo = _somente_post(request)
    if erro_metodo:
        return erro_metodo

    if _bot_de_outro_usuario(request):
        return JsonResponse({"sucesso": False, "erro": "Você não pode parar a execução de outro usuário.", "status": "ocupado"}, status=409)

    if controlador_bot.parar():
        return JsonResponse(
            {
                "sucesso": True,
                "mensagem": "Solicitação de parada enviada; os dados serão salvos no próximo ponto seguro.",
                "status": "parando",
            }
        )

    status = controlador_bot.status()
    return JsonResponse(
        {"sucesso": False, "erro": "O bot não está em execução.", "status": status["status"]},
        status=409,
    )


@login_required
def status_bot_view(request):
    if request.method != "GET":
        return JsonResponse(
            {"sucesso": False, "erro": "Método não permitido. Use GET."},
            status=405,
        )

    if _bot_de_outro_usuario(request):
        return JsonResponse({"sucesso": True, "executando": True, "estado": "ocupado", "status": "ocupado", "erro": None, "execucao_id": None, "progresso": {"processados": 0, "links": 0, "total": 0}})

    status = controlador_bot.status()

    # Se o processo web foi reiniciado, a thread Selenium não pode ser recuperada,
    # mas a última configuração continua disponível no banco para a interface.
    if not status.get("execucao_id"):
        ultima = Execucao.objects.filter(owner=request.user).first()
        if ultima:
            status.update({
                "execucao_id": ultima.pk,
                "categorias": ultima.categorias or [],
                "keywords": ultima.keywords or [],
                "keywords_loop": ultima.keywords_loop or [],
                "progresso": {
                    "processados": ultima.produtos_processados,
                    "links": ultima.links_obtidos,
                    "total": ultima.produtos_total,
                },
            })

<<<<<<< HEAD
    status["alertas"] = list(AlertaSistema.objects.filter(owner=request.user, resolvido=False).values("id", "titulo", "mensagem", "canal", "nivel")[:5])
=======
    status["alertas"] = list(AlertaSistema.objects.filter(owner=request.user, resolvido=False).values("id", "titulo", "mensagem", "canal")[:5])
>>>>>>> origin/main
    return JsonResponse(status)


@require_GET
@login_required
def logs_bot_view(request):
    execucao_id = request.GET.get("execucao")
    since = request.GET.get("since", "0")
    try:
        since_id = int(since)
    except ValueError:
        since_id = 0
    qs = LogExecucao.objects.filter(id__gt=since_id, execucao__owner=request.user)
    if execucao_id:
        qs = qs.filter(execucao_id=execucao_id)
    logs = list(qs.order_by("id")[:200])
    return JsonResponse({
        "sucesso": True,
        "logs": [
            {"id": log.id, "nivel": log.nivel, "mensagem": log.mensagem,
             "criado_em": log.criado_em.isoformat(), "execucao_id": log.execucao_id}
            for log in logs
        ],
    })


@login_required
def dashboard(request):
    """Compatibilidade com links antigos: o painel principal agora é a Home."""
    return redirect("home")


@login_required
def ofertas_view(request):
    return redirect("templates_oferta")


@login_required
def templates_oferta_view(request):
    garantir_templates_nativos(request.user)
    if request.method == "POST":
        acao = request.POST.get("acao", "salvar_template")
        if acao == "salvar_template":
            template_id = request.POST.get("template_id")
            tipo = (request.POST.get("tipo") or "KEYWORD").upper()
            chave = normalizar_chave(request.POST.get("chave"))
            linhas = [x.strip() for x in (request.POST.get("chamadas") or "").splitlines() if x.strip()]
            sem_template = request.POST.get("divulgar_sem_template") == "on"
            if not chave:
                messages.error(request, "Informe a categoria ou palavra-chave.")
            elif not linhas and not sem_template:
                messages.error(request, "Informe ao menos um template ou marque 'divulgar sem template'.")
            else:
                if template_id:
                    obj = get_object_or_404(TemplateOferta, pk=template_id, owner=request.user)
                    obj.tipo = tipo
                    obj.chave = chave
                    obj.chamadas = linhas
                    obj.divulgar_sem_template = sem_template
                    obj.ativo = True
                    obj.save()
                else:
                    TemplateOferta.objects.update_or_create(
                        owner=request.user, tipo=tipo, chave=chave,
                        defaults={"chamadas": linhas, "divulgar_sem_template": sem_template, "ativo": True, "nativo": False},
                    )
                messages.success(request, "Template salvo com sucesso.")
            return redirect("templates_oferta")
        if acao == "editar_oferta":
            oferta = get_object_or_404(Oferta, pk=request.POST.get("oferta_id"), owner=request.user)
            oferta.titulo = (request.POST.get("titulo") or oferta.titulo).strip()
            oferta.mensagem = (request.POST.get("mensagem") or oferta.mensagem).strip()
            oferta.status = "PRONTA"
            oferta.save(update_fields=["titulo", "mensagem", "status", "atualizada_em"])
            messages.success(request, "Oferta editada.")
            return redirect("templates_oferta")

    templates = TemplateOferta.objects.filter(owner=request.user)
    ofertas = Oferta.objects.filter(owner=request.user).select_related("produto", "produto__afiliado")[:20]
    pendentes = templates.filter(tipo="KEYWORD", ativo=False)
    return render(request, "core/templates_oferta.html", {"templates": templates, "ofertas": ofertas, "pendentes": pendentes})


@login_required
def produtos_quentes_view(request):
    atualizado = atualizar_produtos_quentes(request.user, forcar=request.GET.get("atualizar") == "1")
    categoria = (request.GET.get("categoria") or "").strip()
    qs = ProdutoQuente.objects.filter(owner=request.user).select_related("produto", "produto__afiliado")
    categorias = list(Produto.objects.filter(owner=request.user).values_list("categoria", flat=True).distinct().order_by("categoria"))
    if categoria:
        qs = qs.filter(produto__categoria=categoria)
    ultimo = ProdutoQuente.objects.filter(owner=request.user).order_by("-calculado_em").first()
    return render(request, "core/produtos_quentes.html", {
        "produtos_quentes": qs[:50], "categorias": categorias, "categoria_atual": categoria,
        "ranking_atualizado": atualizado, "ultima_atualizacao": ultimo.calculado_em if ultimo else None,
    })


@login_required
def configuracoes_view(request):
    auto = obter_config_automacao(owner=request.user)
    telegram, _ = ConfiguracaoCanal.objects.get_or_create(owner=request.user, canal="TELEGRAM")
    whatsapp, _ = ConfiguracaoCanal.objects.get_or_create(owner=request.user, canal="WHATSAPP")

    if request.method == "POST":
        telegram.ativo = request.POST.get("telegram_ativo") == "on"
        telegram.destino = (request.POST.get("telegram_chat_id") or "").strip()
        novo_token = (request.POST.get("telegram_bot_token") or "").strip()
        if novo_token:
            telegram.token = novo_token
        telegram.save()

        whatsapp.ativo = request.POST.get("whatsapp_ativo") == "on"
        whatsapp.destino = (request.POST.get("whatsapp_destination") or "").strip()
        whatsapp.endpoint = (request.POST.get("whatsapp_api_endpoint") or "").strip()
        novo_wa_token = (request.POST.get("whatsapp_api_token") or "").strip()
        if novo_wa_token:
            whatsapp.token = novo_wa_token
        whatsapp.save()

        if telegram.ativo and (not telegram.token or not telegram.destino):
            registrar_alerta_canal(request.user, "TELEGRAM", "Token e chat_id são obrigatórios quando o canal está ativo.")
        elif not telegram.ativo:
            resolver_alerta_canal(request.user, "TELEGRAM")

        if whatsapp.ativo and (not whatsapp.token or not whatsapp.destino or not whatsapp.endpoint):
            registrar_alerta_canal(request.user, "WHATSAPP", "Token, endpoint e destino são obrigatórios quando o canal está ativo.")
        elif not whatsapp.ativo:
            resolver_alerta_canal(request.user, "WHATSAPP")

        canais=[]
        if request.POST.get("auto_telegram") == "on": canais.append("TELEGRAM")
        if request.POST.get("auto_whatsapp") == "on": canais.append("WHATSAPP")
        auto.auto_publicar_ofertas = request.POST.get("auto_publicar_ofertas") == "on"
        auto.canais_automaticos = canais
        try:
            auto.cache_retencao_hours = max(1, int(request.POST.get("cache_retencao_hours") or 120))
        except ValueError:
            auto.cache_retencao_hours = 120
        auto.campanha_sazonal = (request.POST.get("campanha_sazonal") or "NENHUM").strip()[:80]
        auto.turno_padrao = (request.POST.get("turno_padrao") or "").strip()[:20]
        auto.save()
        messages.success(request, "Configurações salvas. Tokens existentes permanecem preservados quando o campo fica vazio.")
        return redirect("configuracoes")

    return render(request, "core/configuracoes.html", {
        "auto": auto, "telegram": telegram, "whatsapp": whatsapp,
        "telegram_token_salvo": bool(telegram.token), "whatsapp_token_salvo": bool(whatsapp.token),
        "turnos": ["MANHA", "ALMOCO", "TARDE", "NOITE", "RELAMPAGO"],
    })


@require_POST
@login_required
def resolver_alerta_view(request, alerta_id):
    alerta = get_object_or_404(AlertaSistema, pk=alerta_id, owner=request.user)
    alerta.resolvido = True
    alerta.save(update_fields=["resolvido", "atualizado_em"])
    return redirect(request.POST.get("next") or "home")


@login_required
def enviar_oferta_view(request, oferta_id):
    if request.method != "POST":
        return JsonResponse({"sucesso": False, "erro": "Use POST."}, status=405)
    oferta = get_object_or_404(Oferta.objects.select_related("produto"), pk=oferta_id, owner=request.user)
    canal = request.POST.get("canal", "TELEGRAM")
    try:
        enviar_oferta(oferta, canal)
        return JsonResponse({"sucesso": True, "mensagem": f"Oferta enviada para {canal}."})
    except Exception as exc:
        return JsonResponse({"sucesso": False, "erro": str(exc)}, status=400)
