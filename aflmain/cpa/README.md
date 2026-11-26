# CPA Manager — módulo integrado ao Afillimetrics / Skallora

O CPA Manager é um aplicativo Django instalado no projeto principal. Ele registra e analisa investimento em mídia, cliques, conversões e impressões, com foco em CPC e CPA. Seu dashboard e o resumo da Home usam a mesma função de agregação e as mesmas tabelas.

> **Não é uma segunda aplicação Django.** Use o `manage.py`, `settings.py`, autenticação, banco de dados, `.env`, `requirements.txt` e deploy do `aflmain`. Não copie `config/`, `manage.py` ou settings do ZIP independente, e não crie outro banco.

## Acesso

Abra **Avançado → CPA Manager** na sidebar do Workspace. A rota principal é `/cpa/`; o dashboard completo oferece campanhas, desempenho diário, importações CSV/XLSX, exportação e chaves de API de leitura. O módulo usa a sessão central (`/login/` e `/logout/`) e não possui cadastro ou login próprios. A interface mantém atalhos para Tráfego Pago, LTV Manager e ROI Manager.

## Funcionalidades

- Cadastro e arquivamento de campanhas, com plataforma, canal, objetivo e identificadores externos.
- Registro manual de desempenho diário: gasto, cliques, conversões e impressões opcionais.
- CPC, CPA, taxa de conversão e CTR, com razões calculadas a partir das somas do período.
- Dashboard com filtro de datas, gráficos por dia, comparação por campanha e registros recentes.
- Importação de CSV/XLSX com análise, prévia, validação por linha e confirmação transacional. O limite de origem é 10 MB e 2.000 linhas.
- Exportação CSV e API somente leitura `GET /cpa/api/v1/metrics/`, com sessão ou Bearer token individual revogável.

## Definições financeiras

- `CPC = gasto total / cliques totais`.
- `CPA = gasto total / conversões totais`.
- `Taxa de conversão = conversões totais / cliques totais × 100`.
- `CTR = cliques totais / impressões totais × 100`, se as impressões estiverem disponíveis.

Não se calcula média simples dos rácios diários. Denominador zero resulta em `—` na interface e `null` na API. Uma conversão pode ser lead, cadastro, compra ou outro objetivo. O CPA consolidado não deve ser interpretado como comissão aprovada nem como aquisição individual do LTV.

## Integração com a Home e demais módulos

A Home chama `cpa.analytics.build_dashboard_data(request.user, include_details=False)`, a mesma função utilizada pela tela `/cpa/` sem esse parâmetro. O resumo mostra gasto, CPA, conversões/cliques e campanhas não arquivadas nos últimos 30 dias / estado atual conforme o respectivo indicador. Os valores não são gravados em tabela-resumo paralela.

CPA, ROI Manager e LTV Manager compartilham identidade de usuário e banco principal, mas mantêm domínios de dados distintos. Não existe sincronização automática de desempenho do CPA com despesas do ROI ou comissões/aquisições do LTV. Não use nomes de campanha ou datas coincidentes como regra de atribuição.

## Segurança e isolamento

Todas as páginas operacionais exigem usuário autenticado. Modelos, formulários, importações, exportações e API filtram ou resolvem dados pelo proprietário. `Campaign.integration_key` é estável por usuário quando preenchida; `external_id` guarda ID externo. Tokens de API são exibidos uma única vez, armazenados como hash, limitados à conta que os emitiu e revogáveis na área **Integrações**. Em produção, a API deve ser consumida por HTTPS.

## Instalação / atualização no ecossistema

Na raiz `aflmain/`, execute as instruções do README principal. Depois de fazer backup do banco e atualizar o código: 

```bash
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py check
python manage.py test cpa
```

As migrations `cpa/0001_initial.py` e `cpa/0002_seed_existing_users.py` criam o esquema e provisionam dimensões padrão de usuários existentes em lotes idempotentes (até 300 linhas por INSERT). O signal cria plataformas/canais para novos usuários com duas inserções em lote. Nenhum comando de instalação independente deve ser executado.

## Arquivos principais

- `cpa/models.py`: campanhas, desempenho, dimensões, lotes e tokens.
- `cpa/analytics.py`: agregações SQL de dashboard.
- `cpa/views.py` e `cpa/urls.py`: telas e API namespaced.
- `cpa/services/importer.py`: parser e validação CSV/XLSX.
- `cpa/migrations/`: esquema e seed idempotente de usuários existentes.
- `cpa/templates/cpa/` e `cpa/static/cpa/`: interface isolada.
- `cpa/tests/`: métricas, isolamento, importação e API.
- `cpa/docs/CONTRATO_INTEGRACAO_V1.md`: contrato de API e limites de atribuição.

## Limites conhecidos

Não há OAuth nem conectores automáticos para Meta Ads, Google Ads, TikTok Ads ou marketplaces. O CPA Manager não sincroniza automaticamente com TPB, ROI ou LTV. Não há atribuição individual de conversões, ROAS, lucro líquido, múltiplas moedas ou rate limiting avançado. A interface assume BRL. Chart.js e Inter são obtidos por CDN.

Documentação técnica: `cpa/docs/BIBLIA_RECONSTRUCAO.md`.
