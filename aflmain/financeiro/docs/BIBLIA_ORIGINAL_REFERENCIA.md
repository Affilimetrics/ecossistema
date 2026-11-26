> Documento histórico de origem. Referência preservada para rastreabilidade; não seguir procedimentos de instalação isolada. A arquitetura vigente está em `../BIBLIA_RECONSTRUCAO.md` e `../README.md`.

# Bíblia de Reconstrução — ROI Manager

Documento técnico de referência para reconstruir, manter, revisar ou ampliar o ROI Manager sem perder as decisões de produto, as regras financeiras e a identidade visual. Ele complementa o `README.md`: o README ensina a iniciar e operar; este documento explica como o sistema foi pensado e como deve evoluir.

---

## 1. Identidade e propósito

**Nome:** ROI Manager  
**Domínio:** gestão financeira e análise de retorno de operações de marketing de afiliados.  
**Estado arquitetural:** aplicação Django independente, preparada para futura integração com o ecossistema Skallora, mas sem dependência dele nesta fase.

O sistema não promete lucro nem garante resultado comercial. Seu papel é consolidar dados financeiros confiáveis para que o usuário entenda quanto investiu, quanto recebeu em comissões aprovadas e qual foi o retorno observado.

### Objetivos centrais

1. Registrar investimentos e despesas reais.
2. Registrar comissões com status financeiro.
3. Separar valor de venda/GMV de receita efetiva do afiliado.
4. Calcular ROI e lucro/prejuízo com precisão decimal.
5. Organizar resultados por marketplace, produto, campanha e canal quando a atribuição estiver disponível.
6. Automatizar rotinas repetitivas sem fingir que existe integração de API quando ela não foi implementada.
7. Preservar dados financeiros e trilha de alterações relevantes.

## 2. Princípios que não devem ser quebrados

### 2.1 Verdade financeira

- Receita realizada é a **comissão aprovada**, não o valor total da venda.
- Comissão pendente não pode entrar no cálculo da receita aprovada.
- Comissão cancelada ou reembolsada não pode ser somada como receita realizada.
- Investimento zero torna o ROI não calculável; não substitua o resultado por zero ou infinito.
- Não atribua uma comissão a produto, campanha ou canal sem evidência. Quando não houver evidência, mantenha a associação vazia ou use uma correção manual rastreável.

### 2.2 Precisão monetária

- Use `DecimalField` nos modelos financeiros.
- Use `Decimal` nos serviços e nas importações.
- Não use `float` para somar, subtrair ou dividir valores monetários.
- Não arredonde valores intermediários sem necessidade; arredonde apenas para exibição ou persistência conforme a regra do campo.

### 2.3 Isolamento por usuário

- Toda consulta de negócio deve ser filtrada por `request.user`.
- Todo formulário com ForeignKey ou ManyToMany deve limitar seu `queryset` às entidades do usuário autenticado.
- Um ID recebido por URL ou POST nunca é prova suficiente de propriedade do registro: recupere objetos com `get_object_or_404(..., user=request.user)`.
- Nunca misture dados financeiros de contas diferentes em dashboards, exportações, importações ou relatórios.

### 2.4 Integridade e rastreabilidade

- Evite exclusões silenciosas de registros financeiros.
- Ações destrutivas devem usar POST, proteção CSRF e confirmação no navegador.
- Registre auditoria para operações sensíveis, como exclusões financeiras.
- Use transações atômicas em operações de importação em lote.
- Detecte arquivos importados repetidamente por hash e evite duplicar transações por identificadores de origem, sempre que disponíveis.

## 3. Identidade visual obrigatória

### Paleta

| Token | Cor | Hexadecimal | Aplicação |
|---|---|---|---|
| `--green` | Verde principal | `#018D3E` | Marca, ações principais, navegação e fundo |
| `--cream` | Creme | `#FDF7E6` | Cards, superfícies, textos claros e painéis |
| `--red` | Vermelho | `#E71506` | Alertas, prejuízos, pequenas ênfases e exclusões |
| `--green-dark` | Verde escuro | `#006B30` | Hover, profundidade e variações do verde |
| `--ink` | Verde quase preto | `#173A28` | Texto escuro em superfícies creme |

Não substitua a paleta por azul, roxo, rosa ou tema genérico de dashboard. Vermelho é cor de detalhe e semântica de atenção: não deve dominar o fundo nem ser usado em botões neutros.

### Glassmorphism

O glassmorphism é parte da identidade, não um ornamento ocasional. As superfícies principais devem combinar:

- Fundo translúcido com creme (`rgba(253,247,230,...)`).
- `backdrop-filter: blur(...) saturate(...)` e prefixo `-webkit-backdrop-filter`.
- Borda clara e parcialmente transparente.
- Sombra difusa para separar o painel do fundo verde.
- Cantos arredondados consistentes.

Quando o navegador não suportar `backdrop-filter`, a superfície deve continuar legível por meio de uma opacidade de fundo suficientemente alta.

### Tipografia e composição

- Texto: DM Sans, com fallback Inter/Segoe UI/Arial.
- Títulos: Manrope, com fallback DM Sans/Inter.
- Priorize hierarquia visual, espaços generosos e contraste suficiente.
- Cards com métricas devem apresentar título, valor, contexto e unidade.
- Tabelas precisam de cabeçalho legível, linhas discretas, estado vazio e rolagem horizontal em telas pequenas.
- Formulários devem ter labels explícitos, foco visível, erros de validação e ações claras.

### Responsividade

- Desktop: navegação lateral fixa e área principal deslocada.
- Tablet: reduzir a largura da navegação e adaptar a grade de indicadores.
- Mobile: barra superior com botão de menu; navegação lateral abre como painel; cards viram duas colunas e uma coluna em telas estreitas; tabelas podem rolar horizontalmente.
- Respeite `prefers-reduced-motion`.

### Arquivos de front-end

- `templates/base.html`: layout comum, menu, avisos, inclusão de CSS e JavaScript.
- `static/css/app.css`: tokens, componentes, estados, responsividade e glassmorphism.
- `static/js/app.js`: interações pequenas do layout (menu, fechar avisos, confirmações).

Não coloque regra de negócio no JavaScript visual. O servidor Django continua responsável por autenticação, validação, persistência e cálculo.

## 4. Arquitetura de aplicação

### Stack

- Python 3.11+
- Django 5.2
- SQLite por padrão
- Templates Django
- CSS e JavaScript próprios em `static/`
- `python-dotenv` para variáveis locais

A arquitetura deliberadamente evita adicionar React, Node, Tailwind, serviços externos ou dependências de build para uma aplicação que pode ser apresentada, executada e mantida diretamente com Django.

### Camadas

```text
Navegador
  │
  ├── templates/ + static/css + static/js
  │
Django URLs
  │
  ├── financeiro/views.py       HTTP, autenticação, filtros e formulários
  ├── financeiro/forms.py       validação e querysets limitados ao usuário
  ├── financeiro/models.py      persistência e integridade relacional
  └── financeiro/services/      cálculos e processos reutilizáveis
          ├── roi.py
          ├── indicadores.py
          ├── relatorios.py
          └── automacao.py

SQLite / banco configurado
```

### Responsabilidade dos módulos

| Caminho | Responsabilidade |
|---|---|
| `config/settings.py` | Configuração Django, timezone e arquivos estáticos |
| `config/urls.py` | Rotas globais, autenticação e administração |
| `financeiro/models.py` | Entidades de negócio e constraints |
| `financeiro/forms.py` | Formulários e isolamento de relacionamentos por usuário |
| `financeiro/views.py` | Fluxos HTTP, CRUD, importação e páginas |
| `financeiro/services/roi.py` | Cálculo central do resultado financeiro |
| `financeiro/services/indicadores.py` | Agregações do dashboard |
| `financeiro/services/relatorios.py` | Geração de CSV |
| `financeiro/services/automacao.py` | Ingestão CSV, idempotência e despesas recorrentes |
| `financeiro/management/commands/executar_automacoes.py` | Processo de execução periódica local |
| `financeiro/migrations/` | Histórico versionado do esquema do banco |
| `templates/` | HTML e composição visual |
| `static/` | CSS e JavaScript do front-end |
| `scripts/` | Atalhos de instalação, servidor, automação, backup e teste pelo CMD |

## 5. Modelo de domínio

### Entidades

- **Marketplace:** marketplace vinculado ao usuário.
- **Channel:** canal de divulgação vinculado ao usuário.
- **Product:** produto pertencente ao usuário e associado a um marketplace.
- **Campaign:** campanha que pode referenciar marketplace, canal e múltiplos produtos.
- **Expense:** investimento/despesa com categoria, data, valor e associações opcionais.
- **Commission:** comissão recebida ou esperada, com marketplace, data, status e identificadores de origem.
- **FinancialAudit:** trilha para ações financeiras sensíveis.
- **AutomationSettings:** preferências locais de automação por usuário.
- **RecurringExpense:** regra para gerar despesas recorrentes.
- **AutomationEvent:** histórico das rotinas.
- **ImportedFile:** hash e metadados de arquivos já processados.

### Relacionamentos

```text
User
 ├── Marketplace
 │    └── Product
 ├── Channel
 ├── Campaign ─────── Product (N:N)
 ├── Expense ──────── Marketplace / Product / Campaign / Channel (opcionais)
 ├── Commission ───── Marketplace (obrigatório)
 │                    Product / Campaign / Channel (opcionais)
 ├── AutomationSettings (1:1)
 ├── RecurringExpense
 ├── AutomationEvent
 ├── FinancialAudit
 └── ImportedFile
```

As associações opcionais permanecem opcionais porque uma comissão ou despesa pode não ter atribuição identificável. Nunca inventar a associação para preencher um gráfico.

### Marketplaces e canais iniciais

No cadastro e na primeira abertura do dashboard, `ensure_user_defaults()` garante os marketplaces Magalu, Mercado Livre, Amazon, Shopee e Outros, além dos canais Telegram, WhatsApp, Instagram, TikTok, YouTube, Facebook, Site/Blog e Outros. A operação é idempotente por `get_or_create`; não apaga nem substitui valores personalizados.

Novas opções podem ser criadas pelo Django Admin. Futuramente, uma tela própria de configurações pode permitir CRUD de marketplaces e canais sem administração técnica.

## 6. Regras financeiras e indicadores

### ROI

```text
Lucro operacional = comissões aprovadas - investimento total
ROI (%) = (lucro operacional / investimento total) * 100
```

`financeiro/services/roi.py` é a fonte única dessa regra. Não replique fórmulas diferentes nas views ou templates.

### Semáforo

- `positive`: ROI acima da faixa de equilíbrio.
- `break_even`: ROI de 0% até 5%, inclusive.
- `negative`: ROI abaixo de 0%.
- `insufficient`: investimento igual a zero.

Se a tolerância do ponto de equilíbrio mudar no futuro, faça a mudança no serviço e nos testes, não no template.

### Indicadores condicionais

ROAS, EPC, CPA, conversão e ticket médio só podem ser apresentados quando houver dados necessários e definição inequívoca para numerador e denominador. Não fabrique cliques, impressões, vendas ou conversões com base em comissões.

## 7. Importação, idempotência e automação

### Importação de investimentos pela tela

- Limite de upload atual: 2 MB.
- Decodificação UTF-8 com BOM tolerado.
- Delimitador `;` ou `,`.
- Campos obrigatórios: `descricao`, `valor`, `data`, `categoria`.
- Valide valor positivo, data ISO e categoria conhecida.
- Guarde os registros validados na sessão para uma tela de prévia.
- Só faça `bulk_create` em transação após confirmação explícita.

### Importação automática por diretório

`process_inbox()` monitora duas pastas por usuário:

- `investimentos`: descrição, valor, data e categoria.
- `comissoes`: marketplace e comissão; pedido, transação, data, status e valor da venda são opcionais.

Antes de processar, o serviço calcula SHA-256. O par usuário/hash em `ImportedFile` impede importar o mesmo conteúdo novamente. Arquivos concluídos vão para `processados`; erros vão para `com_erros`, com evento registrado.

### Despesas recorrentes

- Regras semanais, mensais e anuais.
- Só processa regras ativas e vencidas.
- Gera um registro de despesa identificado pela descrição com data.
- Atualiza `last_generated` e a próxima data dentro de uma transação.
- Reexecuções não devem criar duplicatas para o mesmo lançamento.

### Execução local

`executar_automacoes --loop` consulta usuários ativos, lê as preferências de cada usuário e executa rotinas habilitadas. É um processo de computador local, não um worker remoto. Para executar 24/7, será necessário hospedar o projeto e configurar um worker ou agendador adequado.

### Limites explícitos

A ingestão CSV não significa integração oficial com Magalu, Mercado Livre, Amazon ou Shopee. Integrações futuras devem usar APIs autorizadas, credenciais seguras, escopos mínimos, renovação de tokens e logs sem segredos.

## 8. Segurança e privacidade

1. Manter CSRF em todos os formulários POST.
2. Não expor `SECRET_KEY`, tokens, credenciais ou dados sensíveis em logs, templates ou respostas de erro.
3. Em produção: `DEBUG=False`, `SECRET_KEY` forte via ambiente, hosts e origens confiáveis configurados, HTTPS e cookies seguros.
4. Não commitar `.env`, `db.sqlite3`, backups ou dados reais de usuários.
5. Aplicar filtros `user=request.user` a todas as consultas.
6. Limitar querysets de relacionamento nos ModelForms.
7. Validar arquivos antes de persistir e usar transação em lote.
8. Usar POST em exclusões e alterações de estado.
9. Manter backups antes de migrações e releases.
10. Rever permissões e retenção dos dados antes de conectar qualquer marketplace.

## 9. Testes obrigatórios

### ROI

| Comissão aprovada | Investimento | ROI esperado |
|---:|---:|---:|
| 500 | 200 | 150% |
| 200 | 200 | 0% |
| 100 | 200 | -50% |
| 0 | 200 | -100% |
| 500 | 0 | Não calculável |

### Outras verificações

- Comissão pendente, cancelada e reembolsada não contam como receita aprovada.
- Usuários diferentes não acessam registros um do outro.
- Relacionamentos de formulários só exibem objetos do usuário logado.
- Arquivo repetido não gera importação duplicada.
- CSV inválido não deve gravar parte dos dados.
- Prévia de importação só persiste após confirmação.
- Dashboard, listas, formulários e automações retornam HTTP 200 quando autenticados.
- CSS e JavaScript são encontrados pelo staticfiles finder e referenciados com URL absoluta `/static/...`.
- Layout permanece legível no desktop e em telas móveis.

Comandos de verificação:

```cmd
venv\Scripts\python.exe scripts\verificar_frontend.py
venv\Scripts\python.exe manage.py check
venv\Scripts\python.exe manage.py makemigrations --check --dry-run
venv\Scripts\python.exe manage.py test financeiro.tests
```

## 10. Arquivos estáticos e prevenção da tela sem estilo

O carregamento do front-end depende de três decisões que precisam permanecer coerentes:

1. Templates carregam `{% load static %}` e usam `{% static 'css/app.css' %}` e `{% static 'js/app.js' %}`.
2. `STATIC_URL` em `config/settings.py` precisa começar com barra: `/static/`.
3. Durante o desenvolvimento com `runserver`, `DEBUG=True` deve estar ativo para o Django servir os arquivos estáticos.

A configuração já define `STATICFILES_DIRS = [BASE_DIR / "static"]` e `STATIC_ROOT = BASE_DIR / "staticfiles"`. Em produção, executar `collectstatic` e configurar o servidor/web host para servir `STATIC_ROOT`; não depender do servidor de desenvolvimento.

Se a página aparecer sem CSS:

- Abra as ferramentas do navegador (F12) e confira a aba Network/Console.
- Confirme que `GET /static/css/app.css` retorna HTTP 200.
- Confirme que `GET /static/js/app.js` retorna HTTP 200.
- Verifique se `DEBUG=True` no ambiente local.
- Rode `scripts\verificar_frontend.bat`.
- Não corrija o problema apagando o banco de dados.

## 11. Procedimento para reconstruir ou ampliar

### Criar uma nova página

1. Defina a URL em `financeiro/urls.py`.
2. Implemente a view em `financeiro/views.py`, protegendo-a com `@login_required` quando for dado privado.
3. Filtre os registros por `request.user`.
4. Crie o template em `templates/` e estenda `base.html`.
5. Reutilize classes existentes (`page-heading`, `panel`, `form-panel`, `filters`, `table-card`, `metric`, `button`).
6. Não adicione um segundo framework visual; mantenha a identidade e a responsividade.
7. Adicione testes de status HTTP, autenticação e isolamento de dados.

### Criar ou alterar um modelo

1. Atualize `financeiro/models.py` com campos e constraints adequados.
2. Se envolver valores, use `DecimalField` e validadores.
3. Vincule dados do usuário com ForeignKey/OneToOne.
4. Atualize formulários e restrinja querysets por usuário.
5. Atualize views, templates, admin e serviços necessários.
6. Gere uma nova migração com `python manage.py makemigrations financeiro`.
7. Revise o arquivo de migração e rode `python manage.py migrate`.
8. Adicione testes para o novo comportamento e para o isolamento.
9. Nunca reescreva migrações já aplicadas em ambientes com dados reais.

### Criar um indicador

1. Defina exatamente o significado de cada dado de origem.
2. Determine quais status entram e quais ficam de fora.
3. Implemente a agregação em `financeiro/services/indicadores.py` ou serviço especializado.
4. Evite cálculos monetários em templates.
5. Trate ausência de dados como `None`/estado insuficiente, não como zero enganoso.
6. Inclua testes com casos positivos, negativos, zero e dados faltantes.

### Criar uma integração externa futura

1. Confirme a disponibilidade e os termos da API oficial.
2. Separe autorização, refresh de token, cliente HTTP e mapeamento de dados.
3. Nunca solicite credenciais em campo público ou grave tokens sem proteção.
4. Armazene identificadores externos e fonte da informação.
5. Faça sincronização incremental e idempotente.
6. Registre status, horário, quantidade e erros sem incluir tokens.
7. Mantenha a aplicação utilizável quando a API externa estiver indisponível.
8. Exponha serviços/API internos reutilizáveis para a integração futura com Skallora.

## 12. Migrações e recuperação de dados

A migração inicial versionada está em `financeiro/migrations/0001_initial.py`. Na instalação normal, basta `python manage.py migrate`.

Antes de atualizar modelos ou código:

1. Feche o processo de automação e o servidor.
2. Execute `scripts\gerar_backup.bat` ou copie manualmente `db.sqlite3` para uma pasta segura.
3. Atualize os arquivos de código preservando `.env` e `db.sqlite3`.
4. Execute `python manage.py migrate`.
5. Execute `python manage.py check` e os testes.
6. Inicie o servidor e confira os registros.

Se aparecer `no such table`, verifique `python manage.py showmigrations financeiro` e aplique `python manage.py migrate`. Não execute `flush` nem apague o banco como primeira tentativa.

## 13. Evolução prevista

Possíveis fases futuras, sem presumir que já estejam implementadas:

- CRUD de marketplaces e canais dentro das configurações da interface.
- Relatórios com séries históricas e comparação de campanhas.
- Regras explícitas de rateio de custos compartilhados.
- Importadores específicos por marketplace, com layouts e validação separados.
- Conectores oficiais mediante credenciais e permissões.
- Worker remoto e agendamento confiável para operação contínua.
- API interna para comunicação com o Skallora.
- Auditoria mais completa para edição de registros, importações e reclassificações.
- PostgreSQL e configuração de produção.

Nenhuma fase futura deve remover a clareza da origem dos dados ou misturar GMV com receita de afiliado.

---

**Regra de reconstrução:** preserve a verdade financeira, o isolamento entre usuários, o glassmorphism na paleta verde/creme/vermelho e a separação entre interface, regras de negócio e integrações externas. O visual pode evoluir; essas garantias não devem regredir.
