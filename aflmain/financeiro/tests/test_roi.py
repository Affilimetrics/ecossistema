from decimal import Decimal
from django.test import SimpleTestCase
from financeiro.services.roi import calculate_result

class ROICalculationTests(SimpleTestCase):
    def test_roi_examples(self):
        cases = [
            ("500","200","150.00"), ("200","200","0.00"),
            ("100","200","-50.00"), ("0","200","-100.00"),
        ]
        for revenue, investment, expected in cases:
            with self.subTest(revenue=revenue, investment=investment):
                result = calculate_result(Decimal(revenue), Decimal("0"), Decimal(investment))
                self.assertEqual(result.roi, Decimal(expected))
    def test_zero_investment_is_not_calculable(self):
        result = calculate_result(Decimal("500"), Decimal("0"), Decimal("0"))
        self.assertIsNone(result.roi)
        self.assertEqual(result.status, "insufficient")
    def test_pending_does_not_change_profit(self):
        result = calculate_result(Decimal("100"), Decimal("900"), Decimal("50"))
        self.assertEqual(result.profit, Decimal("50"))
