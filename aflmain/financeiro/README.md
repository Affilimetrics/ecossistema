# ROI Manager — módulo integrado ao Afillimetrics / Skallora

O ROI Manager registra despesas, comissões, produtos, campanhas e canais de uma operação de afiliados. Calcula investimento total, comissões aprovadas, lucro/prejuízo e ROI. Este módulo está instalado no Django principal como app `financeiro`, com namespace de rotas `roi`.

**Não execute o ZIP independente nem crie settings, usuário, banco ou servidor separado.** O `manage.py`, `aflmain/settings.py`, `.env`, `requirements.txt`, autenticação, banco e deploy oficiais ficam na raiz `aflmain/`.

## Acesso e escopo

Acesse **Avançado → ROI Manager** na sidebar do Workspace, ou `/roi/`. A tela usa o usuário central já autenticado; login e logout são os endpoints principais do ecossistema. As páginas filtram os modelos por `request.user`.

## Funcionalidades preservadas

- Dashboard financeiro com filtros por data e marketplace.
- Investimentos/despesas categorizados, exclusão com registro de auditoria, importação CSV com prévia/confirmar e exportação.
- Comissões com status pendente, aprovada, cancelada ou reembolsada; apenas aprovadas entram na receita realizada.
- Cadastros de produtos, campanhas, marketplaces e canais com relações limitadas ao usuário.
- Despesas recorrentes e central de automação local, com eventos por usuário.
- Importação automática local de CSV por pasta monitorada e hash do arquivo para evitar repetição.

## Cálculo

`ROI (%) = ((comissões aprovadas - investimento total) / investimento total) × 100`. Lucro é `comissões aprovadas - investimento total`. ROI não é calculado quando o investimento é zero. Pendências, cancelamentos e reembolsos não integram a receita realizada. O cálculo usa `Decimal`.

## Relação com CPA e LTV

ROI registra a base financeira agregada para o cálculo de retorno. CPA registra gasto/desempenho de mídia e conversões. LTV mantém atribuição e lifetime value de aquisições/comissões. Os módulos compartilham o usuário e o banco físico, mas não sincronizam dados entre tabelas automaticamente. Não some ou copie uma linha de mídia do CPA para despesas do ROI sem processo de conciliação; não trate conversão de anúncio como comissão aprovada ou aquisição LTV. A Home e o dashboard ROI usam a mesma função `financeiro.services.indicadores.dashboard_metrics`.

## Banco e automação

A migration `financeiro/migrations/0001_initial.py` cria as tabelas. As dimensões padrão ROI são criadas por `ensure_user_defaults(user)` no primeiro acesso às telas que necessitam delas; a função busca dimensões ausentes e usa criação em lote, sem sobrescrever dados personalizados. O diretório padrão da automação é `ROI_INBOX_DIR`, por padrão `aflmain/data/inbox`; cada usuário utiliza uma subpasta pelo ID.

A rotina não inicia junto dos web workers. Para processar uma vez:

```bash
python manage.py executar_automacoes
```

Para manter um processo local ativo:

```bash
python manage.py executar_automacoes --loop --interval 900
```

`--interval` é em segundos; quando omitido/zero, o worker consulta as preferências por usuário e usa intervalo mínimo de cinco minutos. O computador/processo precisa permanecer ativo para automações locais.

## Instalação / atualização

Na raiz `aflmain/`, após backup do banco:

```bash
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test financeiro core.test_advanced_tools
```

Não execute scripts `.bat` do ZIP original nem use o `requirements.txt` independente. O arquivo principal já contém as dependências usadas pelo app (`Django`, `openpyxl`, banco e WhiteNoise); `python-dotenv` não é necessário porque as configurações vêm do projeto principal.

## Arquivos principais

- `financeiro/models.py`, `forms.py`, `views.py`: dados, formulários e páginas.
- `financeiro/services/roi.py`: regra de cálculo; `services/indicadores.py`: agregação.
- `financeiro/services/automacao.py` e `management/commands/executar_automacoes.py`: importação automatizada e despesas recorrentes.
- `financeiro/migrations/`: schema do módulo.
- `financeiro/templates/roi/` e `financeiro/static/roi/`: interface namespaced e assets sem colisões.
- `financeiro/tests/`: cálculos, telas, assets e importação.
- `core/templates/core/home.html`: resumo financeiro na Home.

## Limites conhecidos

Não existem conectores diretos com marketplaces, sincronização automática com CPA/LTV ou atribuição individual de vendas. O importador/worker é local e CSV; não é serviço de nuvem. A operação usa BRL e não faz conversão cambial.

Documentação técnica: `financeiro/BIBLIA_RECONSTRUCAO.md`.
