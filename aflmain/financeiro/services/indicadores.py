from decimal import Decimal
from django.db.models import Sum
from django.db.models.functions import Coalesce
from financeiro.models import Commission, Expense
from .roi import calculate_result, ZERO

def dashboard_metrics(user, start=None, end=None, marketplace=None, campaign=None):
    commissions = Commission.objects.filter(user=user, status="approved")
    pending = Commission.objects.filter(user=user, status="pending")
    expenses = Expense.objects.filter(user=user)
    for qs_name, qs in (("commissions", commissions), ("pending", pending), ("expenses", expenses)):
        if start:
            qs = qs.filter(**({"commission_date__gte": start} if qs_name != "expenses" else {"date__gte": start}))
        if end:
            qs = qs.filter(**({"commission_date__lte": end} if qs_name != "expenses" else {"date__lte": end}))
        if marketplace:
            qs = qs.filter(marketplace_id=marketplace)
        if campaign:
            qs = qs.filter(campaign_id=campaign)
        if qs_name == "commissions": commissions = qs
        elif qs_name == "pending": pending = qs
        else: expenses = qs
    total = lambda qs, field: qs.aggregate(v=Coalesce(Sum(field), Decimal("0.00")))["v"]
    approved_total = total(commissions, "amount")
    pending_total = total(pending, "amount")
    expense_total = total(expenses, "amount")
    result = calculate_result(approved_total, pending_total, expense_total)
    return {
        "result": result,
        "approved": approved_total,
        "pending": pending_total,
        "investment": expense_total,
        "profit": result.profit,
        "roi": result.roi,
    }
