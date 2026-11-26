import json

import pandas as pd

from django.conf import settings
from django.http import JsonResponse, Http404
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth import authenticate, login as auth_login, logout as auth_logout
from django.contrib.auth import update_session_auth_hash
from django.contrib.auth.decorators import login_required
from django.contrib.admin.views.decorators import staff_member_required
from django.contrib.auth.models import User
from django.utils.http import url_has_allowed_host_and_scheme
from django.views.decorators.http import require_GET
from django.contrib import messages
from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from django.views.decorators.http import require_POST
from .models import (Produto, Execucao, Oferta, LogExecucao, ConfiguracaoCanal,
                     ConfiguracaoAutomacao, TemplateOferta, AlertaSistema, ProdutoQuente, PerfilUsuario)
from .forms import CadastroForm, PerfilForm, ExclusaoContaForm
from .test_runner import TEST_SUITES, executar_suite_isolada
from .account_deletion import excluir_conta_e_dados_relacionados
from .services import criar_oferta, enviar_oferta, obter_produto_chefe_usuario
from .template_service import garantir_templates_nativos, keywords_sem_template, garantir_registros_keywords, atualizar_produtos_quentes, normalizar_chave
from .marketing import desconto
from .config_service import obter_config_automacao
from .alerts import registrar_alerta_canal, resolver_alerta_canal, sincronizar_alertas_canais
from .opportunity import calcular_oportunidade
from magalu_bot.config.config import CATEGORIAS_PRINCIPAIS

from magalu_bot.controlador import controlador_bot

from ads_manager.models import ConnectedAccount, AdAccount, Campaign
from ads_manager.services.campaign_sync import synchronize_campaigns
from ads_manager.services.meta import MetaAPIError
from ads_manager.services.encryption import TokenEncryptionError
from ltv.analytics.metrics import dashboard_metrics as ltv_dashboard_metrics
from cpa.analytics import build_dashboard_data as cpa_build_dashboard_data
from cpa.models import Campaign as CPACampaign
from financeiro.services.indicadores import dashboard_metrics as roi_dashboard_metrics



def _avisos_divulgacao_ao_iniciar(user):
    """Avisos não bloqueantes quando uma coleta começa sem canais configurados."""
    faltantes = []
    for canal in ("TELEGRAM", "WHATSAPP"):
        cfg = ConfiguracaoCanal.objects.filter(owner=user, canal=canal).first()
        if canal == "TELEGRAM":
            valido = bool(cfg and cfg.token and cfg.destino)
        else:
            valido = bool(cfg and cfg.token and cfg.destino and cfg.endpoint)
        if not valido:
            faltantes.append("Telegram" if canal == "TELEGRAM" else "WhatsApp")
    if not faltantes:
        return []
    nomes = " e ".join(faltantes)
    return [{
        "nivel": "WARNING",
        "titulo": "Divulgação não configurada",
        "mensagem": f"{nomes} ainda não possui configuração completa. A coleta continuará normalmente, mas os produtos não serão divulgados por esses canais.",
    }]

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
    perfil, _ = PerfilUsuario.objects.get_or_create(owner=request.user)
    categoria_termometro = (request.GET.get("categoria_termometro") or "").strip()
    categorias_nativas = list(CATEGORIAS_PRINCIPAIS.values())
    if categoria_termometro not in categorias_nativas:
        categoria_termometro = ""
    oportunidade = calcular_oportunidade(perfil.timezone, categoria=categoria_termometro or None)
    coleta_configurada = bool(
        ultima_execucao and (ultima_execucao.categorias or ultima_execucao.keywords)
    )
    produto_chefe = obter_produto_chefe_usuario(request.user)
    # O resumo da Home e o dashboard Avançado > LTV Manager consultam
    # as mesmas tabelas e a mesma função de métricas, sem duplicar snapshots.
    ltv_metrics = ltv_dashboard_metrics(request.user)
    # CPA usa os mesmos 30 dias padrão do painel CPA; agregações calculadas no banco.
    cpa_metrics = cpa_build_dashboard_data(request.user, include_details=False)
    cpa_active_campaigns_count = CPACampaign.objects.filter(user=request.user, is_active=True).count()
    # ROI usa a mesma função e o mesmo escopo padrão do dashboard ROI (todo o histórico).
    roi_metrics = roi_dashboard_metrics(request.user)

    # A visão geral e a aba Avançado > Tráfego Pago usam o mesmo snapshot
    # persistido de campanhas e a mesma conta selecionada na sessão.
    ads_connection = ConnectedAccount.objects.filter(user=request.user, provider="META").first()
    ads_accounts = AdAccount.objects.filter(connection=ads_connection) if ads_connection else AdAccount.objects.none()
    selected_ads_account_id = request.session.get("selected_ad_account_id")
    ads_selected_account = ads_accounts.filter(pk=selected_ads_account_id).first() if selected_ads_account_id else None
    ads_selected_account = ads_selected_account or ads_accounts.first()
    ads_campaigns = Campaign.objects.none()
    ads_sync_error = False
    if ads_connection and ads_selected_account:
        try:
            ads_campaigns = synchronize_campaigns(ads_connection, ads_selected_account)
        except (MetaAPIError, TokenEncryptionError):
            # Mantém o último snapshot íntegro caso a Meta esteja temporariamente indisponível.
            ads_sync_error = True
            ads_campaigns = Campaign.objects.filter(ad_account=ads_selected_account)
    ads_active_campaigns = ads_campaigns.filter(
        Q(effective_status__iexact="ACTIVE") | Q(effective_status="", status__iexact="ACTIVE")
    )

    return render(request, "core/home.html", {
        "produtos": produtos,
        "links": links,
        "ofertas": ofertas,
        "enviadas": enviadas,
        "ultima_execucao": ultima_execucao,
        "categorias_chart": json.dumps(categorias_chart, ensure_ascii=False),
        "marketplaces_chart": json.dumps(marketplaces_chart, ensure_ascii=False),
        "oportunidade": oportunidade,
        "categoria_termometro": categoria_termometro,
        "categorias_nativas": categorias_nativas,
        "coleta_configurada": coleta_configurada,
        "produto_chefe": produto_chefe,
        "motivo_produto_chefe": produto_chefe.obter_motivo_chefe() if produto_chefe else "",
        "ads_connection": ads_connection,
        "ads_accounts_count": ads_accounts.count(),
        "ads_selected_account": ads_selected_account,
        "ads_campaign_count": ads_campaigns.count(),
        "ads_active_campaign_count": ads_active_campaigns.count(),
        "ads_active_campaigns": ads_active_campaigns[:5],
        "ads_campaign_sync_error": ads_sync_error,
        "ltv_metrics": ltv_metrics,
        "cpa_metrics": cpa_metrics,
        "cpa_active_campaigns_count": cpa_active_campaigns_count,
        "roi_metrics": roi_metrics,
    })


def login(request):
    if request.user.is_authenticated:
        return redirect("home")
    if request.method == "POST":
        login_identifier = (request.POST.get("username") or "").strip()
        password = request.POST.get("password") or ""
        # Compatibilidade com contas antigas cujo username/e-mail foi salvo
        # com maiúsculas ou cujo username não coincide exatamente com o e-mail.
        account = User.objects.filter(email__iexact=login_identifier).order_by("pk").first()
        if account is None:
            account = User.objects.filter(username__iexact=login_identifier).order_by("pk").first()
        username = account.username if account is not None else login_identifier.lower()
        user = authenticate(request, username=username, password=password)
        if user is not None:
            auth_login(request, user)
            # "Lembrar de mim" prolonga somente a sessão; senha nunca é salva
            # em cookie, localStorage ou outro armazenamento do navegador.
            request.session.set_expiry(60 * 60 * 24 * 14 if request.POST.get("remember_me") else 0)
            destination = request.POST.get("next") or request.GET.get("next") or "/home/"
            if not url_has_allowed_host_and_scheme(
                destination,
                allowed_hosts={request.get_host()},
                require_https=request.is_secure(),
            ):
                destination = "/home/"
            return redirect(destination)
        messages.error(request, "E-mail ou senha inválidos.")
    return render(request, "core/login.html")


def cadastro(request):
    if request.user.is_authenticated:
        return redirect("home")
    form = CadastroForm(request.POST or None)
    if request.method == "POST" and form.is_valid():
        dados = form.cleaned_data
        # Usuário e perfil são criados na mesma transação para evitar conta
        # sem perfil quando uma das gravações falha.
        with transaction.atomic():
            user = User.objects.create_user(
                username=dados["email"],
                email=dados["email"],
                password=dados["password"],
                first_name=dados["nome"],
            )
            PerfilUsuario.objects.create(
                owner=user,
                data_nascimento=dados.get("data_nascimento"),
                telefone=dados.get("telefone", "").strip(),
                pais=(dados.get("pais") or "Brasil").strip(),
                estado=(dados.get("estado") or "").strip(),
                cidade=(dados.get("cidade") or "").strip(),
                timezone=dados.get("timezone") or "America/Sao_Paulo",
            )
        auth_login(request, user)
        messages.success(request, "Conta criada com sucesso.")
        return redirect("home")
    return render(request, "core/cadastro.html", {"form": form})


@login_required
def perfil(request):
    perfil_usuario, _ = PerfilUsuario.objects.get_or_create(owner=request.user)
    form = PerfilForm(
        request.POST or None,
        request.FILES or None,
        user=request.user,
        profile=perfil_usuario,
    )
    if request.method == "POST" and form.is_valid():
        dados = form.cleaned_data
        foto_anterior = perfil_usuario.foto
        foto_anterior_nome = foto_anterior.name if foto_anterior else ""
        alterar_foto = bool(dados.get("foto") or dados.get("remover_foto"))

        with transaction.atomic():
            request.user.first_name = dados["nome"].strip()
            request.user.email = dados["email"]
            request.user.username = dados["email"]
            update_fields = ["first_name", "email", "username"]
            if dados.get("password"):
                request.user.set_password(dados["password"])
                update_fields.append("password")
            request.user.save(update_fields=update_fields)

            perfil_usuario.telefone = dados.get("telefone", "").strip()
            perfil_usuario.data_nascimento = dados.get("data_nascimento")
            perfil_usuario.pais = (dados.get("pais") or "").strip()
            perfil_usuario.estado = (dados.get("estado") or "").strip()
            perfil_usuario.cidade = (dados.get("cidade") or "").strip()
            perfil_usuario.timezone = dados["timezone"]
            perfil_usuario.meta_investimento_mensal = dados.get("meta_investimento_mensal")
            perfil_usuario.meta_retorno_mensal = dados.get("meta_retorno_mensal")
            perfil_usuario.plataformas_divulgacao = dados.get("plataformas_divulgacao") or []
            perfil_usuario.nicho = (dados.get("nicho") or "").strip()
            if dados.get("foto"):
                perfil_usuario.foto = dados["foto"]
            elif dados.get("remover_foto"):
                perfil_usuario.foto = None
            perfil_usuario.save()

            foto_atual_nome = perfil_usuario.foto.name if perfil_usuario.foto else ""
            if alterar_foto and foto_anterior_nome and foto_anterior_nome != foto_atual_nome:
                storage = foto_anterior.storage
                transaction.on_commit(lambda storage=storage, name=foto_anterior_nome: storage.delete(name))

        if dados.get("password"):
            update_session_auth_hash(request, request.user)
        messages.success(request, "Perfil atualizado com sucesso.")
        return redirect("perfil")

    return render(request, "core/perfil.html", {
        "form": form,
        "perfil": perfil_usuario,
        "exclusao_form": ExclusaoContaForm(user=request.user),
    })


@login_required
@require_POST
def excluir_conta(request):
    form = ExclusaoContaForm(request.POST, user=request.user)
    if not form.is_valid():
        for errors in form.errors.values():
            for error in errors:
                messages.error(request, error)
        return redirect("perfil")

    user = request.user
    # Os relacionamentos com on_delete=CASCADE removem os dados pertencentes
    # à conta em todos os módulos. Auditorias com SET_NULL preservam o evento,
    # mas deixam de apontar para o usuário excluído.
    excluir_conta_e_dados_relacionados(user)
    auth_logout(request)
    return redirect("index")


@staff_member_required
@require_GET
def painel_testes(request):
    if not settings.DEBUG:
        raise Http404
    return render(request, "core/testes.html", {
        "suites": TEST_SUITES,
        "resultado": None,
    })


@staff_member_required
def executar_testes_pela_interface(request):
    if not settings.DEBUG:
        raise Http404
    if request.method != "POST":
        return redirect("painel_testes")
    suite_key = request.POST.get("suite", "")
    resultado = None
    if suite_key not in TEST_SUITES:
        resultado = {
            "success": False,
            "output": "Selecione uma suíte de testes válida.",
            "command": "",
            "database": "Não iniciado",
        }
    else:
        resultado = executar_suite_isolada(suite_key)
    return render(request, "core/testes.html", {
        "suites": TEST_SUITES,
        "resultado": resultado,
        "suite_selecionada": suite_key,
    })


def logout_view(request):
    if request.method == "POST":
        auth_logout(request)
    return redirect("index")


@login_required
def coleta_geral(request):
    garantir_templates_nativos(request.user)
    personalizadas = TemplateOferta.objects.filter(owner=request.user, tipo="KEYWORD", ativo=True).order_by("chave")
    return render(request, "core/coleta_geral.html", {
        "categorias": list(CATEGORIAS_PRINCIPAIS.items()),
        "personalizadas": personalizadas,
    })


@require_POST
@login_required
def criar_categoria_personalizada_view(request):
    try:
        dados = json.loads(request.body.decode("utf-8") or "{}")
    except Exception:
        return JsonResponse({"sucesso": False, "erro": "Dados inválidos."}, status=400)
    chave = normalizar_chave(dados.get("chave"))
    chamadas = [str(x).strip() for x in (dados.get("chamadas") or []) if str(x).strip()]
    sem_template = bool(dados.get("divulgar_sem_template"))
    if not chave:
        return JsonResponse({"sucesso": False, "erro": "Informe a palavra-chave."}, status=400)
    if not chamadas and not sem_template:
        return JsonResponse({"sucesso": False, "erro": "Crie ao menos uma chamada ou escolha divulgar sem template."}, status=400)
    obj, _ = TemplateOferta.objects.update_or_create(
        owner=request.user, tipo="KEYWORD", chave=chave,
        defaults={"chamadas": chamadas, "divulgar_sem_template": sem_template, "ativo": True, "nativo": False},
    )
    return JsonResponse({"sucesso": True, "chave": obj.chave, "nome": obj.chave.title()})


@login_required
def magalu_bot(request):
    # A Central Magalu reutiliza as mesmas categorias personalizadas/templates
    # da Coleta Geral. O vínculo continua sendo por usuário.
    garantir_templates_nativos(request.user)
    personalizadas = list(TemplateOferta.objects.filter(
        owner=request.user,
        tipo="KEYWORD",
        ativo=True,
    ).order_by("chave").values_list("chave", flat=True))
    return render(request, "core/magalu_bot.html", {
        "personalizadas": personalizadas,
    })


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
    categorias_loop = dados.get("categorias_loop", [])

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
    if not isinstance(categorias_loop, list):
        return JsonResponse({"sucesso": False, "erro": "'categorias_loop' deve ser uma lista.", "status": "parado"}, status=400)
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
        categorias_loop=categorias_loop,
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
            "categorias_loop": categorias_loop,
            "avisos": _avisos_divulgacao_ao_iniciar(request.user),
        }
    )


@require_POST
@login_required
def controlar_coleta_dashboard_view(request):
    """Inicia a última configuração válida ou solicita parada segura pela Home."""
    if _bot_de_outro_usuario(request):
        return JsonResponse({"sucesso": False, "erro": "O coletor está em uso por outro usuário.", "status": "ocupado"}, status=409)

    if controlador_bot.esta_executando():
        if controlador_bot.parada_solicitada():
            return JsonResponse({"sucesso": False, "erro": "A parada já foi solicitada.", "status": "parando"}, status=409)
        if controlador_bot.parar():
            return JsonResponse({"sucesso": True, "mensagem": "Parada segura solicitada.", "status": "parando"})
        return JsonResponse({"sucesso": False, "erro": "Não foi possível solicitar a parada.", "status": controlador_bot.status()["status"]}, status=409)

    ultima = Execucao.objects.filter(owner=request.user).first()
    if not ultima or not (ultima.categorias or ultima.keywords):
        return JsonResponse({
            "sucesso": False,
            "erro": "Configure uma coleta antes de iniciá-la pela Dashboard.",
            "status": "sem_configuracao",
            "configurar_url": "/coleta/",
        }, status=422)

    garantir_templates_nativos(request.user)
    faltantes = keywords_sem_template(request.user, ultima.keywords or [])
    if faltantes:
        garantir_registros_keywords(request.user, faltantes)
        return JsonResponse({
            "sucesso": False,
            "erro": "A configuração salva possui categorias personalizadas sem template.",
            "status": "sem_configuracao",
            "configurar_url": "/coleta/",
        }, status=422)

    iniciou = controlador_bot.iniciar(
        categorias_selecionadas=ultima.categorias or [],
        keywords=ultima.keywords or [],
        keywords_loop=ultima.keywords_loop or [],
        categorias_loop=ultima.categorias_loop or [],
        owner_id=request.user.id,
    )
    if not iniciou:
        return JsonResponse({"sucesso": False, "erro": "Não foi possível iniciar a coleta.", "status": "parado"}, status=409)
    return JsonResponse({
        "sucesso": True,
        "mensagem": "Coleta iniciada com a última configuração.",
        "status": controlador_bot.status()["status"],
        "avisos": _avisos_divulgacao_ao_iniciar(request.user),
    })


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

    if controlador_bot.parada_solicitada():
        return JsonResponse(
            {
                "sucesso": False,
                "erro": "A parada já foi solicitada. Aguarde o encerramento seguro da execução.",
                "status": "parando",
            },
            status=409,
        )

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

    sincronizar_alertas_canais(request.user)
    status["alertas"] = list(AlertaSistema.objects.filter(owner=request.user, resolvido=False).values("id", "titulo", "mensagem", "canal", "nivel")[:5])
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
    itens = list(qs[:50])
    for item in itens:
        item.desconto_real = desconto(item.produto.preco_anterior, item.produto.preco_atual)
    return render(request, "core/produtos_quentes.html", {
        "produtos_quentes": itens, "categorias": categorias, "categoria_atual": categoria,
        "ranking_atualizado": atualizado, "ultima_atualizacao": ultimo.calculado_em if ultimo else None,
    })


@login_required
def configuracoes_view(request):
    auto = obter_config_automacao(owner=request.user)
    telegram, _ = ConfiguracaoCanal.objects.get_or_create(owner=request.user, canal="TELEGRAM")
    whatsapp, _ = ConfiguracaoCanal.objects.get_or_create(owner=request.user, canal="WHATSAPP")
    perfil, _ = PerfilUsuario.objects.get_or_create(owner=request.user)

    if request.method == "POST":
        perfil.pais = (request.POST.get("pais") or perfil.pais or "Brasil").strip()
        perfil.estado = (request.POST.get("estado") or "").strip()
        perfil.cidade = (request.POST.get("cidade") or "").strip()
        perfil.timezone = (request.POST.get("timezone") or perfil.timezone or "America/Sao_Paulo").strip()
        perfil.save()

        # O frontend pode ativar o canal automaticamente quando a configuração
        # mínima fica válida. O backend, porém, nunca força o switch: se o
        # usuário desligá-lo manualmente, essa decisão é preservada.
        telegram.destino = (request.POST.get("telegram_chat_id") or "").strip()
        novo_token = (request.POST.get("telegram_bot_token") or "").strip()
        if novo_token:
            telegram.token = novo_token
        telegram_valido = bool(telegram.token and telegram.destino)
        telegram.ativo = (request.POST.get("telegram_ativo") == "on") and telegram_valido
        telegram.save()

        whatsapp.destino = (request.POST.get("whatsapp_destination") or "").strip()
        whatsapp.endpoint = (request.POST.get("whatsapp_api_endpoint") or "").strip()
        novo_wa_token = (request.POST.get("whatsapp_api_token") or "").strip()
        if novo_wa_token:
            whatsapp.token = novo_wa_token
        whatsapp_valido = bool(whatsapp.token and whatsapp.destino and whatsapp.endpoint)
        whatsapp.ativo = (request.POST.get("whatsapp_ativo") == "on") and whatsapp_valido
        whatsapp.save()

        # Uma configuração local válida normaliza imediatamente os alertas de
        # configuração/credencial anteriores. Não é necessário aguardar uma nova
        # coleta para a interface refletir que o usuário acabou de corrigir o canal.
        # Falhas remotas futuras (401/403/timeout etc.) continuam sendo registradas
        # normalmente quando uma publicação for realmente tentada.
        if telegram_valido:
            resolver_alerta_canal(request.user, "TELEGRAM")
        elif telegram.ativo:
            registrar_alerta_canal(request.user, "TELEGRAM", "Token e chat_id são obrigatórios quando o canal está ativo.")
        else:
            resolver_alerta_canal(request.user, "TELEGRAM")

        if whatsapp_valido:
            resolver_alerta_canal(request.user, "WHATSAPP")
        elif whatsapp.ativo:
            registrar_alerta_canal(request.user, "WHATSAPP", "Token, endpoint e destino são obrigatórios quando o canal está ativo.")
        else:
            resolver_alerta_canal(request.user, "WHATSAPP")

        # Canais automáticos só podem apontar para canais válidos e ativos.
        canais=[]
        if telegram.ativo and request.POST.get("auto_telegram") == "on":
            canais.append("TELEGRAM")
        if whatsapp.ativo and request.POST.get("auto_whatsapp") == "on":
            canais.append("WHATSAPP")

        # A UI ativa este switch assim que existir um canal utilizável. O POST
        # continua respeitando desligamento manual e nunca mantém automação sem
        # ao menos um canal automático válido/ativo.
        auto.auto_publicar_ofertas = (request.POST.get("auto_publicar_ofertas") == "on") and bool(canais)
        auto.canais_automaticos = canais
        try:
            auto.cache_retencao_hours = max(1, int(request.POST.get("cache_retencao_hours") or 120))
        except ValueError:
            auto.cache_retencao_hours = 120
        auto.campanha_sazonal = (request.POST.get("campanha_sazonal") or "NENHUM").strip()[:80]
        auto.turno_padrao = (request.POST.get("turno_padrao") or "").strip()[:20]
        auto.save()
        messages.success(request, "Configurações de divulgação salvas com sucesso.")
        return redirect("home")

    return render(request, "core/configuracoes.html", {
        "auto": auto, "telegram": telegram, "whatsapp": whatsapp, "perfil": perfil,
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
