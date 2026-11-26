# Bíblia de Reconstrução — Afillimetrics / Skallora

**Revisão:** 25/11/2026  
**Escopo:** projeto Django principal, Central Magalu, aplicativo desktop e ferramentas avançadas TPB, LTV, CPA e ROI.

Este documento é o mapa de reconstrução do projeto. Ele descreve os limites entre módulos, as fontes oficiais de dados, as configurações necessárias e os passos de validação. Em caso de dúvida, o código e as migrations versionadas são a fonte efetiva; não recrie modelos ou rotas apenas a partir de capturas de tela.

## 1. Arquitetura que deve ser preservada

O sistema é uma única aplicação Django (`aflmain`) com uma base de dados compartilhada e autenticação nativa. O desktop conversa com a API Django; TPB, LTV, CPA e ROI são apps internos do mesmo host, sem bancos ou autenticações independentes.

```text
Usuário / navegador
  └── Django auth (/login/)
      ├── Home (/home/)
      │   ├── métricas core / oportunidades
      │   └── resumos TPB, LTV, CPA e ROI (serviços de cada domínio)
      ├── Sidebar → Avançado (seção recolhível)
      │   ├── /trafego-pago/ (ads_manager / TPB)
      │   ├── /ltv/ (ltv / LTV Manager)
      │   ├── /cpa/ (cpa / CPA Manager)
      │   └── /roi/ (financeiro / ROI Manager)
      ├── Core (/core)
      │   ├── produtos, afiliados, ofertas, canais, alertas
      │   └── Central Magalu (Selenium)
      └── API Desktop (/api/desktop/)
          └── Cliente Windows PySide6
```

**Não fazer:** criar outro projeto Django, copiar `config/settings.py` do ZIP TPB, adicionar um banco separado para anúncios, adicionar cadastro local do TPB ou trocar as rotas do app principal. O módulo TPB é um app instalado no projeto host.

## 2. Regras de integração

1. Um único `AUTH_USER_MODEL` do Django. Toda consulta de TPB deve ser filtrada por `request.user` ou por uma conexão que pertença a esse usuário.
2. Uma única configuração de banco em `aflmain/settings.py`; a origem é `DATABASE_URL` quando definida e SQLite local quando não.
3. Uma única sidebar (`core/templates/core/_sidebar.html`). O botão **Avançado** revela Tráfego Pago, LTV Manager, CPA Manager e ROI Manager; o estado de expansão é salvo no `localStorage` pelo `core/static/core/dashboard-ui.js`.
4. As rotas TPB ficam no namespace `ads_manager:` e no prefixo `/trafego-pago/`. Isso evita colisões com `core:dashboard`/`dashboard` e mantém a rota antiga `/dashboard/` redirecionando para `/home/`.
5. A conexão Meta e as entidades de campanha pertencem exclusivamente ao `ads_manager`; dados de ofertas/afiliados pertencem a `core`. Não misture o campo de campanha sazonal de marketing de afiliados com campanhas de mídia paga.
6. A Home e as telas TPB devem usar `ads_manager.services.campaign_sync.synchronize_campaigns()` e os mesmos modelos. Não duplique sincronização ou faça contagens com fontes distintas.
7. O módulo continua somente leitura até que uma fase específica de escrita na Marketing API seja desenhada, protegida por permissões próprias e aprovada.

## 3. Módulos e responsabilidades

### `core/`

Responsável por usuários do Afillimetrics, perfil, produtos, links afiliados, execução dos coletores, ofertas, templates, publicação, alertas e API desktop. A página principal é `views.home` (`/home/`). O coletor Magalu permanece sob `magalu_bot/` e não deve ser acoplado à API de anúncios.

### `ads_manager/`

Origem: ZIP `TPB---Ferramenta-isolada-by-Scallora-main` recebido para esta integração. Responsabilidades:

- `models.py`: `ConnectedAccount`, `AdAccount` e `Campaign`;
- `views.py`: OAuth, seleção de conta, ativos, campanhas, Insights e desconexão;
- `services/meta.py`: cliente HTTP Graph/Marketing API e troca OAuth;
- `services/encryption.py`: criptografia/descriptografia de token Meta;
- `services/campaign_sync.py`: sincronização compartilhada, com janela de 10 minutos;
- `providers/`: contrato `AdsProvider` e provider Meta;
- `templates/ads_manager/`: páginas do módulo;
- `static/ads_manager/css/app.css`: CSS importado da ferramenta.

O `config/`, `manage.py`, settings, urls, autenticação e templates de signup independentes do ZIP TPB não fazem parte da integração final.

### `cpa/`

CPA Manager: campanhas, dimensões, métricas de mídia, importações e API somente leitura. Autenticação central; namespace `cpa`; resumo Home por `cpa.analytics.build_dashboard_data`.

### `financeiro/`

ROI Manager: investimentos, comissões, produtos, campanhas, auditoria e automações locais. Namespace `roi`; resumo Home pela função `financeiro.services.indicadores.dashboard_metrics`.

### Desktop

`desktop_app/` continua sendo cliente PySide6 da API Django. A integração TPB não altera o ciclo de build do executável, nem o contrato atual das rotas `/api/desktop/`.

## 4. Fonte única de campanhas e sincronização

O vínculo dos dados é:

```text
User Django
  └── ConnectedAccount (provider=META)
      └── AdAccount
          └── Campaign
```

A conta selecionada fica em `request.session["selected_ad_account_id"]`. Sempre filtre a conta pelo `ConnectedAccount` do usuário da sessão; nunca aceite apenas um ID POST sem validar o proprietário.

`AdAccount.last_campaign_sync_at` controla a janela de sincronização. Home e visão geral do TPB reutilizam dados sincronizados nos 10 minutos anteriores. A tela `/trafego-pago/campanhas/` força uma nova consulta e persiste o resultado antes de renderizar. O serviço só grava os resultados quando a consulta remota termina com sucesso; falhas mantêm o último snapshot disponível.

A sincronização atualiza/cria campanhas pelo par `(ad_account, external_id)` e reconcilia as campanhas retornadas para remover itens que não aparecem mais na consulta concluída. A paginação da consulta de campanhas admite até 100 páginas; se ainda houver uma próxima página, o cliente interrompe a operação com erro antes de gravar qualquer alteração. Assim, uma resposta truncada não é confundida com uma lista completa e não apaga campanhas que ficaram em páginas não consultadas. Em falhas HTTP, token inválido ou paginação incompleta, o último snapshot persistido permanece intacto. `Campaign` é a mesma fonte para:

- resumo da Home;
- resumo da visão geral TPB;
- listagem completa de campanhas.

Campanha ativa: `effective_status` igual a `ACTIVE`. `status` é fallback somente quando `effective_status` vem vazio. Não classifique `PAUSED`, `ARCHIVED`, `DELETED` ou `DISAPPROVED` como ativa por ter `status=ACTIVE` se a Meta enviou um `effective_status` diferente.

## 5. Mapa de URLs

| Nome reversível | Método(s) | URL |
|---|---|---|
| `ads_manager:dashboard` | GET | `/trafego-pago/` |
| `ads_manager:connect_meta` | GET | `/trafego-pago/auth/meta/connect/` |
| `ads_manager:meta_callback` | GET | `/trafego-pago/auth/meta/callback/` |
| `ads_manager:assets` | GET | `/trafego-pago/ativos/` |
| `ads_manager:select_account` | POST | `/trafego-pago/contas/selecionar/` |
| `ads_manager:campaigns` | GET | `/trafego-pago/campanhas/` |
| `ads_manager:insights` | GET | `/trafego-pago/metricas/` |
| `ads_manager:disconnect_meta` | POST | `/trafego-pago/auth/meta/desconectar/` |

Autenticação: todas as páginas são protegidas por `login_required` e usam `LOGIN_URL = '/login/'`. Não adicionar um login TPB separado.

## 6. Variáveis de ambiente e gestão de chaves

### Django / armazenamento

- `SECRET_KEY`: assinatura de sessão e `django.core.signing`;
- `DATABASE_URL`: PostgreSQL no deploy; SQLite local se omitida;
- `CREDENTIAL_ENCRYPTION_KEY`: segredo existente do `core` para credenciais de Telegram/WhatsApp;
- `TOKEN_ENCRYPTION_KEY`: chave Fernet exclusiva para tokens Meta;
- `ALLOWED_HOSTS`, `CSRF_TRUSTED_ORIGINS`, `DEBUG`, `TIME_ZONE`: ambiente principal.

### Meta Ads

- `META_APP_ID`;
- `META_APP_SECRET`;
- `META_REDIRECT_URI`;
- `META_API_VERSION` (padrão entregue: `v25.0`);
- `META_SCOPES` (padrão: `ads_read,business_management,pages_show_list,pages_read_engagement,instagram_basic`);
- `META_APPSECRET_PROOF`.

A URI callback local é `http://127.0.0.1:8000/trafego-pago/auth/meta/callback/`. A URI de produção deve ser HTTPS e exatamente igual à cadastrada em Meta for Developers. OAuth e permissões são determinados pela Meta; um escopo solicitado não garante que o ativo esteja visível.

Gere a chave de tokens com:

```powershell
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Não derive `TOKEN_ENCRYPTION_KEY` da chave Django e não use a chave `CREDENTIAL_ENCRYPTION_KEY` por conveniência. Guarde a chave Fernet de maneira durável. Perder a chave impede descriptografar tokens já persistidos. Não registre tokens, secrets, `appsecret_proof` ou query strings OAuth em logs.

O `.env.example` contém placeholders. O `.env` nunca deve ser versionado. No Render, as variáveis de segredo são `sync: false` e devem ser configuradas no painel do serviço.

## 7. Dependências

O único arquivo de instalação do servidor é `requirements.txt` na pasta `aflmain/`. Ele agrega as dependências originais do projeto e as necessárias ao TPB: Requests `>=2.32,<3`, Cryptography `>=44,<47`, `dj-database-url >=2.3,<3` e Psycopg 3 para PostgreSQL. Não substitua pelo requirements do ZIP TPB (ele também declara Django e configurações de projeto próprias).

Desktop mantém o `desktop_app/requirements.txt` separado porque é um executável PySide6.

## 8. Banco e migrations

Migrations devem ser versionadas, nunca recriadas em produção manualmente.

- `core/`: migrations `0001` a `0009` existentes;
- `ads_manager/0001_initial.py`: tabelas da conexão, contas e campanhas;
- `ads_manager/0002_adaccount_last_campaign_sync_at.py`: controle de sincronização por conta.
- `ltv/`: migrations `0001_initial.py` e `0002_seed_existing_users.py`.
- `cpa/`: migrations `0001_initial.py` e `0002_seed_existing_users.py`.
- `financeiro/`: migration `0001_initial.py`.

Em banco existente:

1. fazer backup;
2. atualizar código e dependências;
3. executar `python manage.py migrate`;
4. validar `python manage.py showmigrations`.

Não apagar o banco, não executar `flush` e não usar `--run-syncdb` como solução de falha de migration.

## 9. Reconstrução local (Windows PowerShell)

Na pasta `aflmain/`:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edite `.env`: defina `SECRET_KEY`, `CREDENTIAL_ENCRYPTION_KEY` e `TOKEN_ENCRYPTION_KEY`; para conectar a Meta, defina também `META_APP_ID`, `META_APP_SECRET` e `META_REDIRECT_URI`. Em seguida:

```powershell
python manage.py check
python manage.py migrate
python manage.py test core ads_manager ltv cpa financeiro
python manage.py runserver
```

Acesse `http://127.0.0.1:8000/`, entre/cadastre uma conta Afillimetrics e abra **Avançado → Tráfego Pago**. Sem as credenciais Meta configuradas, o app principal deve continuar iniciando normalmente; apenas a ação OAuth mostrará a configuração ausente.

## 10. Deploy Render

O `render.yaml` preserva o serviço web e inclui as variáveis do Meta. O `build.sh` continua responsável por instalar dependências, coletar estáticos e aplicar migrations. No painel Render, defina `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI`, `TOKEN_ENCRYPTION_KEY`, `DATABASE_URL`, `CSRF_TRUSTED_ORIGINS` e demais segredos existentes. Cadastre a mesma URI HTTPS em Meta for Developers.

A atualização de campanhas é síncrona no request e usa timeout HTTP do cliente Meta. Não há worker Celery, scheduler ou sincronização em background nesta versão.

## 11. Testes de integridade

O executor oficial é o Django nativo (`TestCase`/`unittest`), já utilizado pelo repositório. Após qualquer alteração em modelo, rota, formulário ou integração, execute:

```bat
python manage.py check
python manage.py makemigrations --check --dry-run
run_tests.cmd all
```

As suítes existentes para Core, API Desktop, Magalu, TPB, LTV, CPA, ROI e parser Desktop estão catalogadas em `docs/TESTES.md`. O documento contém comandos isolados por módulo, o comando completo com rótulos explícitos (incluindo pacotes fora de `INSTALLED_APPS`), exemplos para executar um único caso e a matriz de rastreabilidade alteração → teste. `python manage.py test` sem rótulos realiza somente a descoberta padrão dos apps instalados. Para executar todas as suítes catalogadas em Windows sem usar o banco operacional, execute `run_tests.cmd all`; para um teste isolado, passe a classe, como `run_tests.cmd core.test_profile.ProfileTests`. Toda nova funcionalidade deve acrescentar um teste executável e atualizar essa matriz.

Em desenvolvimento (`DEBUG=True`), um usuário `is_staff=True` pode abrir `/desenvolvimento/testes/` e disparar as suítes pela interface. Cada execução é um processo Django separado que usa um arquivo SQLite temporário descartado ao final; a página não aceita nomes arbitrários de testes e não é exposta em produção. O CMD/PowerShell continua sendo o meio recomendado para automação contínua e integração contínua.

Os testes do TPB cobrem autenticação compartilhada, bloqueio de acesso a conta de outro usuário, criptografia e a presença da mesma campanha na Home, na visão geral TPB e na listagem de campanhas. Os outros módulos têm as coberturas específicas descritas em `docs/TESTES.md`; isso não significa cobertura exaustiva de todos os seus fluxos.

Um teste real de OAuth exige aplicativo Meta configurado, callback autorizado, conta de anúncios de teste e permissões concedidas. Testes locais não comprovam aprovação ou disponibilidade de permissões no ambiente externo da Meta.

## 12. Limites conhecidos que não devem ser ocultados

- Meta Ads é somente leitura. Não existem endpoints de escrita, alteração de orçamento ou publicação.
- Tokens expiram; a renovação automática não está implementada.
- Não existem webhooks nem sincronização agendada; o sincronismo ocorre ao acessar as telas.
- A visibilidade dos ativos e campanhas depende das permissões efetivas da Meta.
- A desconexão apaga conexão e dados locais associados; não revoga automaticamente a autorização no painel Meta.
- As métricas são Insights agregados dos últimos 30 dias e dependem do que a API retorna.

## 13. Checklist para futuras reconstruções

- [ ] Preservar `core`, `magalu_bot`, `desktop_app` e migrations existentes.
- [ ] Manter `ads_manager.apps.AdsManagerConfig` em `INSTALLED_APPS`.
- [ ] Manter `/trafego-pago/` antes/ao lado das rotas `core`, com namespace `ads_manager`.
- [ ] Manter `TOKEN_ENCRYPTION_KEY` independente e estável.
- [ ] Aplicar migrations `core` e `ads_manager` sem apagar dados.
- [ ] Não introduzir login ou banco separado para TPB.
- [ ] Manter a navegação Avançado → Tráfego Pago na sidebar global.
- [ ] Manter Home e TPB lendo a mesma tabela `Campaign` via `campaign_sync.py`.
- [ ] Executar `check`, `makemigrations --check` e testes.
- [ ] Validar OAuth com callback registrado, sem supor que permissões solicitadas estejam aprovadas.


## 14. LTV Manager — integração e reconstrução

### 14.1 Princípio arquitetural

`ltv/` é um aplicativo Django do próprio projeto principal. Não copiar novamente `config/`, `manage.py`, settings, WSGI/ASGI, autenticação, cadastro ou banco do ZIP independente. `aflmain/settings.py` registra `ltv.apps.LtvConfig`; `aflmain/urls.py` monta `ltv.urls` sob `/ltv/` com namespace `ltv`. O login é o login principal (`/login/`), e o logout é o endpoint principal (`/logout/`).

O módulo conserva sua navegação interna e sua identidade visual, mas usa uma sessão autenticada única. A tela do LTV oferece retorno explícito ao Workspace Skallora e atalhos ao TPB, CPA e ROI. A sidebar global expõe o LTV dentro do disclosure **Avançado**.

### 14.2 Integração da Home e fonte de dados

`core.views.home` importa `dashboard_metrics` como `ltv_dashboard_metrics` e inclui o resultado em `ltv_metrics`. `core/templates/core/home.html` exibe LTV médio, comissões aprovadas, aquisições e pendências. `ltv.views.dashboard` chama a mesma função para a dashboard completa. O par de telas não deve criar tabelas de resumo próprias, duplicar métricas nem usar cache divergente.

A função está em `ltv/analytics/metrics.py`. As métricas derivam de `Acquisition` e `Commission` filtradas pelo usuário autenticado. LTV médio é comissão aprovada e atribuída dividida pelo total de aquisições cadastradas, conforme a regra do módulo; o total aprovado inclui comissões aprovadas mesmo sem atribuição, enquanto `attributed_total` exclui as não atribuídas. Pendentes permanecem em indicador separado.

### 14.3 Namespace e URL map

Todas as rotas operacionais são prefixadas por `/ltv/` e namespaced. Usar `{% url 'ltv:...' %}`, `reverse('ltv:...')` ou `redirect('ltv:...')` para nomes do módulo. `logout`, `login` e `home` são rotas globais do ecossistema, não do namespace LTV.

| Nome | URL |
|---|---|
| `ltv:dashboard` | `/ltv/dashboard/` |
| `cpa:dashboard` | `/cpa/` |
| `cpa:api_metrics` | `/cpa/api/v1/metrics/` |
| `roi:dashboard` | `/roi/` |
| `ltv:analysis` | `/ltv/analises/` |
| `ltv:cohorts` | `/ltv/coortes/` |
| `ltv:acquisition_list` | `/ltv/aquisicoes/` |
| `ltv:commission_list` | `/ltv/comissoes/` |
| `ltv:marketplaces` | `/ltv/marketplaces/` |
| `ltv:products` | `/ltv/produtos/` |
| `ltv:campaigns` | `/ltv/campanhas/` |
| `ltv:channels` | `/ltv/canais/` |
| `ltv:import` | `/ltv/importacoes/` |
| `ltv:automation` | `/ltv/automacoes/` |
| `ltv:reports` | `/ltv/relatorios/` |
| `ltv:export_commissions` | `/ltv/relatorios/exportar-comissoes/` |
| `ltv:chart_data` | `/ltv/api/graficos/` |

### 14.4 Identidade de usuário e defaults

Não registrar urls independentes de login/cadastro do LTV. O usuário já autenticado no Afillimetrics é a identidade para o módulo. `login_required` usa `LOGIN_URL` principal. `OwnedModel` vincula registros a `AUTH_USER_MODEL`; formulários filtram relações por `user`; views de edição e exclusão fazem lookup simultâneo por ID e `request.user`.

Novos usuários recebem settings de automação e dimensões padrão pelo `ltv/signals.py`. Usuários que já existiam antes da integração recebem defaults pela migration `0002_seed_existing_users.py`. Essa migration precisa permanecer versionada e idempotente (`get_or_create`). Ela não deve excluir ou sobrescrever dimensões personalizadas.

### 14.5 Migrations, estáticos e build

- `ltv/migrations/0001_initial.py`: modelos e índices/constraints.
- `ltv/migrations/0002_seed_existing_users.py`: configuração e dimensões padrão para usuários existentes.
- `ltv/templates/ltv/`: templates de tela; base em `ltv/templates/ltv/base.html`.
- `ltv/static/ltv/css/` e `ltv/static/ltv/js/`: ativos exclusivos do app, referenciados com prefixo `ltv/`.
- `requirements.txt`, `.env`, `manage.py`, `build.sh`, `render.yaml` e configurações Django são exclusivamente os do projeto principal.

O build atual já executa `collectstatic` e `migrate`; não criar um segundo serviço para o módulo. As dependências requeridas já existem no `requirements.txt` principal (`openpyxl`, `dj-database-url`, `psycopg`, `whitenoise` etc.). A variável opcional `AUTOMATION_INTERVAL_SECONDS` define a frequência padrão de verificação do comando de automação (padrão `900` segundos) e consta em `.env.example`.

### 14.6 Automação

Comando compartilhado do projeto:

```powershell
python manage.py run_automations --once
python manage.py run_automations --loop --interval 900
```

O `--loop` deve ser executado em processo dedicado/monitorado; o web worker não o inicia automaticamente. O comando seleciona apenas usuários com `ltv_automation_settings.enabled=True`, respeita o intervalo individual, cria/atualiza snapshot diário e registra `AutomationRun`. A rotina não faz sincronização externa de marketplace.

### 14.7 Validação obrigatória

```powershell
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test core ads_manager ltv cpa financeiro
```

Os testes de integração precisam confirmar que (a) visitante não autenticado é encaminhado para o login principal; (b) a navegação Avançado mantém LTV e TPB distintos; (c) um usuário não lê aquisições/comissões de outro; (d) métricas da Home e de `/ltv/dashboard/` são idênticas para o mesmo usuário; (e) assets estão sob `/static/ltv/`; (f) a importação continua transacional/idempotente.

### 14.8 Limites não negociáveis

Não anunciar conectores de marketplaces como ativos: a entrega contém apenas o contrato-base e importação CSV/XLSX. Não afirmar que a manutenção analítica coleta pedidos automaticamente. A projeção é experimental e depende de tamanho/maturidade de amostra. Não remover registros financeiros fisicamente quando a regra do módulo define marcação como `reversed` e preservação do histórico.


## 15. CPA Manager — reconstrução integrada

`cpa/` é app Django no projeto principal; `cpa.apps.CpaConfig` em `INSTALLED_APPS`, URL prefix `/cpa/`, namespace `cpa`. Não copiar settings, banco, login ou cadastro do ZIP independente. O app usa autenticação principal, modelos por usuário, templates `cpa/templates/cpa/`, assets `cpa/static/cpa/`. `0002_seed_existing_users` cria defaults de platform/channel para usuários existentes em lotes idempotentes; o signal usa `bulk_create` para novos usuários. API: `/cpa/api/v1/metrics/` com sessão/Bearer token. Home e CPA dashboard usam a mesma função `build_dashboard_data`; a Home ativa `include_details=False` e consulta somente totais, enquanto a tela completa agrega por dia/campanha no banco. Testes: `python manage.py test cpa core.test_advanced_tools`. Documentação completa: `cpa/README.md` e `cpa/docs/BIBLIA_RECONSTRUCAO.md`.

## 16. ROI Manager — reconstrução integrada

`financeiro/` é o app ROI, com namespace `/roi/` e `roi:`. Usa sessão, usuário e banco do ecossistema. O schema está em `financeiro/migrations/0001_initial.py`; dimensões são criadas idempotentemente por `ensure_user_defaults`. Templates `financeiro/templates/roi/`, assets `financeiro/static/roi/`. A Home e o dashboard usam `financeiro.services.indicadores.dashboard_metrics`. `ROI_INBOX_DIR` configura pasta base de importações locais; comando `python manage.py executar_automacoes [--loop --interval 900]` roda fora do web worker. Testes: `python manage.py test financeiro core.test_advanced_tools`. Documentação: `financeiro/README.md` e `financeiro/BIBLIA_RECONSTRUCAO.md`.

## 17. Rotas avançadas integradas

Guia consolidado: `docs/INTEGRACAO_FERRAMENTAS_AVANCADAS.md`.


| Ferramenta | Namespace | URL inicial |
|---|---|---|
| Tráfego Pago (TPB) | `ads_manager:` | `/trafego-pago/` |
| LTV Manager | `ltv:` | `/ltv/dashboard/` |
| CPA Manager | `cpa:` | `/cpa/` |
| ROI Manager | `roi:` | `/roi/` |

Os quatro módulos aparecem no disclosure global **Avançado**. As interfaces internas de CPA, LTV e ROI oferecem atalhos entre as ferramentas e retorno ao Workspace. Não adicionar login, cadastro, banco, `manage.py`, servidor ou deploy por módulo.

## 18. Fronteiras entre CPA, ROI e LTV

CPA, ROI e LTV partilham usuário, sessão, banco e processo Django, mas não compartilham automaticamente eventos financeiros. CPA registra campanhas/gastos/cliques/conversões; ROI registra despesas e comissões agregadas para resultado operacional; LTV registra aquisições e comissões com regras de atribuição/lifetime value. Não tratar conversão como comissão ou receita; não copiar linha entre apps sem conciliação e identificadores estáveis. Home agrega via serviços de domínio individuais e não persiste snapshots paralelos.


## 19. Conta, autenticação e perfil — Issue 01 do roadmap

### 19.1 Identidade e autenticação compartilhadas

- O usuário continua sendo o modelo nativo `auth.User`; todos os módulos do ecossistema usam a mesma sessão e o mesmo banco. Não criar autenticação separada para TPB, LTV, CPA, ROI, Magalu ou Desktop.
- O fluxo de cadastro normaliza o e-mail para minúsculas e o utiliza como `username` de login. O identificador `username` possui unicidade no banco do Django; o fluxo de formulário também verifica e-mail duplicado sem diferenciar maiúsculas/minúsculas.
- Novas senhas são gravadas pelo `BCryptSHA256PasswordHasher`, com a dependência `bcrypt`. `PBKDF2PasswordHasher` e `PBKDF2SHA1PasswordHasher` permanecem disponíveis para validar hashes anteriores; não se deve apagar usuários nem resetar senhas na migração. O Django pode atualizar o hash após autenticação bem-sucedida.
- A política configurada exige pelo menos 8 caracteres, um número e um caractere especial. A validação ocorre no servidor; atributos HTML no formulário não são a segurança principal.
- “Lembrar de mim” controla a duração da sessão por 14 dias. A senha não é persistida em cookie, localStorage ou texto puro. Sem a opção, a sessão expira ao fechar o navegador.
- O `next` de login é validado para impedir redirecionamento para domínio externo.

### 19.2 Perfil e dados mantidos

`PerfilUsuario` permanece ligado por `OneToOneField` ao usuário. A migration `core/0010_perfil_usuario_dados_conta.py` acrescenta data de nascimento, telefone, foto, metas mensais de investimento/retorno, lista de plataformas de interesse e nicho. País, estado, cidade e fuso horário existentes foram preservados. O nome e e-mail continuam nos campos do modelo `auth.User`; quando o e-mail muda, `username` é atualizado junto para manter o login por e-mail consistente.

A página `/perfil/` permite editar os dados pessoais e preferências. Uploads são guardados em `MEDIA_ROOT/perfis/`, servidos em desenvolvimento por `/media/`, e a pasta local `media/` não deve ser versionada. A exclusão da conta agenda a remoção do arquivo da foto somente depois do commit da transação. A foto passa pela validação de imagem do Django/Pillow e possui limite de 5 MB. **O `render.yaml` atual não configura disco persistente nem armazenamento de mídia externo**; antes de depender de fotos em produção, configure armazenamento persistente/externo e sua URL pública. Plataformas selecionadas indicam preferência do usuário; não significam que a integração esteja conectada ou disponível.

### 19.3 Exclusão e cascata

A exclusão ocorre somente por POST em `/perfil/excluir/`, exige senha atual e a confirmação literal `EXCLUIR`. O serviço `core/account_deletion.py` remove primeiro registros transacionais de CPA e ROI que referenciam campanhas, produtos ou dimensões protegidas por `on_delete=PROTECT`, depois os produtos ROI que protegem o marketplace; em seguida, a exclusão do usuário aplica os `CASCADE` declarados nos módulos Core, TPB, LTV, CPA e ROI. Relações `SET_NULL`, como `ltv.AttributionHistory.changed_by`, podem preservar o evento histórico sem manter referência ao usuário. A operação não apaga contas externas nem chama endpoints externos para revogar autorizações junto a marketplaces ou plataformas de anúncios.

### 19.4 Testes obrigatórios da conta

As funcionalidades acima possuem classes de teste separadas: `core.test_authentication.RegistrationTests`, `core.test_authentication.LoginTests`, `core.test_profile.ProfileTests` e `core.test_profile.AccountDeletionTests`. Execute cada classe isoladamente pelo CMD/PowerShell, conforme `docs/TESTES.md`, ou escolha a funcionalidade correspondente na página `/desenvolvimento/testes/` (somente staff e `DEBUG=True`). O painel também possui testes de permissão e de isolamento do executor em `core.test_testing_portal` e `core.test_test_runner`.
