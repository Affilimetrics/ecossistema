# Bíblia de Reconstrução — ROI Manager integrado

## 1. Regra arquitetural

ROI Manager é um app Django interno chamado `financeiro`, com namespace público `roi`. A única aplicação de hospedagem e execução é `aflmain`. Não copiar o projeto standalone: nada de segundo `manage.py`, `config/`, settings, WSGI/ASGI, login, database, venv ou deploy. O app usa `AUTH_USER_MODEL`, `login_required` e o banco já configurado no ecossistema.

## 2. Registro e URL map

`aflmain/settings.py` registra `financeiro.apps.FinanceiroConfig`. `aflmain/urls.py` monta `path("roi/", include("financeiro.urls", namespace="roi"))`. Toda referência interna usa `roi:<nome>`. Login/logout são globais (`login`, `logout`); não adicionar cadastro local.

| Nome | URL |
|---|---|
| `roi:dashboard` | `/roi/` |
| `roi:automation` | `/roi/automacao/` |
| `roi:expenses` | `/roi/investimentos/` |
| `roi:expense_create` | `/roi/investimentos/novo/` |
| `roi:import_expenses` | `/roi/investimentos/importar/` |
| `roi:export_expenses` | `/roi/investimentos/exportar/` |
| `roi:commissions` | `/roi/comissoes/` |
| `roi:commission_create` | `/roi/comissoes/nova/` |
| `roi:export_commissions` | `/roi/comissoes/exportar/` |
| `roi:products` | `/roi/produtos/` |
| `roi:product_create` | `/roi/produtos/novo/` |
| `roi:campaigns` | `/roi/campanhas/` |
| `roi:campaign_create` | `/roi/campanhas/nova/` |

## 3. Modelos e regras de propriedade

- `Marketplace`, `Channel`, `Product`, `Campaign`, `Expense`, `Commission`, `FinancialAudit`, `AutomationSettings`, `RecurringExpense`, `AutomationEvent` e `ImportedFile` são modelos do app `financeiro`.
- Todos os registros de negócio pertencem ao usuário pelo campo `user`; formulários filtram campos relacionados pelo proprietário. Views filtram QuerySets e usam `get_object_or_404(..., user=request.user)` em ações por ID.
- `ensure_user_defaults` consulta as dimensões padrão existentes e cria apenas as ausentes em lote (`bulk_create(ignore_conflicts=True)`); não sobrescreve personalizações. A rotina usa duas consultas de leitura, em vez de um `get_or_create` por dimensão, e é chamada nas páginas que precisam das dimensões.
- Formulários atribuem `obj.user=request.user` antes de persistir; relações devem permanecer limitadas ao mesmo usuário. Não remover esse filtro.

## 4. Cálculos

`financeiro/services/roi.py:calculate_result` implementa: `profit = approved_commissions - investment`; `roi = profit / investment × 100`, apenas quando investimento > 0. `pending` permanece indicador independente e não integra lucro ou receita realizada. O status é `insufficient`, `negative`, `break_even` ou `positive` conforme investimento e banda de equilíbrio de 5 pontos percentuais. Use `Decimal` para valores monetários.

`financeiro/services/indicadores.py:dashboard_metrics(user, start, end, marketplace, campaign)` agrega somas no banco, aplicando filtros às três bases. A Home chama a mesma função sem filtros (histórico completo), assim como o dashboard ROI no período default. Não introduzir métrica paralela ou snapshots derivados.

## 5. Importação e auditoria

A tela de investimentos CSV tem duas fases: upload/análise para sessão e confirmação transacional. Verifique limite de tamanho, cabeçalhos, data, valor e categoria antes de gravar. Não gravar na fase de prévia. `FinancialAudit` registra antes da exclusão. Exportações devem manter escopo `user=request.user`.

O processo automático (`financeiro/management/commands/executar_automacoes.py`) pode ler CSV por usuário e criar despesas recorrentes vencidas. `ImportedFile` usa hash SHA-256 por usuário/arquivo para evitar reprocessamento. Os diretórios padrões são `ROI_INBOX_DIR/<user_id>/investimentos` e `.../comissoes`; cada tipo organiza `processados` e `com_erros`. O worker não deve ser iniciado dentro do web worker.

## 6. Configuração, dependências e assets

- `ROI_INBOX_DIR` é opcional e aponta ao diretório raiz de entrada; default `aflmain/data/inbox`. Está no `.env.example` principal.
- Não há variáveis para outro banco, segredo ou app auth.
- O `requirements.txt` oficial continua único. Django, `openpyxl`, `dj-database-url`, `psycopg` e `whitenoise` já são dependências do projeto principal. Não instalar o arquivo de dependências da versão independente por cima do principal.
- Templates: `financeiro/templates/roi/`. O base é `roi/base.html`; todas as rotas internas usam `{% url 'roi:...' %}`.
- Estáticos: `financeiro/static/roi/css/app.css` e `financeiro/static/roi/js/app.js`; referenciar `roi/css/app.css` e `roi/js/app.js`. Não usar os caminhos genéricos `/static/css/` ou `/static/js/`, que poderiam colidir.

## 7. Navegação e Home

A sidebar global em `core/templates/core/_sidebar.html` lista o app como **Avançado → ROI Manager** e mantém o disclosure aberto quando o namespace é `roi`. A base interna fornece caminho de volta ao Workspace e links para TPB, LTV e CPA.

`core.views.home` chama `roi_dashboard_metrics(request.user)`, importado de `financeiro.services.indicadores`. O card em `core/templates/core/home.html` lê `roi_metrics`; o dashboard completo renderiza o retorno da mesma função. Não mover os cálculos para templates nem criar tabela separada para a Home. O resumo é histórico completo e deve ser rotulado como tal.

## 8. Automação

Execução única: `python manage.py executar_automacoes`. Loop: `python manage.py executar_automacoes --loop --interval 900`. O parâmetro está em segundos. Com `--interval=0`, o comando usa preferências por usuário e um mínimo operacional de 5 minutos. O worker faz trabalho local, depende de filesystem persistente e não coleta diretamente de APIs de marketplace.

## 9. Migrations

`financeiro/migrations/0001_initial.py` cria o esquema. Não recriar migrations existentes nem excluir banco para corrigir problemas de UI. Faça backup e execute apenas `python manage.py migrate`. A dimensão default é criada por função idempotente no primeiro uso; não é necessário migration de dados para usuários antigos.

## 10. Testes obrigatórios

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test financeiro core.test_advanced_tools
```

Verificar: autenticação central, todos os links namespaced, isolamento entre usuários, cálculo ROI com zero investimento, importação somente após confirmação, arquivos estáticos em `roi/`, igualdade das métricas Home e dashboard e comando de automação.

## 11. Eficiência e observabilidade

`dashboard_metrics` executa `SUM` no banco para comissões aprovadas, pendentes e despesas; não carrega todas as linhas financeiras para agregá-las em Python. A Home chama essa mesma função sem filtros e o dashboard ROI usa a mesma função com os filtros informados. O comando `executar_automacoes` é um processo explícito e separado: não é iniciado dentro da requisição web nem pelo `runserver`. Configure `ROI_INBOX_DIR` para um diretório persistente e com acesso restrito quando a importação automática por pasta for habilitada. Não apontar a pasta de entrada para uma pasta pública de estáticos.

## 12. Limites que devem ser preservados

- Não presumir venda/comissão a partir de clique/conversão CPA.
- Não copiar automaticamente despesas CPA para ROI ou comissões ROI para LTV.
- Não chamar API de marketplace inexistente.
- Não tratar valor bruto da venda como comissão/receita.
- Não calcular ROI com investimento zero.
- Não colocar automação local dentro do processo web.
