from django.conf import settings
from django.db import models

from core.fields import EncryptedTextField
from core.models import Produto


class MercadoLivreSettings(models.Model):
    """Configuração do conector do Mercado Livre, isolada por usuário."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mercado_livre_settings",
    )
    access_token = EncryptedTextField(blank=True, default="")
    site_id = models.CharField(max_length=8, default="MLB")
    affiliate_id = models.CharField(max_length=120, blank=True, default="")
    request_timeout = models.PositiveSmallIntegerField(default=20)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Mercado Livre — {self.user}"


class MarketplaceItem(models.Model):
    """Vínculo entre anúncio do ML e Produto do catálogo unificado do ecossistema."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mercado_livre_items",
    )
    product = models.OneToOneField(
        Produto,
        on_delete=models.CASCADE,
        related_name="mercado_livre_data",
    )
    external_id = models.CharField(max_length=64)
    original_url = models.URLField(max_length=2000)
    affiliate_url = models.URLField(max_length=3000, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-updated_at"]
        constraints = [
            models.UniqueConstraint(fields=["user", "external_id"], name="uniq_ml_item_user_external_id"),
            models.UniqueConstraint(fields=["user", "original_url"], name="uniq_ml_item_user_url"),
        ]
        indexes = [models.Index(fields=["user", "-updated_at"], name="ml_item_user_updated_idx")]

    def __str__(self):
        return f"{self.external_id} — {self.product.nome}"


class SearchRun(models.Model):
    STATUS_CHOICES = [
        ("SUCCESS", "Concluída"),
        ("EMPTY", "Sem resultados"),
        ("ERROR", "Erro"),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mercado_livre_searches",
    )
    query = models.CharField(max_length=180)
    requested_limit = models.PositiveSmallIntegerField(default=10)
    returned_count = models.PositiveSmallIntegerField(default=0)
    affiliate_count = models.PositiveSmallIntegerField(default=0)
    status = models.CharField(max_length=12, choices=STATUS_CHOICES, default="SUCCESS", db_index=True)
    error = models.CharField(max_length=1000, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "-created_at"], name="ml_search_user_date_idx")]

    def __str__(self):
        return f"{self.query} ({self.returned_count})"
