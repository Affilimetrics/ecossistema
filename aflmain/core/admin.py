from django.contrib import admin
from .models import Produto, Afiliado, Execucao, Mensagem, Oferta, ConfiguracaoCanal, LogExecucao, ConfiguracaoAutomacao, TemplateOferta, AlertaSistema, ProdutoQuente

for model in (Produto, Afiliado, Execucao, Mensagem, Oferta, ConfiguracaoCanal, LogExecucao, ConfiguracaoAutomacao, TemplateOferta, AlertaSistema, ProdutoQuente):
    admin.site.register(model)

from .models import HistoricoPreco
admin.site.register(HistoricoPreco)
