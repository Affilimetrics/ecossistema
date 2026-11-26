# LTV Manager — módulo integrado ao Afillimetrics / Skallora

O LTV Manager foi incorporado ao projeto Django principal. Ele **não deve ser instalado como uma segunda aplicação** nem iniciado com outro `manage.py`: compartilha a autenticação, o banco configurado e o ciclo de deploy do Afillimetrics / Skallora.

A documentação geral de instalação e operação do ecossistema está em [`../../README.md`](../../README.md). A especificação técnica e de reconstrução do módulo está em [`../BIBLIA_RECONSTRUCAO.md`](../BIBLIA_RECONSTRUCAO.md).

## Acesso e navegação

- Home operacional do ecossistema: `/home/`.
- Entrada do LTV Manager: **Avançado → LTV Manager**, rota `/ltv/dashboard/`.
- Tráfego Pago (TPB): **Avançado → Tráfego Pago**, rota `/trafego-pago/`.
- CPA Manager: **Avançado → CPA Manager**, rota `/cpa/`.
- ROI Manager: **Avançado → ROI Manager**, rota `/roi/`.
- Login e logout: os mesmos endpoints do ecossistema (`/login/` e `/logout/`).

O LTV mantém sua navegação interna para dashboard, análise, coortes, aquisições, comissões, marketplaces, produtos, campanhas, canais, importações, automações e relatórios. O link “Voltar ao Workspace Skallora” retorna à Home principal; a navegação lateral inclui links para as outras ferramentas avançadas.

## O que o módulo faz

- Registra aquisições, comissões, produtos, campanhas, canais e marketplaces.
- Separa comissões aprovadas, pendentes, canceladas, reembolsadas e revertidas.
- Calcula LTV observado usando apenas comissões aprovadas e atribuídas a aquisições.
- Compara resultados por produto, campanha, canal e marketplace.
- Calcula coortes nos horizontes D7, D30, D60, D90, D180 e D365.
- Apresenta projeção experimental apenas quando a amostra é suficiente; a projeção não é promessa de receita.
- Importa CSV/XLSX com prévia, validação por linha e confirmação antes da gravação.
- Deduplica registros importados quando existe identificador externo e origem, preservando o histórico de atribuição.
- Exporta comissões em CSV e gera snapshots de manutenção.

**Limite atual:** o módulo é uma ferramenta de registro, importação e análise. Conectores que busquem pedidos/comissões automaticamente em Magalu, Mercado Livre, Amazon ou Shopee não estão implementados nesta versão. Não interpretar as dimensões de marketplace como uma conexão ativa de API.

## Dados compartilhados com a Home

A Home principal exibe um resumo do LTV médio, comissões aprovadas, aquisições e comissões pendentes. O resumo não possui tabela, cache ou fórmula paralela: ele usa `ltv.analytics.metrics.dashboard_metrics(request.user)`, a mesma função chamada pela dashboard completa `/ltv/dashboard/`.

Os dados pertencem ao usuário autenticado. Todos os registros operacionais são filtrados por `user`; formulários limitam as relações ao proprietário e views de edição/exclusão verificam o mesmo vínculo. A instalação inicial também cria dimensões padrão para usuários já existentes por meio da migration `0002_seed_existing_users`.

## Instalação e atualização

Na pasta `aflmain/`, use o único ambiente Python e o único arquivo `requirements.txt` do ecossistema:

```powershell
python -m pip install -r requirements.txt
python manage.py check
python manage.py migrate
python manage.py collectstatic --noinput
```

Não execute `ltv_manager/manage.py`, não crie outro `.env`, banco, usuário, serviço web ou autenticação. A aplicação independente de origem foi usada apenas como fonte do código do módulo; `config/`, `manage.py`, login/cadastro próprios e configurações independentes não foram incorporados.

## Operação e automação

A rotina analítica pode ser executada uma vez:

```powershell
python manage.py run_automations --once
```

Ou permanecer ativa em um processo separado (somente quando desejado). O valor padrão também pode ser configurado por `AUTOMATION_INTERVAL_SECONDS` no `.env` principal:

```powershell
python manage.py run_automations --loop --interval 900
```

O processo considera apenas usuários que habilitaram a automação na própria área LTV e respeita o intervalo individual. A execução contínua exige processo dedicado e monitorado; não é iniciada automaticamente pelo servidor web. Ela não sincroniza com APIs de marketplaces nesta versão.

## Testes

```powershell
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test core ads_manager ltv cpa financeiro
```

Os testes do LTV cobrem fórmulas de métricas, maturidade de coortes, isolamento por usuário e importação idempotente. Os testes de integração em `core/tests.py` verificam que a Home e o dashboard LTV exibem a mesma métrica e usam a sessão principal.

## Arquivos e referência

- `ltv/models.py`: modelos e relações com usuário.
- `ltv/views.py`: páginas protegidas e operações.
- `ltv/analytics/metrics.py`: métricas, coortes, projeção e alertas.
- `ltv/services/importer.py`: prévia e gravação de CSV/XLSX.
- `ltv/automation/tasks.py`: snapshots e manutenção analítica.
- `ltv/management/commands/run_automations.py`: comando de execução.
- `ltv/migrations/`: esquema e provisionamento de defaults.
- `ltv/templates/ltv/`: telas do módulo.
- `ltv/static/ltv/`: CSS e JavaScript isolados no namespace estático `ltv/`.
- `docs/modelo_importacao_comissoes.csv`: modelo de cabeçalho de importação.
- `docs/INTEGRACOES_EXTERNAS.md`: contrato de extensão para conectores futuros.
