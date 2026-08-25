from django.contrib import admin
from .models import Produto, Afiliado, Execucao, Mensagem, Oferta, ConfiguracaoCanal, LogExecucao

for model in (Produto, Afiliado, Execucao, Mensagem, Oferta, ConfiguracaoCanal, LogExecucao):
    admin.site.register(model)

from .models import HistoricoPreco
admin.site.register(HistoricoPreco)
