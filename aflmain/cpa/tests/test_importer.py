from decimal import Decimal
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase
from cpa.services.importer import json_safe_rows, parse_decimal, read_rows


class ImporterTests(SimpleTestCase):
    def upload(self, content):
        return SimpleUploadedFile("desempenho.csv", content.encode("utf-8"), content_type="text/csv")

    def test_brazilian_csv_and_objective_are_normalized(self):
        content = (
            "data;campanha;plataforma;gasto;cliques;conversoes;objetivo\n"
            "01/11/2026;Campanha A;Meta Ads;1.234,56;250;5;compra\n"
        )
        row = read_rows(self.upload(content))[0]
        self.assertEqual(row["spend"], Decimal("1234.56"))
        self.assertEqual(row["objective"], "purchase")
        self.assertEqual(row["errors"], [])

    def test_invalid_date_remains_visible_in_preview(self):
        content = "data;campanha;gasto;cliques;conversoes\nsem-data;Campanha;10,00;2;1\n"
        row = read_rows(self.upload(content))[0]
        safe = json_safe_rows([row])[0]
        self.assertEqual(safe["date"], "sem-data")
        self.assertTrue(safe["errors"])

    def test_excel_numeric_decimal_is_not_interpreted_as_thousands(self):
        self.assertEqual(parse_decimal(1.234), Decimal("1.23"))
        self.assertEqual(parse_decimal("1.234"), Decimal("1234.00"))
