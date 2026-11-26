from django.contrib import admin
from .models import (Marketplace, Channel, Product, Campaign, Acquisition, Commission,
                     AttributionHistory, ImportBatch, AutomationSettings, AutomationRun, LTVSnapshot)

@admin.register(Commission)
class CommissionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "external_id", "amount", "status", "sale_date", "acquisition")
    list_filter = ("status", "source", "sale_date")
    search_fields = ("external_id", "user__username", "notes")

@admin.register(Acquisition)
class AcquisitionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "external_reference", "acquired_at", "marketplace", "campaign", "attribution_method")
    list_filter = ("attribution_method", "acquired_at")
    search_fields = ("external_reference", "source")

for model in (Marketplace, Channel, Product, Campaign, AttributionHistory, ImportBatch, AutomationSettings, AutomationRun, LTVSnapshot):
    admin.site.register(model)
