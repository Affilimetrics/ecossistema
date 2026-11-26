# Afillimetrics / Skallora

O projeto Django principal está em [`aflmain/`](aflmain/).

- Instalação, uso, dependências e histórico: [`aflmain/README.md`](aflmain/README.md)
- Arquitetura geral e reconstrução: [`aflmain/docs/BIBLIA_RECONSTRUCAO.md`](aflmain/docs/BIBLIA_RECONSTRUCAO.md)
- Mapa de integração e operação dos quatro módulos avançados: [`aflmain/docs/INTEGRACAO_FERRAMENTAS_AVANCADAS.md`](aflmain/docs/INTEGRACAO_FERRAMENTAS_AVANCADAS.md)
- Implementação do desktop: [`aflmain/docs/IMPLEMENTACAO_DESKTOP.md`](aflmain/docs/IMPLEMENTACAO_DESKTOP.md)

A área **Avançado** da sidebar contém ferramentas acessíveis separadamente, todas integradas à mesma aplicação Django, sessão, banco e dependências:

- **Tráfego Pago / TPB:** `/trafego-pago/` — integração Meta Ads.
- **LTV Manager:** `/ltv/dashboard/` — aquisições, comissões, coortes e análise de LTV.
- **CPA Manager:** `/cpa/` — campanhas, gastos, cliques, conversões e indicadores de CPA/CPC.
- **ROI Manager:** `/roi/` — investimentos, comissões, despesas e retorno sobre investimento.

A Home apresenta resumos dos quatro módulos por meio dos mesmos serviços de métricas utilizados nas respectivas dashboards. Os domínios financeiros e de tráfego continuam separados: não há atribuição automática entre conversões, aquisições, despesas e comissões.

Após atualizar, faça backup do banco e do `.env`, instale as dependências com `python -m pip install -r requirements.txt` e execute, na pasta `aflmain/`, `python manage.py migrate`, `python manage.py check`, `python manage.py makemigrations --check --dry-run` e `python manage.py test core ads_manager ltv cpa financeiro`.
