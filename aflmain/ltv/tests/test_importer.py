from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, TestCase
from django.utils import timezone

from ltv.models import (
    Acquisition, Campaign, Commission, ImportBatch, Marketplace, Product,
)
from ltv.services.importer import (
    _get_related, _parse_money, commit_import, preview_import,
)


User = get_user_model()


class ImportPreviewTests(SimpleTestCase):
    def test_csv_preview_normalizes_brazilian_amount_and_status(self):
        content = (
            "id_externo;valor;data_venda;status\n"
            "abc-01;R$ 1.234,56;17/11/2026;aprovada\n"
        ).encode("utf-8")
        uploaded = SimpleUploadedFile("comissoes.csv", content, content_type="text/csv")
        rows = preview_import(uploaded)
        self.assertEqual(rows[0]["amount"], "1234.56")
        self.assertEqual(rows[0]["status"], "approved")
        self.assertEqual(rows[0]["errors"], [])

    def test_non_finite_money_is_rejected(self):
        with self.assertRaises(ValueError):
            _parse_money("NaN")


class ImportCommitTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="import-user", password="SafePassword123!")
        self.marketplace = Marketplace.objects.get(user=self.user, code="magalu")
        self.acquisition = Acquisition.objects.create(
            user=self.user, external_reference="ref-100",
            acquired_at=timezone.now() - timedelta(days=1),
        )

    def _batch(self, status, filename):
        sale_date = timezone.now() - timedelta(hours=5)
        return ImportBatch.objects.create(
            user=self.user, filename=filename, preview_json=[{
                "errors": [], "external_id": "order-100", "amount": "8.50",
                "sale_date": sale_date.isoformat(), "approved_at": "",
                "status": status, "marketplace": "Magalu",
                "product": "Produto A", "campaign": "Campanha A",
                "channel": "Telegram", "acquisition_external_id": "ref-100",
                "attribution_evidence": "tracking ref-100", "notes": "",
            }],
        )

    def test_reimport_updates_existing_commission_and_reuses_dimensions(self):
        first = self._batch("pending", "a.csv")
        result_one = commit_import(first, self.user)
        self.assertEqual(result_one["imported"], 1)
        self.assertEqual(Commission.objects.filter(user=self.user).count(), 1)

        second = self._batch("approved", "b.csv")
        result_two = commit_import(second, self.user)
        commission = Commission.objects.get(user=self.user, external_id="order-100")
        self.assertEqual(result_two["updated"], 1)
        self.assertEqual(commission.status, "approved")
        self.assertEqual(commission.acquisition_id, self.acquisition.pk)
        self.assertEqual(Product.objects.filter(user=self.user, name="Produto A").count(), 1)
        self.assertEqual(Campaign.objects.filter(user=self.user, name="Campanha A").count(), 1)
