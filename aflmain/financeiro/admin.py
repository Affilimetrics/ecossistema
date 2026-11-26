from django.contrib import admin
from .models import Marketplace, Channel, Product, Campaign, Expense, Commission, FinancialAudit
admin.site.register([Marketplace, Channel, Product, Campaign, Expense, Commission, FinancialAudit])

from .models import AutomationSettings, RecurringExpense, AutomationEvent, ImportedFile
admin.site.register([AutomationSettings, RecurringExpense, AutomationEvent, ImportedFile])
