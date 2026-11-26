from ads_manager.providers.base import AdsProvider
from ads_manager.services.meta import MetaClient


class MetaAdsProvider(AdsProvider):
    provider_code = "META"

    def __init__(self, access_token: str):
        self.client = MetaClient(access_token)

    def list_ad_accounts(self):
        return self.client.ad_accounts()

    def list_campaigns(self, ad_account_id: str):
        return self.client.campaigns(ad_account_id)

    def get_insights(self, ad_account_id: str, date_preset: str = "last_30d"):
        return self.client.insights(ad_account_id, date_preset)

    def list_businesses(self):
        return self.client.businesses()

    def list_pages(self):
        return self.client.pages()

    def get_profile(self):
        return self.client.me()

    def get_permissions(self):
        return self.client.permissions()
