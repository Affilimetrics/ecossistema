from abc import ABC, abstractmethod


class AdsProvider(ABC):
    """Contrato comum para provedores futuros (Meta, Google, TikTok, LinkedIn)."""

    provider_code: str

    @abstractmethod
    def list_ad_accounts(self):
        raise NotImplementedError

    @abstractmethod
    def list_campaigns(self, ad_account_id: str):
        raise NotImplementedError

    @abstractmethod
    def get_insights(self, ad_account_id: str, date_preset: str = "last_30d"):
        raise NotImplementedError
