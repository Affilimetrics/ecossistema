from abc import ABC, abstractmethod

class MarketplaceConnector(ABC):
    """Contrato para conectores oficiais. Nenhum endpoint de marketplace é presumido."""
    marketplace_code = None

    @abstractmethod
    def authenticate(self):
        raise NotImplementedError

    @abstractmethod
    def fetch_commissions(self, since=None):
        raise NotImplementedError

    @abstractmethod
    def normalize_commission(self, payload):
        raise NotImplementedError

    def healthcheck(self):
        return {"configured": False, "message": "Conector ainda não implementado/configurado."}
