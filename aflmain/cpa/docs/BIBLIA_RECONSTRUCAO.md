# BÍBLIA DE RECONSTRUÇÃO — CPA MANAGER

**Documento técnico de referência para manutenção, evolução ou reconstrução.**

## 1. Propósito e limites

CPA Manager é um app Django integrado ao Afillimetrics / Skallora para registro e análise de investimento em mídia, cliques e conversões. Seu núcleo calcula custo por clique (CPC) e custo por aquisição/conversão (CPA), com visão temporal e comparação por campanha.

Esta versão é funcional para registro manual e importação CSV/XLSX. Não possui conectores reais de anúncios ou marketplaces, não autentica contas externas e não sincroniza campanhas automaticamente.

O significado de “aquisição” deve ser interpretado segundo o objetivo da campanha. Pode ser compra, lead, cadastro ou outra conversão configurada. Uma conversão de anúncio não é automaticamente venda aprovada, comissão ou aquisição individual no LTV.

## 2. Arquitetura

- `aflmain/settings.py` e `aflmain/urls.py`: settings/rotas únicos do projeto; não há configuração CPA independente.
- `cpa/models.py`: plataformas, canais, campanhas, registros diários e lotes de importação.
- `cpa/forms.py`: formulários com QuerySets limitados ao usuário.
- `cpa/views.py`: autenticação, CRUD, dashboard, importação, exportação e API versionada.
- `cpa/analytics.py`: agregações de CPC, CPA, taxa de conversão, CTR e séries diárias.
- `cpa/services/importer.py`: parser CSV/XLSX, normalização, aliases e validação por linha.
- `cpa/templates/cpa/`: interface Django Templates isolada por prefixo.
- `cpa/static/cpa/css/`: identidade visual em CSS modular (tokens, layout, componentes, dashboard, gráficos, formulários, tabelas e responsividade).
- `cpa/static/cpa/js/`: navegação e gráficos Chart.js.
- `core/templates/core/_sidebar.html`: entrada CPA em **Avançado**; `core/views.home` inclui seu resumo.
- `docs/`: contrato de integração, modelo CSV e esta bíblia.

## 3. Entidades

### 3.1 Platform e Channel

Dimensões próprias por usuário, sem compartilhamento entre contas. O sinal de criação de usuário cadastra plataformas e canais iniciais.

### 3.2 Campaign

Pertence a um usuário. Guarda nome, ID externo do provedor, `integration_key` estável, plataforma, canal, objetivo e rótulo da conversão. A chave de integração é única por usuário quando preenchida. Não use nomes de campanha como IDs de integração. Campanhas são arquivadas por `is_active=False`; o histórico de desempenho vinculado não é apagado pela ação da interface.

### 3.3 PerformanceRecord

Unidade diária agregada por campanha. Contém data, gasto, cliques, conversões, impressões opcionais, origem, ID externo e observação. O ID externo com origem permite reimportação idempotente. Linhas sem ID externo não são deduplicadas por heurística fraca.

### 3.4 ImportBatch

Guarda arquivo, estado, contadores e prévia JSON. O fluxo exige análise e confirmação separadas. A confirmação processa todas as linhas analisadas; a tela apresenta as primeiras 30 por segurança/usabilidade.

### 3.5 IntegrationToken

Credencial de leitura por conta, com nome, prefixo público, hash da chave, data de criação, último uso e revogação. A chave bruta só aparece uma vez no momento de criação.

## 4. Fórmulas

- `CPC = soma(gasto) / soma(cliques)`.
- `CPA = soma(gasto) / soma(conversões)`.
- `Taxa de conversão = soma(conversões) / soma(cliques) × 100`.
- `CTR = soma(cliques) / soma(impressões) × 100`, se houver impressões.

Os rácios são calculados a partir dos totais agregados. Nunca usar média aritmética de CPC/CPA das linhas para representar o período. Se o denominador for zero, o rácio é `None`/`null`, exibido como traço na interface.

Não se calcula ROAS ou lucro nesta versão porque não há receita comercial confirmada no módulo.

## 5. Importação

1. Aceita CSV e XLSX, até 10 MB e 2.000 linhas.
2. CSV tenta UTF-8-SIG, CP1252 e Latin-1; detecta separador entre vírgula, ponto e vírgula e tabulação.
3. Cabeçalhos em português/inglês são normalizados por `ALIASES`.
4. Campos obrigatórios: data, campanha, gasto, cliques e conversões. Cliques/conversões iguais a zero são aceitos, mas não devem ser omitidos no arquivo.
5. Valores monetários brasileiros e internacionais são aceitos.
6. A prévia registra erros individuais; confirmação não grava linhas inválidas.
7. Campanhas e dimensões textuais podem ser criadas durante a confirmação. O campo opcional `objective` aceita `purchase`, `lead`, `signup`, `click` ou `other`; se não vier no arquivo, a campanha recebe `other`, pois não se presume que toda conversão seja compra.
8. Linhas com ID externo são atualizadas quando a origem (`import:<plataforma>`) e o ID coincidem; linhas idênticas são ignoradas. Sem ID externo, cada linha válida é criada.

### Eficiência da importação

Na confirmação do lote, dimensões de plataforma/canal são resolvidas uma vez por nome; campanhas existentes são pré-carregadas por blocos de até 50 nomes com comparação case-insensitive; combinações novas são criadas uma única vez e reutilizadas no cache do lote; IDs externos são pré-carregados por origem em blocos de até 500. Assim, não há consulta de existência por linha. O pré-carregamento, a resolução das dimensões, as gravações e a confirmação do lote ficam na mesma `transaction.atomic`; a propriedade das relações é validada no `save()` dos modelos e a chave `(user, source, external_id)` mantém a reimportação idempotente. Não substituir essas validações por `bulk_create` cego.

## 6. API e integração

`GET /cpa/api/v1/metrics/` retorna métricas agregadas, série diária e dados por campanha. Aceita sessão Django ou token Bearer individual por conta. Os tokens são exibidos uma vez, armazenados como hash e podem ser revogados na tela **Integrações**. A API é somente leitura e o token determina o usuário; não existe parâmetro para selecionar outra conta.

O contrato está em `cpa/docs/CONTRATO_INTEGRACAO_V1.md`. O CPA já está integrado à aplicação principal, à navegação e ao resumo da Home. A sincronização de eventos financeiros/atribuição entre CPA, ROI e LTV ainda exige adaptador, mapeamento de IDs externos e sincronização explícita. Para implantação pública da API, adicionar rate limiting e auditoria avançada. Não compartilhar segredo Django ou banco.

CPA Manager, ROI Manager e LTV Manager mantêm domínios de dados independentes. CPA mede tráfego e conversões informadas; LTV acompanha comissões aprovadas atribuídas. Dados agregados não identificam clientes ou aquisições individuais. É proibido relacionar conversões a aquisições por proximidade de data.

## 7. Segurança e isolamento

- Páginas operacionais exigem autenticação.
- QuerySets filtram por `request.user`.
- Formulários limitam campanhas, plataformas e canais ao usuário.
- Relações cruzadas entre contas são rejeitadas.
- POST usa CSRF; exclusões não usam GET.
- `.env`, `db.sqlite3` e credenciais não devem ir ao Git.
- Não armazenar dados pessoais identificáveis de consumidores.
- A API aceita Bearer token por conta, armazena hash e permite revogação; o token só lê métricas daquela conta. Exigir HTTPS em produção.
- A chave bruta é exibida uma única vez; não registrar tokens em logs, exports ou mensagens de erro.

## 8. Front-end e identidade visual

Paleta base compatível com LTV Manager:

- verde `#018D3E`, `#006B30`, `#004B23`, `#2ECC71`;
- creme `#FDF7E6`;
- vermelho `#E71506`, `#FF4D43`;
- texto `#10251A` e secundário `#65756A`.

CSS carregado em ordem: `variables.css`, `base.css`, `layout.css`, `components.css`, `dashboard.css`, `charts.css`, `forms.css`, `tables.css`, `responsive.css`.

Sidebar desktop de 258 px, glassmorphism verde escuro, header superior translúcido, cards creme translúcidos, fontes Inter, bordas arredondadas, sombras suaves e luzes ambientais verde/vermelha. O vermelho aparece como acento de marca e em cards/curvas, não somente como erro. Chart.js 4.4.8 via CDN apresenta as séries de CPC e CPA; sem dados ou sem denominador, a tela mostra empty state.

## 9. Testes e reconstrução

No projeto integrado, executar os comandos documentados no README principal: `python manage.py check`, `python manage.py makemigrations --check --dry-run` e `python manage.py test cpa core.test_advanced_tools`. Não há script de verificação independente do CPA.

Para reconstruir o ecossistema: usar o único venv e `requirements.txt` em `aflmain/`, copiar o `.env.example` principal para `.env`, executar `manage.py migrate`, validar com `manage.py check` e iniciar o servidor principal. Não criar um projeto Django ou banco separado para CPA.

## 10. Próximas evoluções recomendadas

1. Mapear colunas por provedor e salvar perfis de importação.
2. Adicionar moeda por conta e conversão cambial auditável antes de suportar múltiplas moedas.
3. Adicionar rate limiting e auditoria avançada às chaves Bearer já existentes.
4. Integrar APIs oficiais de anúncios com OAuth, paginação, rate limits e backoff.
5. Receber eventos individuais de conversão quando a fonte oferecer IDs confiáveis.
6. Criar mapeamento explícito de campanhas entre CPA Manager, LTV Manager e projeto principal (ROI Manager/Skallora).
7. Só depois adicionar ROAS/ROI com receita comprovada e regras contábeis explícitas.

## 11. Itens não implementados que não devem ser anunciados como prontos

- Conectores Meta Ads, Google Ads, TikTok Ads ou marketplaces.
- OAuth, webhooks e sincronização automática.
- Rate limiting e auditoria avançada da API.
- Integração automática com LTV Manager.
- Atribuição individual de conversões.
- Moedas múltiplas, ROAS ou lucro líquido.


## 12. Integração no Afillimetrics / Skallora

- App em `INSTALLED_APPS`: `cpa.apps.CpaConfig`.
- Rotas: `/cpa/` e namespace `cpa:`. Login/logout usam as views centrais. Não registrar rotas de cadastro ou logout independentes.
- Migrações: `0001_initial.py` e `0002_seed_existing_users.py`. A segunda migration cria dimensões padrão para usuários já existentes em lotes de até 300 linhas, com `ignore_conflicts`; o signal usa `bulk_create` para novos usuários.
- Resumo da Home: `core.views.home` chama a mesma `build_dashboard_data(user)` do dashboard CPA e conta campanhas `is_active=True`. Não criar tabela agregada/cópia.
- Templates: `cpa/templates/cpa/`; estáticos: `cpa/static/cpa/`. Prefixo fixo `cpa/`.
- URL API final: `/cpa/api/v1/metrics/`. Os testes usam o prefixo integrado.
- `requirements.txt`, settings, banco, build e deploy são os do projeto principal. As dependências necessárias (openpyxl, psycopg, dj-database-url, whitenoise etc.) já existem no arquivo principal; não instalar requirements do projeto isolado em substituição.

### Validação do módulo integrado

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test cpa core.test_advanced_tools
```

As métricas do CPA continuam independentes das despesas do ROI e das comissões/aquisições do LTV. Nenhum vínculo contábil ou de atribuição é presumido.
