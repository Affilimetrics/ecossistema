from django.contrib import admin
from .models import AdAccount, Campaign, ConnectedAccount


@admin.register(ConnectedAccount)
class ConnectedAccountAdmin(admin.ModelAdmin):
    list_display = ("provider", "display_name", "user", "connected_at", "last_checked_at")
    list_filter = ("provider",)
    search_fields = ("display_name", "external_user_id", "user__username", "user__email")
    exclude = ("encrypted_access_token",)
    readonly_fields = ("external_user_id", "connected_at", "last_checked_at", "granted_scopes")

    def has_add_permission(self, request):
        # Contas conectadas devem ser criadas somente pelo fluxo OAuth.
        return False


@admin.register(AdAccount)
class AdAccountAdmin(admin.ModelAdmin):
    list_display = ("name", "external_id", "connection", "account_status", "currency")
    search_fields = ("name", "external_id")
    list_filter = ("account_status", "currency")


@admin.register(Campaign)
class CampaignAdmin(admin.ModelAdmin):
    list_display = ("name", "ad_account", "objective", "status", "effective_status")
    search_fields = ("name", "external_id")
    list_filter = ("status", "effective_status", "objective")
