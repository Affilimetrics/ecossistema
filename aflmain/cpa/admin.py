from django.contrib import admin
from .models import Platform, Channel, Campaign, PerformanceRecord, ImportBatch, IntegrationToken
admin.site.register([Platform, Channel, Campaign, PerformanceRecord, ImportBatch, IntegrationToken])
