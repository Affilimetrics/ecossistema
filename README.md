# Afillimetrics / Skallora

O projeto Django principal está em [`aflmain/`](aflmain/).

- Instalação, uso, dependências e histórico: [`aflmain/README.md`](aflmain/README.md)
- Arquitetura geral e reconstrução: [`aflmain/docs/BIBLIA_RECONSTRUCAO.md`](aflmain/docs/BIBLIA_RECONSTRUCAO.md)
- Mapa de integração e operação dos quatro módulos avançados: [`aflmain/docs/INTEGRACAO_FERRAMENTAS_AVANCADAS.md`](aflmain/docs/INTEGRACAO_FERRAMENTAS_AVANCADAS.md)
- Implementação do desktop: [`aflmain/docs/IMPLEMENTACAO_DESKTOP.md`](aflmain/docs/IMPLEMENTACAO_DESKTOP.md)

A sidebar agrupa as ferramentas por finalidade. Em **Avançado** ficam as quatro ferramentas analíticas/de tráfego, todas integradas à mesma aplicação Django, sessão, banco e dependências:

- **Tráfego Pago / TPB:** `/trafego-pago/` — integração Meta Ads.
- **LTV Manager:** `/ltv/dashboard/` — aquisições, comissões, coortes e análise de LTV.
- **CPA Manager:** `/cpa/` — campanhas, gastos, cliques, conversões e indicadores de CPA/CPC.
- **ROI Manager:** `/roi/` — investimentos, comissões, despesas e retorno sobre investimento.

Em **Marketplaces**, a Central Magalu permanece disponível e **Mercado Livre Afiliados** (`/mercado-livre/`) permite pesquisar anúncios pela API, associar URLs oficiais de afiliado e compartilhar o catálogo com Magalu. A Home apresenta resumos dos quatro módulos avançados por meio dos mesmos serviços de métricas utilizados nas respectivas dashboards. Os indicadores de marketplace consolidam Magalu e Mercado Livre a partir de `core.Produto` e `core.Afiliado`. Os domínios financeiros e de tráfego continuam separados: não há atribuição automática entre conversões, aquisições, despesas e comissões.

Após atualizar, faça backup do banco e do `.env`, instale as dependências com `python -m pip install -r requirements.txt` e execute, na pasta `aflmain/`, `python manage.py migrate`, `python manage.py check`, `python manage.py makemigrations --check --dry-run` e `python manage.py test core ads_manager ltv cpa financeiro mercado_livre`.
