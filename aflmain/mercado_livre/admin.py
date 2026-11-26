from django.contrib import admin

from .models import MarketplaceItem, MercadoLivreSettings, SearchRun


@admin.register(MercadoLivreSettings)
class MercadoLivreSettingsAdmin(admin.ModelAdmin):
    list_display = ("user", "site_id", "request_timeout", "updated_at")
    search_fields = ("user__username", "user__email")
    readonly_fields = ("updated_at",)


@admin.register(MarketplaceItem)
class MarketplaceItemAdmin(admin.ModelAdmin):
    list_display = ("external_id", "product", "user", "updated_at")
    search_fields = ("external_id", "product__nome", "user__username")
    list_filter = ("updated_at",)


@admin.register(SearchRun)
class SearchRunAdmin(admin.ModelAdmin):
    list_display = ("query", "user", "requested_limit", "returned_count", "affiliate_count", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("query", "user__username")
    readonly_fields = ("created_at",)
