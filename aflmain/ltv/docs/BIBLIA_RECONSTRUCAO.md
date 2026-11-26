# BÍBLIA DE RECONSTRUÇÃO — LTV MANAGER (MÓDULO INTEGRADO)

**Documento técnico de referência para manutenção, evolução ou reconstrução do sistema.**

## 1. Propósito e limites

> Este documento descreve o módulo LTV integrado ao projeto Django principal. O `config/`, `manage.py`, `.env`, banco e autenticação do ZIP independente de origem não fazem parte da aplicação final. Todos os comandos devem ser executados na raiz `aflmain/` do ecossistema.

O LTV Manager é um módulo Django integrado ao Afillimetrics / Skallora para mensurar o valor acumulado de comissões atribuídas a aquisições ao longo do tempo. Usa o mesmo banco configurado e o mesmo usuário autenticado do ecossistema.

O sistema não deve ser tratado como sistema de garantia de receita. O indicador observado representa somente dados existentes, aprovados e atribuídos. Pendente não é realizado. Projeção não é faturamento confirmado.

Esta versão implementa CRUD, importação CSV/XLSX, relatórios CSV, cálculos de coorte, uma projeção histórica simplificada, snapshots e automação local. Não implementa conectores reais com marketplaces.

## 2. Arquitetura

### 2.1 Camadas

- **Configuração host (`aflmain/`)**: settings, roteamento, WSGI/ASGI e banco únicos do ecossistema.
- **Persistência (`ltv/models.py`)**: modelos Django, índices, chaves e restrições.
- **Entrada/validação (`ltv/forms.py`)**: formulários com QuerySets limitados ao usuário autenticado.
- **Aplicação HTTP (`ltv/views.py`, `ltv/urls.py`)**: renderização, autenticação, CRUD, importação e exportação.
- **Analytics (`ltv/analytics/metrics.py`)**: agregações, horizontes de LTV, matriz de coortes, projeção e alertas.
- **Serviços (`ltv/services/importer.py`)**: leitura, normalização, pré-validação e gravação transacional dos extratos.
- **Automação (`ltv/automation/tasks.py`)**: snapshot diário e log de execução.
- **Comando de gestão (`ltv/management/commands/run_automations.py`)**: loop local de manutenção, verificando usuários habilitados.
- **Integrações (`ltv/integrations/base.py`)**: contrato abstrato, ainda sem adaptadores de marketplace.
- **Interface (`ltv/templates/ltv/`, `ltv/static/ltv/`)**: Django Templates, CSS modular e JavaScript namespaced.

### 2.2 Princípios arquiteturais

1. Não criar uma segunda aplicação Django, conexão de banco ou autenticação para o LTV.
2. Usar a `DATABASE_URL` e as migrations do projeto principal.
3. Usar `settings.AUTH_USER_MODEL` nas relações de conta.
4. Filtrar todos os registros de operação por `request.user`.
5. Usar `DecimalField` e `Decimal` em valores monetários.
6. Não inferir atribuição pela proximidade de datas.
7. Não transformar comissão pendente em receita aprovada.
8. Não apresentar projeção como resultado observado.
9. Não presumir endpoints de API nem contornar autenticação/termos de marketplaces.
10. Manter migrações versionadas no repositório.

## 3. Entidades e relacionamentos

### 3.1 Marketplace

Representa uma origem de venda: Magalu, Mercado Livre, Amazon, Shopee ou outros. É individual por usuário, com `code` único por conta. O sinal pós-criação de usuário cadastra opções padrão.

### 3.2 Channel

Representa a origem de divulgação: Telegram, WhatsApp, Instagram, TikTok, YouTube, Facebook, site/blog ou outros. É individual por usuário e possui código único por conta.

### 3.3 Product

Produto acompanhado na operação. Pode estar associado a um marketplace. O identificador externo é opcional; nunca presumir identidade de produto apenas pelo texto do nome.

### 3.4 Campaign

Campanha associada opcionalmente a marketplace e canal, com início, fim e status.

### 3.5 Acquisition

É a unidade de atribuição e de coorte. Campos principais:

- `external_reference`: referência pseudonimizada/externa, sem informação pessoal direta.
- `acquired_at`: data-hora de entrada.
- dimensões opcionais: marketplace, produto, campanha e canal.
- `attribution_method`: fonte da evidência.
- `confidence`: percentual de confiança declarado.

A referência externa é única por usuário quando preenchida. Uma aquisição pode existir sem identificação individual de consumidor. Exemplos aceitáveis incluem uma referência de campanha/pedido anonimizada ou um código interno não reversível.

### 3.6 Commission

Registro financeiro da comissão, com ID externo, fonte, valor, data de venda, aprovação, status, dimensões e aquisição opcional.

Status: `pending`, `approved`, `cancelled`, `refunded`, `reversed`.

Uma comissão pode ficar sem aquisição. O vínculo é opcional para não fabricar atribuição. O campo `attribution_evidence` deve explicar por que o vínculo foi feito manualmente. A ação operacional de remoção da comissão marca o status como `reversed` e preserva o registro; não deve ser substituída por exclusão física.

A restrição de unicidade usa usuário + fonte + ID externo quando o ID está preenchido. Na reimportação, o registro existente é atualizado quando status, valor, data ou dimensões mudaram; sem mudanças, a linha é ignorada. Registros sem ID externo não são deduplicados por uma heurística fraca de valor/data.

### 3.7 AttributionHistory

Guarda mudanças de relacionamento entre comissão e aquisição: comissão, aquisição anterior, aquisição nova, motivo, responsável e data. Alterações via formulário e vínculos resolvidos durante importação geram eventos.

### 3.8 ImportBatch

Guarda nome do arquivo, estado, linhas totais, importadas, atualizadas, ignoradas, com erro e prévia JSON. A prévia fica persistida para que a confirmação não dependa de manter o arquivo temporário aberto.

### 3.9 AutomationSettings / AutomationRun

Configuração individual e histórico das rotinas locais. `enabled=False` por padrão. O processo externo só executa usuários que habilitaram o recurso.

### 3.10 LTVSnapshot

Snapshot diário por usuário. A chave única é usuário + data. Os valores são atualizados no dia da execução, sem criar snapshots duplicados para cada ciclo do loop.

## 4. Regras financeiras e fórmulas

### 4.1 LTV observado por aquisição

Para uma aquisição `a` no instante `t0`, o LTV observado no horizonte `H` é:

`LTV(a, H) = soma das comissões aprovadas, atribuídas a a, cuja data de venda esteja entre t0 e t0 + H`.

O modelo não usa o GMV nem o valor bruto do pedido como receita do afiliado.

### 4.2 LTV médio por coorte e horizonte

`LTV médio da coorte em H = total das comissões acumuladas até H das aquisições elegíveis / quantidade de aquisições elegíveis`.

Uma aquisição só é elegível para D30 quando completou 30 dias. Aquisições elegíveis que não tiveram comissões entram como zero no denominador. Aquisições ainda imaturas não entram naquele horizonte.

### 4.3 LTV médio no dashboard

`LTV médio observado = comissões aprovadas e atribuídas / total de aquisições cadastradas`.

O valor é acumulado desde a entrada de cada aquisição até a data da consulta; por isso, coortes mais antigas tiveram mais tempo para gerar comissão. A análise por coorte é necessária para comparar horizontes equivalentes.

### 4.4 Totais

- `approved_total`: todas as comissões aprovadas da conta, mesmo que sem atribuição.
- `attributed_total`: comissões aprovadas com `acquisition` preenchida.
- `pending_total`: comissões pendentes, exibidas separadamente.
- canceladas/reembolsadas/revertidas: não integram LTV aprovado.

### 4.5 Projeção

`build_projection` seleciona a coorte de aquisições mais recente e usa as coortes anteriores como referência. Para cada faixa de idade em janelas de 30 dias, soma comissões aprovadas daquela janela por aquisição madura e calcula a média incremental. Os incrementos são adicionados ao valor observado da coorte alvo.

Condições atuais de amostra:

- ao menos 10 aquisições no histórico;
- ao menos 5 aquisições na base de referência;
- ao menos 2 aquisições na coorte alvo;
- ao menos 5 aquisições de referência maduras em cada janela necessária.

Quando não há amostra suficiente, retorna `available=False` e explica o motivo. O intervalo apresentado é uma aproximação estatística da média, não um intervalo calibrado de previsão individual. Não interpretar como promessa de receita.

## 5. Atribuição e integridade

Prioridade de atribuição futura:

1. identificador externo comprovado;
2. código de tracking ou referência que relacione explicitamente o registro;
3. evidência documental de campanha/canal;
4. atribuição manual com motivo e responsável.

Proibido:

- vincular por data próxima;
- presumir que todo clique representa venda;
- atribuir todas as comissões de uma campanha a uma aquisição;
- inventar ID de cliente;
- substituir pendente por aprovada sem informação da origem.

Durante uma importação, o sistema só relaciona a aquisição quando `acquisition_external_id` corresponde exatamente a `Acquisition.external_reference` dentro da mesma conta. A ausência de correspondência deixa a comissão não atribuída.

## 6. Fluxo de importação

1. Validar extensão e tamanho (10 MB).
2. Ler CSV (UTF-8/CP1252/Latin-1) ou XLSX (openpyxl).
3. Normalizar cabeçalhos com aliases em português/inglês.
4. Exigir valor e data da venda.
5. Converter valor para `Decimal` e data para timezone ativo.
6. Normalizar status.
7. Construir prévia JSON, com erro por linha.
8. Criar `ImportBatch` em estado `preview`.
9. Exibir primeiras 30 linhas para revisão.
10. Na confirmação, executar gravação em `transaction.atomic()`.
11. Criar/recuperar dimensões textuais associadas ao arquivo.
12. Vincular aquisição apenas por referência exata.
13. Atualizar comissão existente quando ID externo e origem coincidirem e os dados mudarem; ignorar quando não houver alteração.
14. Salvar contadores e resumo no lote.

Cabeçalhos mínimos: valor e data da venda. Um modelo vazio de cabeçalhos está em `docs/modelo_importacao_comissoes.csv`. Linhas totalmente vazias são ignoradas; arquivos sem registros úteis são rejeitados. O mapeamento de nomes alternativos está em `ltv/services/importer.py` na constante `ALIASES`.

## 7. Automação atual e extensões

### 7.1 Implementado

- execução manual pelo botão de manutenção;
- execução em loop por comando Django;
- filtro de usuários com automação habilitada;
- respeita intervalo individual por usuário;
- cria ou atualiza snapshot do dia;
- registra início, fim, status, total processado e detalhes;
- permite interromper com `CTRL+C`.

Comando:

`python manage.py run_automations --loop --interval 900`

O processo usa o banco local e não deve ser iniciado em duplicidade sem controle. A rotina depende do Windows ligado e do terminal aberto.

### 7.2 Ainda não implementado

- coleta de pedidos/comissões em marketplace;
- autenticação OAuth ou tokens específicos;
- sincronização incremental com APIs;
- envio de alertas por Telegram, WhatsApp ou e-mail;
- tarefas distribuídas Celery/Redis;
- previsão de coorte por modelo estatístico de sobrevivência.

### 7.3 Como implementar conector real

Estenda `MarketplaceConnector` de `ltv/integrations/base.py`. O conector precisa implementar `authenticate`, `fetch_commissions` e `normalize_commission`. Antes de codificar, obtenha documentação atual e credenciais oficiais. Inclua paginação, rate limits, janelas de sobreposição, retentativas com backoff, idempotência, atualização de status e logs sem segredos.

Não implemente scraping contra barreiras de acesso, autenticação ou termos da plataforma.

## 8. Rotas principais

| Rota | Finalidade |
|---|---|
| `/login/` | Login único do ecossistema |
| `/logout/` | Logout único do ecossistema (POST) |
| `/ltv/dashboard/` | Dashboard LTV |
| `/ltv/aquisicoes/` | Lista de aquisições |
| `/ltv/comissoes/` | Lista de comissões |
| `/ltv/marketplaces/` | Marketplaces |
| `/ltv/produtos/` | Produtos |
| `/ltv/campanhas/` | Campanhas |
| `/ltv/canais/` | Canais |
| `/ltv/analises/` | Análise de LTV e projeção |
| `/ltv/coortes/` | Matriz D7 a D365 |
| `/ltv/importacoes/` | Prévia/confirmar CSV-XLSX |
| `/ltv/automacoes/` | Configuração e histórico |
| `/ltv/relatorios/` | Resumo e exportação |
| `/ltv/relatorios/exportar-comissoes/` | CSV de comissões |
| `/ltv/api/graficos/` | JSON dos gráficos do dashboard |
| `/admin/` | Administração do Django principal |

## 9. Interface e identidade visual

### 9.1 Paleta

- verde principal `#018D3E`;
- verde escuro `#006B30`;
- verde profundo `#004B23`;
- verde vivo `#2ECC71`;
- creme `#FDF7E6`;
- vermelho principal `#E71506`;
- vermelho vivo `#FF4D43`;
- texto escuro `#10251A`;
- texto secundário `#65756A`.

O verde é a identidade dominante. Creme sustenta a área de leitura. Vermelho deve ser uma cor de acento visível, não apenas uma cor de erro: aparece na marca, nos destaques da sidebar, em bordas superiores de cards selecionados, em alertas, ações destrutivas e série de projeção.

### 9.2 Design system CSS

Arquivos carregados pelo `templates/base.html` em ordem:

1. `variables.css` — design tokens.
2. `base.css` — reset, fontes, fundo, textos, mensagens.
3. `layout.css` — app shell, sidebar, header, footer, superfícies glass.
4. `components.css` — botões, badges, painéis, alertas, empty states.
5. `dashboard.css` — KPIs, grids, charts, métricas, painéis específicos.
6. `charts.css` — canvas, áreas vazias e dimensionamento de gráficos.
7. `forms.css` — campos, validações, auth e upload.
8. `tables.css` — tabelas, estados e ações.
9. `responsive.css` — breakpoints e acessibilidade de movimento.

#### Tokens centrais

`--primary`, `--primary-dark`, `--primary-deep`, `--primary-light`, `--cream`, `--danger`, `--danger-light`, `--text-primary`, `--text-secondary`, `--glass-bg`, `--glass-border`, `--radius-*`, `--shadow-*`, `--blur-glass`, `--sidebar-width`, `--header-height` e `--transition-*`.

Não duplicar hexadecimais em dezenas de seletores. Quando uma nova variação for necessária, adicionar token em `variables.css`.

### 9.3 Glassmorphism

`.glass-panel` implementa:

- `background: var(--glass-bg)`;
- `backdrop-filter: blur(var(--blur-glass))`;
- `-webkit-backdrop-filter` para Safari/WebKit;
- borda creme translúcida;
- sombra exterior suave;
- brilho interno com `inset 0 1px`.

`.glass-dark` é a superfície escura para sidebar e destaques, com transparência verde, blur maior e borda branca de baixa opacidade.

Manter contraste de texto. Não usar vidro em campos com baixo contraste ou blur sobre texto pequeno sem superfície opaca suficiente.

### 9.4 Fundo

O `body` usa gradientes radiais verde e vermelho por cima de gradiente linear verde. `.ambient-red` e `.ambient-green` adicionam luzes desfocadas fixas. As camadas decorativas usam `pointer-events:none` e ficam atrás do conteúdo.

### 9.5 Tipografia

Família: Inter. A fonte é carregada pelo Google Fonts no HTML; para operação totalmente offline, deve ser substituída por fonte local licenciada ou sistema sans-serif. Escalas, pesos e tracking devem seguir tokens definidos em `variables.css` e títulos compactos com `letter-spacing` negativo.

### 9.6 Layout

- Sidebar fixa em desktop, 258 px de largura, com painel `glass-dark`.
- Conteúdo principal usa margem equivalente à sidebar.
- Header horizontal com título, indicador local e avatar.
- Dashboard usa grids fluidos, cinco cards KPI em desktop e duas colunas em telas intermediárias.
- Em largura até 900 px, sidebar passa a drawer controlado por `main.js`.
- Em largura até 650 px, grids viram coluna única; formulários passam a uma coluna; tabelas continuam com scroll horizontal.

### 9.7 Vermelho — frequência de uso

A cor `#E71506` não deve ficar restrita a mensagens negativas. Preservar presença de aproximadamente 15%–20% dos acentos cromáticos em telas de análise, balanceando com o verde. Aplicações atuais: borda superior de KPI alternado, ícones vermelhos, rótulos eyebrow-red, marca do logo, destaque do item ativo, alertas, botões destrutivos, badges de atribuição pendente e curva de projeção.

## 10. Templates e componentes de interface

- `base.html`: estrutura autenticada, sidebar, header, mensagens, footer e inclusão de CSS/JS.
- `dashboard.html`: KPIs, alertas, série histórica, distribuição por produto/campanha/canal/marketplace, variação mensal, atividade recente.
- `form_page.html`: formulário padrão de duas colunas, erros e ações.
- `acquisition_list.html`: busca e tabela de aquisição.
- `commission_list.html`: filtros por status, vínculo e ações.
- `resource_list.html`: listagem reutilizável para marketplace/produto/campanha/canal.
- `analysis.html`: gráficos, resumo e projeção.
- `cohorts.html`: tabela D7/D30/D60/D90/D180/D365.
- `import.html`: upload, validação e confirmação.
- `automation.html`: configuração local e histórico de tarefas.
- `reports.html`: resumo e exportações.
- `registration/login.html` e `register.html`: autenticação sem sidebar.

Botões de exclusão usam POST, CSRF e confirmação. Não transformar exclusão em links GET.

## 11. JavaScript e gráficos

- `main.js`: drawer mobile, confirmação de formulários e fechamento de mensagens.
- `charts.js`: consome JSON embutido por `json_script`, inicializa gráficos Chart.js por mês, produto, campanha, canal e marketplace, incluindo barras horizontais com escalas e tooltips monetários corretos, e mostra empty states. Para classificar uma comissão, a dimensão registrada diretamente nela tem prioridade; se estiver vazia, os gráficos usam a dimensão da aquisição vinculada.
- `dashboard.js`: ponto de extensão do dashboard.
- `analysis.js`: série observada/projetada e faixas aproximadas de incerteza.

Chart.js está referenciado por CDN versão 4.4.8. Se a biblioteca não carregar ou a série não possuir dados, o sistema mostra uma mensagem de ausência em vez de gráfico inventado. Para implantação offline, manter o mesmo código e distribuir a biblioteca em `static/vendor/` com licença e versão documentadas.

Nunca montar JavaScript com texto não confiável sem escape. Para dados Django, usar `json_script`, não interpolar dicionários diretamente em `<script>`.

## 12. Segurança e isolamento

- As páginas de negócio usam `login_required`.
- QuerySets das telas são filtrados por `request.user`.
- ModelChoiceField nos formulários usa QuerySets do usuário atual.
- ForeignKey de comissão valida que a aquisição pertence à mesma conta.
- IDs externos são únicos por conta/fonte quando informados.
- Formulários POST usam CSRF.
- As senhas usam o hash do Django.
- Credenciais de implantação ficam no `.env`.
- Não coletar dados pessoais identificáveis de consumidores.
- `.env` e `db.sqlite3` não devem ser commitados.

Em produção, adicionar rate limiting de login, política de backup, rotação de segredo, revisão de dependências e configuração HTTPS/hosts.

## 13. Testes

Localização: `ltv/tests/`.

Cobertura inicial:

- LTV médio usa comissões aprovadas e atribuídas, excluindo pendentes e aprovadas sem atribuição;
- D7 disponível quando a coorte amadureceu e D30 ausente antes da maturidade;
- dashboard exige autenticação principal e carrega CSS namespaced em `/static/ltv/`;
- isolamento de aquisições entre usuários;
- leitura de CSV com valor brasileiro e status localizado.

Executar pela raiz `aflmain/` com `python manage.py test ltv`; o teste `makemigrations --check --dry-run` verifica divergência entre models e migrações.

## 14. Evolução recomendada

Ordem segura de evolução:

1. Adicionar testes de importação XLSX, status de reembolso, atribuição e duplicidade em arquivos reais anonimizados.
2. Separar o importador por perfil de marketplace e permitir mapeamento salvo de colunas.
3. Criar uma tabela de fontes/conectores e credenciais criptografadas, sem guardar segredo em texto claro.
4. Implementar primeiro um conector oficial com documentação, credenciais e ambiente de testes.
5. Adicionar Celery/Redis ou worker apropriado para execução distribuída quando necessário.
6. Acrescentar alertas configuráveis e trilha de auditoria completa.
7. Refinar modelo estatístico somente depois de acumular histórico suficiente.
8. Definir API versionada para integrar ao ROI Manager/Skallora.

## 15. Procedimento de reconstrução

1. Criar/ativar o ambiente Python do ecossistema principal na pasta `aflmain/`.
2. Instalar apenas `aflmain/requirements.txt`.
3. Configurar apenas `aflmain/.env`; opcionalmente definir `AUTOMATION_INTERVAL_SECONDS` (padrão `900`) para a frequência de verificação do processo de automação.
4. Executar `python manage.py migrate`, aplicando `ltv/0001_initial` e `ltv/0002_seed_existing_users`.
5. Usar o login já existente no Afillimetrics; não criar usuário/cadastro em separado para LTV.
6. Validar `python manage.py check`, `python manage.py makemigrations --check --dry-run` e `python manage.py test core ads_manager ltv cpa financeiro`.
7. Conferir os CSS/JS em `/static/ltv/`.
8. Conferir dashboard, CRUD, prévia/importação, coortes, relatórios e exportação sob o prefixo `/ltv/`.
9. Rodar automação com uma conta explicitamente habilitada, em processo dedicado quando usar `--loop`.
10. Só então planejar conectores reais, com credenciais e documentação oficiais.

## 16. Itens não implementados que não devem ser anunciados como prontos

- APIs de afiliados de marketplaces;
- OAuth/autorização de conta de marketplace;
- importação automática por pasta monitorada;
- sync incremental de status com API;
- classificação de vendas baseada em modelos ML;
- alertas por Telegram/WhatsApp/e-mail;
- previsão de churn ou LTV individual por modelo avançado;
- integração de API com ROI Manager/Skallora.

Esses itens são pontos de evolução, não funcionalidades disponíveis no pacote atual.


## 17. Integração ao Afillimetrics / Skallora

### 17.1 Registro do app e navegação

- `aflmain/settings.py` contém `ltv.apps.LtvConfig` em `INSTALLED_APPS` e o context processor do módulo.
- `aflmain/urls.py` monta `ltv.urls` sob `/ltv/` com namespace `ltv`.
- A sidebar global apresenta `Avançado → LTV Manager`, ao lado de `Avançado → Tráfego Pago`.
- A base visual LTV permanece em `ltv/templates/ltv/base.html`; fornece um caminho de retorno ao Workspace Skallora e um link ao TPB.
- Os arquivos estáticos ficam em `ltv/static/ltv/css/` e `ltv/static/ltv/js/`; os templates usam `{% static 'ltv/...' %}` para evitar colisões.

### 17.2 Autenticação compartilhada

Não expor `accounts/login/`, `accounts/register/` ou `accounts/logout/` que existiam na versão de origem. O usuário entra uma vez pelo `/login/`, usa as páginas LTV com `login_required` e sai pelo `/logout/` principal. Acesso anônimo às páginas namespaced deve redirecionar ao login do ecossistema. A aplicação não cria um segundo usuário Django.

### 17.3 Resumo único na Home

`core.views.home` executa `ltv.analytics.metrics.dashboard_metrics(request.user)` e passa o resultado em `ltv_metrics`. A Home exibe LTV médio, comissões aprovadas, aquisições e pendências. `ltv.views.dashboard` executa exatamente a mesma função. Não duplicar nem manter valores em cache diferente entre a Home e o dashboard LTV.

### 17.4 Migrações e provisionamento

`0001_initial.py` cria os modelos LTV. `0002_seed_existing_users.py` provisiona AutomationSettings, cinco marketplaces e oito canais para contas existentes, com `get_or_create` e sem apagar dimensões já configuradas. `ltv/signals.py` executa o provisionamento para novos usuários. Ao atualizar banco já existente, aplicar migration normal; nunca recriar tabelas manualmente ou apagar dados do ecossistema.

### 17.5 Dependências e deploy

Não existe requirements LTV, `.env` LTV ou processo de servidor separado. O `requirements.txt`, `build.sh` e `render.yaml` do Afillimetrics são os únicos caminhos de instalação/deploy. As bibliotecas necessárias para importação e banco (`openpyxl`, `dj-database-url`, `psycopg`, `whitenoise`) já são dependências do projeto principal; `python-dotenv` não é usado pelo módulo integrado. A variável opcional `AUTOMATION_INTERVAL_SECONDS` define a frequência padrão de verificação do comando, com padrão `900`, e já consta em `.env.example`.

### 17.6 Comando de automação no projeto principal

```powershell
python manage.py run_automations --once
python manage.py run_automations --loop --interval 900
```

A manutenção gera snapshots analíticos, não faz coleta automática de pedidos/comissões. `AUTOMATION_INTERVAL_SECONDS` configura a frequência padrão de verificação (`900` segundos por padrão), enquanto `AutomationSettings.interval_seconds` determina a periodicidade individual de cada usuário habilitado. O loop deve ser iniciado em processo dedicado e monitorado e não dentro dos web workers.

### 17.7 Rotas namespaced

Os nomes internos devem sempre incluir o namespace `ltv:` em `reverse`, redirects e templates. Nomes globais como `home`, `login`, `logout` e rotas TPB (`ads_manager:*`) continuam sendo resolvidos no projeto principal. Não reutilizar nomes sem namespace nos templates LTV, pois podem conflitar com `core`.
