# Integração das ferramentas avançadas — Afillimetrics / Skallora

## 1. Arquitetura única

O Workspace e as quatro ferramentas avançadas executam como **uma única aplicação Django** (`aflmain`), com o mesmo `manage.py`, settings, autenticação, sessão, banco de dados, requirements e processo web. Nenhum ZIP de módulo deve ser instalado como projeto autônomo. Não copiar outro `config/`, `manage.py`, settings, banco SQLite, login/cadastro ou configuração de deploy.

## 2. Registro e endereços

| Ferramenta | App Django | Namespace | URL inicial | Autenticação |
|---|---|---|---|---|
| Tráfego Pago / TPB | `ads_manager` | `ads_manager:` | `/trafego-pago/` | login central |
| LTV Manager | `ltv` | `ltv:` | `/ltv/dashboard/` | login central |
| CPA Manager | `cpa` | `cpa:` | `/cpa/` | login central |
| ROI Manager | `financeiro` | `roi:` | `/roi/` | login central |

Os quatro destinos aparecem na seção recolhível **Avançado** de `core/templates/core/_sidebar.html`. CPA, LTV e ROI também incluem navegação entre os outros módulos e retorno ao Workspace. Referencie rotas com seus namespaces; `home`, `login` e `logout` continuam sendo nomes globais.

## 3. Home e fonte de verdade

A Home não cria tabelas de resumo nem mantém cópias independentes dos indicadores:

- **TPB:** usa as mesmas entidades e a sincronização/cache compartilhados pelo módulo de tráfego pago para a conta selecionada.
- **LTV:** chama `ltv.analytics.metrics.dashboard_metrics` (alias `ltv_dashboard_metrics`).
- **CPA:** chama `cpa.analytics.build_dashboard_data` (alias `cpa_build_dashboard_data`), com período padrão de 30 dias e `include_details=False`; assim a Home consulta só os totais, enquanto o painel usa a mesma função com séries e campanhas detalhadas.
- **ROI:** chama `financeiro.services.indicadores.dashboard_metrics` (alias `roi_dashboard_metrics`), no histórico completo sem filtros; a dashboard ROI usa a mesma função com filtros opcionais.

Cada app continua dono dos seus próprios modelos e regras. Não converter clique/conversão CPA em comissão, não criar aquisição LTV a partir de evento agregado, nem duplicar despesas/comissões ROI. Integrações futuras exigem IDs externos estáveis, mapeamento explícito, regra contábil/atribuição e logs auditáveis.

## 4. Dados, autenticação e isolamento

Todos os modelos de negócio dos módulos estão associados ao usuário do Django. Views protegem páginas com `login_required`; listagens e operações por ID filtram por `request.user`; formulários limitam relações ao mesmo proprietário. O CPA também suporta API de leitura com Bearer token por usuário, armazenado em hash e revogável. Não expor tokens brutos em logs. Não criar users/tenants paralelos.

## 5. Migrations, defaults e banco

- TPB e LTV mantêm suas migrations existentes; não recriar migrations nem apagar o banco.
- CPA: `cpa/migrations/0001_initial.py` cria o esquema e `0002_seed_existing_users.py` provisiona dimensões para usuários existentes em blocos de até 300 linhas, com `ignore_conflicts` idempotente. O signal de novos usuários também usa `bulk_create` em vez de uma sequência de `get_or_create`.
- ROI: `financeiro/migrations/0001_initial.py` cria o esquema. `ensure_user_defaults` cria dimensões padrão ausentes em duas consultas e, se necessário, operações em lote, sem sobrescrever opções personalizadas.
- Aplicar somente `python manage.py migrate` sobre o banco existente, depois de backup.

## 6. Eficiência dos processos

**CPA dashboard:** os totais, a série diária e o agrupamento por campanha são calculados com `SUM`/`GROUP BY` no banco. CPC e CPA são razão entre somas, não média de rácios linha a linha. Na confirmação de importação, dimensões são cacheadas por nome, campanhas existentes são pré-carregadas por blocos de até 50 nomes; combinações novas são criadas uma vez e reutilizadas no cache do lote. IDs externos são pré-carregados em blocos de até 500. A resolução de dimensões, os pré-carregamentos, a gravação dos registros e a confirmação do lote ficam dentro da mesma `transaction.atomic`; a escrita passa pelos `save()` de validação.

**ROI dashboard:** comissões aprovadas, pendentes e despesas são somadas no banco; não carregar toda a base financeira para fazer agregação em Python. Dimensões default são consultadas/criadas em lote para limitar as consultas por requisição.

**Automações:** o processo ROI (`python manage.py executar_automacoes`) e o processo LTV (`python manage.py run_automations`) são comandos separados e opcionais. Não são iniciados pelo web worker, `runserver` nem pela requisição Home. Para `--loop`, usar processo/worker dedicado, monitorado, com filesystem persistente e controle de reinício. Ativar apenas depois de configurar pastas e opções por usuário.

## 7. Arquivos estáticos e dependências

- CPA: `cpa/templates/cpa/`, `cpa/static/cpa/` (prefixo `cpa/`).
- ROI: `financeiro/templates/roi/`, `financeiro/static/roi/` (prefixo `roi/`).
- LTV: `ltv/templates/ltv/`, `ltv/static/ltv/` (prefixo `ltv/`).
- TPB: `ads_manager/` e seus caminhos namespaced.

O `requirements.txt` de `aflmain/` continua sendo o único arquivo de dependências do backend. As libs necessárias de CPA/ROI (Django, `openpyxl`, banco, WhiteNoise) já estavam incluídas. `python-dotenv` dos protótipos standalone não é necessário porque a configuração principal usa `python-decouple`. Fontes e Chart.js podem vir de CDN conforme os templates; isso exige rede no navegador, não pacote Python.

`ROI_INBOX_DIR` é opcional e aponta a pasta raiz de CSV monitorada pelo comando de automação. O padrão no settings é `BASE_DIR/data/inbox`; o `.env.example` contém `data/inbox`. Não apontar a pasta para diretório público estático.

## 8. Rotina recomendada de atualização e validação

Na pasta `aflmain/`, antes da atualização faça backup do banco e do `.env`, substitua o código pelos arquivos versionados e execute:

```bash
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test core ads_manager ltv cpa financeiro
```

A execução da suíte de testes, `check` e `makemigrations --check` precisa ocorrer no ambiente com as dependências do `requirements.txt`. Após validação, iniciar somente o serviço web principal e, quando necessário, os workers de automação específicos. Não executar comandos de setup dos ZIPs originais.

## 9. Limites e recuperação

- Integração de interface e banco compartilhado não implica integração automática de eventos entre CPA, ROI e LTV.
- TPB continua limitado às capacidades descritas na Bíblia TPB (escopo Meta/leitura da API); não afirmar capacidade de escrita ou publicação se não existir endpoint.
- As importações ROI/CPA devem permanecer transacionais e manter prévia/validação; não gravar a prévia antes de confirmação.
- Não apagar migrations, banco ou arquivos do usuário para resolver erro de deploy. Restaurar backup e investigar a migration/constraint responsável.
- Para diagnóstico, consulte também `cpa/docs/BIBLIA_RECONSTRUCAO.md`, `financeiro/BIBLIA_RECONSTRUCAO.md`, `ltv/BIBLIA_RECONSTRUCAO.md` e `docs/BIBLIA_RECONSTRUCAO.md`.

## 10. Relatório de validação desta revisão (25/11/2026)

Validações estáticas concluídas no pacote final:

- 149 arquivos Python analisados com `ast.parse`, sem erro de sintaxe.
- 9 arquivos JavaScript verificados com `node --check`.
- Referências namespaced/global nos templates CPA, ROI e LTV e caminhos estáticos namespaced conferidos.
- Padrões de URL namespaced conferidos: CPA (13), ROI (16), LTV (33) e TPB (8); além de 37 rotas globais do `core`.
- `render.yaml` parseado com sucesso; `requirements.txt` com 13 dependências e sem entradas duplicadas.
- Os ZIPs de origem CPA, ROI e a base integrada anterior passaram em `ZipFile.testzip()`.

**Validação Django pendente no ambiente de implantação:** `python manage.py check`, `makemigrations --check` e a suíte de testes não foram executados porque o ambiente usado para preparar o pacote não possui Django instalado (`ModuleNotFoundError: No module named 'django'`) e não foi possível instalar dependências pela rede. Isso não deve ser interpretado como aprovação runtime. Execute a rotina da seção 8 em ambiente com `requirements.txt` instalado antes de promover para produção.

Nenhuma dependência Python adicional foi necessária: Django, `openpyxl` e demais bibliotecas usadas pelos dois módulos já constam no único `requirements.txt` do projeto host.
