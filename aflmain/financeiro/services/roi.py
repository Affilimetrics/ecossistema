from decimal import Decimal
from dataclasses import dataclass

ZERO = Decimal("0.00")

@dataclass(frozen=True)
class FinancialResult:
    commissions: Decimal
    pending: Decimal
    investment: Decimal
    profit: Decimal
    roi: Decimal | None
    status: str

def calculate_result(commissions, pending, investment, break_even_band=Decimal("5")):
    commissions, pending, investment = map(Decimal, (commissions, pending, investment))
    profit = commissions - investment
    roi = ((profit / investment) * Decimal("100")) if investment > 0 else None
    if investment == 0:
        status = "insufficient"
    elif roi < 0:
        status = "negative"
    elif roi <= break_even_band:
        status = "break_even"
    else:
        status = "positive"
    return FinancialResult(commissions, pending, investment, profit, roi, status)
