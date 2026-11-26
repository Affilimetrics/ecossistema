import hmac
from datetime import timedelta

from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404, redirect, render
from django.core import signing
from django.utils import timezone
from django.views.decorators.http import require_POST

from .models import AdAccount, Campaign, ConnectedAccount
from .providers.meta_provider import MetaAdsProvider
from .services.encryption import TokenEncryptionError, decrypt_token, encrypt_token
from .services.meta import MetaAPIError, build_oauth_url, exchange_code_for_token
from .services.campaign_sync import synchronize_campaigns

OAUTH_STATE_SALT = "trafego-pago-base.meta-oauth.v1"


def _connection(request):
    return ConnectedAccount.objects.filter(user=request.user, provider="META").order_by("-connected_at").first()


def _provider(connection):
    if not connection:
        return None
    token = decrypt_token(connection.encrypted_access_token)
    return MetaAdsProvider(token)


def _sync_ad_accounts(connection, provider):
    remote_accounts = provider.list_ad_accounts()
    for item in remote_accounts:
        external_id = item.get("id")
        if not external_id:
            continue
        AdAccount.objects.update_or_create(
            connection=connection,
            external_id=external_id,
            defaults={
                "name": item.get("name", ""),
                "account_status": str(item.get("account_status", "")),
                "currency": item.get("currency", ""),
                "timezone_name": item.get("timezone_name", ""),
                "disable_reason": str(item.get("disable_reason", "")),
                "synced_at": timezone.now(),
            },
        )
    return remote_accounts


@login_required
def dashboard(request):
    connection = _connection(request)
    accounts = AdAccount.objects.filter(connection=connection) if connection else AdAccount.objects.none()
    selected_id = request.session.get("selected_ad_account_id")
    selected_account = accounts.filter(pk=selected_id).first() if selected_id else None
    selected_account = selected_account or accounts.first()
    campaign_rows = Campaign.objects.none()
    sync_error = False
    if connection and selected_account:
        try:
            campaign_rows = synchronize_campaigns(connection, selected_account)
        except (MetaAPIError, TokenEncryptionError):
            sync_error = True
            campaign_rows = Campaign.objects.filter(ad_account=selected_account)
    active_rows = campaign_rows.filter(
        Q(effective_status__iexact="ACTIVE") | Q(effective_status="", status__iexact="ACTIVE")
    )
    return render(request, "ads_manager/dashboard.html", {
        "connection": connection,
        "accounts": accounts,
        "selected_account": selected_account,
        "campaign_count": campaign_rows.count(),
        "active_campaign_count": active_rows.count(),
        "active_campaigns": active_rows[:5],
        "campaign_sync_error": sync_error,
    })


@login_required
def connect_meta(request):
    try:
        state = signing.dumps({"user_id": request.user.pk, "nonce": signing.dumps(str(timezone.now().timestamp()))}, salt=OAUTH_STATE_SALT)
        request.session["meta_oauth_state"] = state
        request.session.modified = True
        return redirect(build_oauth_url(state))
    except RuntimeError as exc:
        messages.error(request, str(exc))
        return redirect("ads_manager:dashboard")


@login_required
def meta_callback(request):
    if request.GET.get("error"):
        messages.error(request, "A conexão com a Meta foi cancelada ou recusada. Nenhum token foi salvo.")
        return redirect("ads_manager:dashboard")

    state = request.GET.get("state", "")
    saved_state = request.session.pop("meta_oauth_state", "")
    if not state or not saved_state or not hmac.compare_digest(state, saved_state):
        messages.error(request, "Não foi possível validar a sessão de autenticação. Inicie a conexão novamente.")
        return redirect("ads_manager:dashboard")
    try:
        state_data = signing.loads(state, salt=OAUTH_STATE_SALT, max_age=600)
        if str(state_data.get("user_id")) != str(request.user.pk):
            raise signing.BadSignature("Usuário divergente")
    except signing.BadSignature:
        messages.error(request, "A sessão de autenticação expirou. Tente conectar novamente.")
        return redirect("ads_manager:dashboard")

    code = request.GET.get("code")
    if not code:
        messages.error(request, "A Meta não retornou o código de autorização.")
        return redirect("ads_manager:dashboard")

    try:
        token_data = exchange_code_for_token(code)
        access_token = token_data.get("access_token")
        if not access_token:
            raise MetaAPIError("A Meta não forneceu um token de acesso.")
        # A criptografia usa uma chave própria, separada do SECRET_KEY do Django.
        encrypted_token = encrypt_token(access_token)
        provider = MetaAdsProvider(access_token)
        profile = provider.get_profile()
        permissions = provider.get_permissions()
        granted = [p.get("permission") for p in permissions if p.get("status") == "granted"]
        expires_in = token_data.get("expires_in")
        expires_at = timezone.now() + timedelta(seconds=int(expires_in)) if expires_in else None
        with transaction.atomic():
            connection, _ = ConnectedAccount.objects.update_or_create(
                user=request.user,
                provider="META",
                external_user_id=str(profile.get("id")),
                defaults={
                    "display_name": profile.get("name", "Conta Meta"),
                    "encrypted_access_token": encrypted_token,
                    "token_expires_at": expires_at,
                    "granted_scopes": granted,
                    "last_checked_at": timezone.now(),
                },
            )
        try:
            _sync_ad_accounts(connection, provider)
        except MetaAPIError as exc:
            messages.warning(request, f"Conta conectada, mas não foi possível listar contas de anúncios: {exc}")
        else:
            messages.success(request, "Conta Meta conectada. Seus ativos foram consultados com sucesso.")
    except (MetaAPIError, TokenEncryptionError, RuntimeError, ValueError) as exc:
        messages.error(request, str(exc))
    return redirect("ads_manager:dashboard")


@login_required
def assets(request):
    connection = _connection(request)
    if not connection:
        messages.info(request, "Conecte sua conta Meta para consultar seus ativos.")
        return redirect("ads_manager:dashboard")
    try:
        provider = _provider(connection)
        businesses = provider.list_businesses()
        pages = provider.list_pages()
        accounts = _sync_ad_accounts(connection, provider)
        connection.last_checked_at = timezone.now()
        connection.save(update_fields=["last_checked_at"])
        context = {"connection": connection, "businesses": businesses, "pages": pages,
                   "accounts": AdAccount.objects.filter(connection=connection)}
    except (MetaAPIError, TokenEncryptionError) as exc:
        messages.error(request, f"Falha ao consultar ativos: {exc}")
        context = {"connection": connection, "businesses": [], "pages": [],
                   "accounts": AdAccount.objects.filter(connection=connection)}
    return render(request, "ads_manager/assets.html", context)


@login_required
@require_POST
def select_account(request):
    account = get_object_or_404(AdAccount, pk=request.POST.get("account_id"), connection__user=request.user)
    request.session["selected_ad_account_id"] = account.pk
    messages.success(request, f"Conta selecionada: {account.name or account.external_id}.")
    return redirect("ads_manager:dashboard")


def _selected_account(request):
    connection = _connection(request)
    if not connection:
        return None
    queryset = AdAccount.objects.filter(connection=connection)
    selected_id = request.session.get("selected_ad_account_id")
    selected = queryset.filter(pk=selected_id).first() if selected_id else None
    return selected or queryset.first()


@login_required
def campaigns(request):
    connection = _connection(request)
    account = _selected_account(request)
    rows = []
    if not connection:
        messages.info(request, "Conecte sua conta Meta primeiro.")
    elif not account:
        messages.info(request, "Nenhuma conta de anúncios foi encontrada. Confira as permissões e sincronize os ativos.")
    else:
        try:
            rows = synchronize_campaigns(connection, account, force=True)
        except (MetaAPIError, TokenEncryptionError) as exc:
            messages.error(request, f"Não foi possível atualizar as campanhas: {exc}")
            rows = Campaign.objects.filter(ad_account=account)
    return render(request, "ads_manager/campaigns.html", {"connection": connection, "account": account, "campaigns": rows})


@login_required
def insights(request):
    connection = _connection(request)
    account = _selected_account(request)
    data = []
    if connection and account:
        try:
            data = _provider(connection).get_insights(account.normalized_id, "last_30d")
        except (MetaAPIError, TokenEncryptionError) as exc:
            messages.error(request, f"Não foi possível carregar as métricas: {exc}")
    elif not connection:
        messages.info(request, "Conecte sua conta Meta primeiro.")
    else:
        messages.info(request, "Selecione uma conta de anúncios para consultar as métricas.")
    totals = data[0] if data else {}
    return render(request, "ads_manager/insights.html", {"connection": connection, "account": account, "totals": totals})


@login_required
@require_POST
def disconnect_meta(request):
    connection = _connection(request)
    if connection:
        connection.delete()  # Remove token e cache locais; não revoga permissões diretamente na Meta.
    request.session.pop("selected_ad_account_id", None)
    messages.success(request, "Conexão Meta removida do Afillimetrics. Para revogar a autorização externa, remova o app nas configurações da Meta.")
    return redirect("ads_manager:dashboard")
