# Afillimetrics — Ecossistema de Automação para Afiliados

## Atualização 25/11/2026 — integração CPA Manager + ROI Manager

Documento consolidado da arquitetura e manutenção das ferramentas avançadas: `docs/INTEGRACAO_FERRAMENTAS_AVANCADAS.md`.


- **CPA Manager** incorporado sob `/cpa/`, namespace `cpa`, com login central, importação CSV/XLSX, desempenho, campanhas, API de métricas de leitura e dimensões default para usuários antigos e novos.
- **ROI Manager** incorporado sob `/roi/`, namespace `roi`, com investimentos, comissões, produtos, campanhas, importação CSV, cálculo financeiro e automação local.
- A sidebar **Avançado** agora lista TPB, LTV, CPA e ROI; a Home exibe resumos CPA e ROI usando as mesmas funções de métricas das dashboards individuais.
- Todos os módulos usam o mesmo `manage.py`, settings, autenticação, banco, `.env`, dependências e pipeline de deploy. Não executar os ZIPs isolados nem criar bancos extras.
- CPA, ROI e LTV são bases distintas. Não existe sincronização automática de conversões, despesas e comissões nem atribuição automática entre elas.
- A agregação CPA usa `SUM`/`GROUP BY` no banco; a Home consulta apenas totais (`include_details=False`) e evita montar séries/listas detalhadas em cada acesso.

## Atualização 25/11/2026 — integração do LTV Manager

O módulo LTV Manager foi incorporado ao Django principal em `ltv/`, dentro de **Avançado → LTV Manager**, com login único, migrations próprias e resumo compartilhado na Home. Consulte a seção 26 e `docs/BIBLIA_RECONSTRUCAO.md`.

## Atualização 18/11/2026 — integração do Tráfego Pago Base (TPB)

- O app `ads_manager/` da entrega TPB atual foi incorporado ao Django principal; não existe um segundo projeto, login ou banco separado.
- A entrada fica na sidebar em **Avançado → Tráfego Pago** (`/trafego-pago/`). O item avançado é recolhível e mantém seu estado no navegador.
- A Home (`/home/`) apresenta o vínculo Meta, contas de anúncios, total de campanhas e campanhas ativas.
- Home, visão geral do TPB e página de campanhas leem a mesma tabela `Campaign`, vinculada à conta de anúncios selecionada e ao usuário conectado. A sincronização automática respeita uma janela de 10 minutos; a tela de campanhas solicita uma atualização ao abrir.
- OAuth Meta e tokens são tratados no app integrado. O token é armazenado criptografado com `TOKEN_ENCRYPTION_KEY`, uma chave Fernet separada de `SECRET_KEY` e `CREDENTIAL_ENCRYPTION_KEY`.
- Esta versão continua estritamente em modo de leitura: consulta ativos, campanhas e Insights; não cria nem edita campanhas, anúncios ou orçamentos.
- Novas migrations: `ads_manager/0001_initial.py` e `ads_manager/0002_adaccount_last_campaign_sync_at.py`.
- Configuração, limites, rotas, variáveis e reconstrução: `docs/BIBLIA_RECONSTRUCAO.md` e a seção **Tráfego Pago (TPB)** deste README.

**Atenção:** `campanha_sazonal` no app `core` continua sendo o marcador de campanhas promocionais usado na mensagem de ofertas de afiliados. Não é tráfego pago e foi preservado para não alterar a publicação existente.

---

## Atualizações 22–23/09/2026

### Coleta geral e Central Magalu
- `/coleta/`: fluxo simplificado com checkboxes de marketplaces e somente categoria/palavra-chave.
- Magalu está funcional; Mercado Livre e Amazon ficam desabilitados até seus coletores existirem.
- `/magalu/`: Central Magalu para recursos específicos/avançados, incluindo múltiplas keywords, loop, logs e controles detalhados.
- O CTA principal agora é **Ir para coleta**.

### Divulgação e alertas
- Configurações Telegram/WhatsApp por usuário.
- Templates por categoria/keyword e Produtos Quentes.
- Alertas visuais contextuais para canal não configurado, credencial inválida e indisponibilidade temporária.
- Falha de divulgação não invalida produto/link já processado.

### Segurança das credenciais
A criptografia de Telegram/WhatsApp agora usa chave própria:
```env
SECRET_KEY=
CREDENTIAL_ENCRYPTION_KEY=
```
Registros novos usam `enc2::`. Registros legados `enc::` ainda podem ser lidos com a SECRET_KEY antiga apenas para migração. Antes de trocar a SECRET_KEY, configure a nova chave, faça backup e rode:
```bash
python manage.py migrar_credenciais
```
Gere uma chave forte com:
```bash
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

### Interface
Trocas de página agora exibem blur discreto + spinner central. Estados de execução exibem um pequeno loading ao lado do status.

---

## Documentação anterior

# Afillimetrics — Smart Affiliate Bot

> Plataforma Django para coleta de produtos e links de afiliado, organização de ofertas e futura distribuição por Telegram/WhatsApp, com arquitetura preparada para múltiplos marketplaces.

## Visão geral

O Afillimetrics usa o Django como centro operacional. O Selenium/Chrome é responsável somente pela automação do marketplace; os resultados são persistidos no banco e podem alimentar o gerador de ofertas e os canais de divulgação.

```text
Usuário
  │
  ├── Cadastro / Login Django
  │
  ▼
Home autenticada
  │
  ├── Dashboard e gráficos
  ├── Ofertas
  └── Marketplaces
        └── Magalu
              │
              ▼
         Selenium / Chrome
              │
              ▼
          Produtos + links
              │
              ▼
        PostgreSQL / SQLite
              │
              ▼
       Ofertas / Mensagens
              │
       ┌──────┴──────┐
       ▼             ▼
   Telegram      WhatsApp
```

## Principais recursos

- Autenticação real com o sistema nativo do Django.
- Cadastro, login e logout.
- Todas as áreas operacionais protegidas por autenticação.
- Home autenticada como destino após login.
- Sidebar com os bots dos marketplaces.
- Magalu disponível; Mercado Livre e Amazon preparados como próximos módulos.
- Coleta por categoria, palavra-chave ou ambos.
- Categorias opcionais.
- Loop de palavras-chave sequencial: uma chave termina antes da próxima começar e um novo ciclo só começa após todas as chaves do ciclo atual.
- Descoberta da vitrine autenticada do Magalu sem tratar `/admin` como vitrine.
- Geração de links de afiliado com validação de domínios conhecidos, incluindo `magazineluiza.onelink.me`.
- Normalização de preços como `R$ 1.199,00` e `ou R$ 989,99` para valores monetários consistentes.
- Persistência em banco Django.
- Exportação Excel/CSV mantida como relatório.
- Logs e progresso em tempo real no navegador.
- Gráficos Google Charts alimentados por agregações feitas com pandas.
- Gráfico de categorias: categorias predefinidas + `Outros` para palavras-chave.
- Gráfico de marketplaces: pronto para receber novos bots.
- Telegram/WhatsApp desacoplados do coletor.
- PostgreSQL via `DATABASE_URL`.
- Render com `build.sh` e `render.yaml`.

---

## Requisitos

- Python 3.11+ recomendado para desenvolvimento.
- Django 5.2+ e compatível com a versão definida em `requirements.txt`.
- Google Chrome.
- ChromeDriver compatível, gerenciado pelo Selenium/driver-manager conforme a configuração atual.
- PostgreSQL em produção.
- Windows é suportado para desenvolvimento local do Selenium.

> O coletor atual utiliza uma sessão Chrome conectada por debugging remoto. Para produção, recomenda-se separar o worker Selenium do processo web Django.

---

# 1. Instalação local

Abra um terminal dentro da pasta `aflmain`.

## Windows PowerShell

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
```

Se o PowerShell bloquear a ativação:

```powershell
venv\Scripts\activate.bat
```

## Variáveis de ambiente

Copie o arquivo de exemplo:

```powershell
copy .env.example .env
```

Para desenvolvimento local, sem PostgreSQL configurado, o projeto usa SQLite.

Para PostgreSQL, defina:

```env
DATABASE_URL=postgresql://usuario:senha@host:5432/banco
```

---

# 2. Banco de dados

Depois de instalar as dependências, execute:

```powershell
python manage.py migrate
```

Isso cria as tabelas nativas do Django (`auth_user`, sessões, migrations etc.) e as tabelas do Afillimetrics.

Se aparecer:

```text
no such table: auth_user
```

significa que o banco configurado ainda não recebeu as migrations. Execute `python manage.py migrate`.

Para criar o administrador Django:

```powershell
python manage.py createsuperuser
```

---

# 3. Iniciar o servidor

```powershell
python manage.py runserver
```

Abra:

```text
http://127.0.0.1:8000/
```

O visitante verá a landing page. Depois do login ou cadastro, será redirecionado para:

```text
/home/
```

---

# 4. Estrutura do projeto

```text
aflmain/
├── aflmain/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
│
├── ads_manager/
│   ├── models.py                 # conexão Meta, contas e campanhas
│   ├── views.py                  # OAuth, ativos, campanhas, Insights
│   ├── urls.py                   # rotas namespaced ads_manager
│   ├── services/
│   │   ├── encryption.py         # tokens Meta criptografados
│   │   ├── campaign_sync.py      # sincronização única para Home e TPB
│   │   └── meta.py               # cliente Graph/Marketing API
│   ├── providers/                # contrato multi-provedor e Meta
│   ├── migrations/               # migrations do módulo
│   ├── templates/ads_manager/    # telas do tráfego pago
│   └── static/ads_manager/       # CSS específico
│
├── core/
│   ├── __init__.py
│   ├── admin.py
│   ├── apps.py
│   ├── models.py
│   ├── services.py
│   ├── tests.py
│   ├── urls.py
│   ├── views.py
│   │
│   ├── migrations/
│   │   ├── __init__.py
│   │   ├── 0001_initial.py
│   │   ├── 0002_user_ownership.py
│   │   └── 0003_produto_marketplace.py
│   │
│   ├── management/
│   │   └── commands/
│   │       └── configurar_canais.py
│   │
│   └── templates/core/
│       ├── index.html
│       ├── home.html
│       ├── login.html
│       ├── cadastro.html
│       ├── dashboard.html
│       ├── magalu_bot.html
│       └── ofertas.html
│
├── magalu_bot/
│   ├── __init___.py
│   ├── bot.py
│   ├── bot_controller.py
│   ├── controlador.py
│   ├── estados.py
│   │
│   ├── automacao/
│   │   ├── __init__.py
│   │   ├── afiliados.py
│   │   ├── categorias.py
│   │   └── logger.py
│   │
│   ├── config/
│   │   ├── __init__.py
│   │   └── config.py
│   │
│   ├── persistencia/
│   │   ├── __init__.py
│   │   ├── django_db.py
│   │   └── excel.py
│   │
│   └── relatorios/
│       ├── __init__.py
│       └── relatorios.py
│
├── build.sh
├── manage.py
├── render.yaml
├── requirements.txt
├── .env.example
└── .gitignore
```

---

# 5. O que cada arquivo faz

## Raiz

### `manage.py`

Ponto de entrada dos comandos Django.

Exemplos:

```powershell
python manage.py runserver
python manage.py migrate
python manage.py createsuperuser
python manage.py test
```

### `requirements.txt`

Lista as dependências Python do projeto: Django, Selenium, pandas, openpyxl, PostgreSQL/URL configuration, Gunicorn e demais bibliotecas auxiliares.

### `.env.example`

Modelo das variáveis de ambiente necessárias. Deve ser copiado para `.env` em desenvolvimento.

### `.gitignore`

Evita enviar ambiente virtual, `.env`, bancos locais, arquivos temporários e artefatos gerados para o Git.

### `build.sh`

Script utilizado no deploy para instalar dependências, aplicar migrations e coletar arquivos estáticos.

### `render.yaml`

Configuração declarativa do serviço Django no Render, incluindo build/start e variáveis de ambiente.

---

# 6. Pacote Django `aflmain/`

### `aflmain/settings.py`

Configuração principal do Django:

- apps instalados;
- middleware;
- templates;
- banco;
- arquivos estáticos;
- segurança;
- autenticação;
- WhiteNoise;
- leitura de `DATABASE_URL`;
- configurações OAuth/Marketing API da Meta e a chave Fernet de tokens (`TOKEN_ENCRYPTION_KEY`).

### `aflmain/urls.py`

Roteamento global. Registra o `/admin/`, monta `ads_manager` em `/trafego-pago/` e inclui as rotas do aplicativo `core`.

### `aflmain/asgi.py`

Entrada ASGI para servidores compatíveis.

### `aflmain/wsgi.py`

Entrada WSGI usada pelo Gunicorn no Render.

---

# 7. Aplicativo `core/`

O `core` é o núcleo web e de negócio do sistema.

### `core/models.py`

Define as entidades persistidas:

- `Produto` — produto coletado, categoria, marketplace, preços e proprietário.
- `Afiliado` — link afiliado e status de validação.
- `Execucao` — execução do coletor, progresso, estado e alvos.
- `Mensagem` — mensagens por canal.
- `Oferta` — oferta gerada a partir de produto.
- `ConfiguracaoCanal` — configuração de Telegram/WhatsApp por usuário.
- `LogExecucao` — logs exibidos no painel.

### `core/views.py`

Controla as páginas e APIs HTTP:

- landing page;
- login;
- cadastro;
- logout;
- home;
- coletor Magalu;
- iniciar/pausar/retomar/parar;
- status;
- logs;
- ofertas;
- contexto compartilhado do tráfego pago, incluindo conexão Meta, conta selecionada e campanhas ativas.

A função `home()` também prepara os dados dos gráficos usando **pandas** e usa o serviço `ads_manager.services.campaign_sync` para ler/sincronizar o mesmo snapshot de campanhas da área TPB.

### `core/urls.py`

Mapeia as URLs do aplicativo.

Rotas principais:

```text
/                  landing page pública
/login/            login
/cadastro/         cadastro
/logout/            logout
/home/             home autenticada
/dashboard/        compatibilidade → home
/magalu/            coletor Magalu
/ofertas/           ofertas
```

### `core/services.py`

Serviços de negócio para geração e envio de ofertas.

### `core/admin.py`

Registro das entidades no Django Admin.

### `core/tests.py`

Testes automatizados do aplicativo.

---

# 8. Templates

### `index.html`

Landing page pública. Usuários autenticados são direcionados para a home operacional.

### `home.html`

Painel principal após login.

Possui:

- sidebar;
- métricas;
- botão do Magalu;
- futuros marketplaces;
- gráfico de links por categoria;
- gráfico de links por marketplace;
- última execução.

Os gráficos usam Google Charts no navegador e recebem dados agregados pelo backend com pandas.

### `login.html`

Formulário de autenticação Django.

### `cadastro.html`

Formulário de criação de usuário.

### `dashboard.html`

Página legada mantida para compatibilidade. A rota `/dashboard/` redireciona para a nova home.

### `magalu_bot.html`

Interface do coletor Magalu:

- categorias;
- palavras-chave;
- loop;
- iniciar;
- pausar;
- retomar;
- parar;
- status;
- logs;
- progresso.

A seleção de categoria usa **um único checkbox visual**.

### `ofertas.html`

Interface para gerar e enviar ofertas.

---

# 9. Migrations

### `0001_initial.py`

Criação inicial das entidades do aplicativo.

### `0002_user_ownership.py`

Adiciona a associação dos dados ao usuário autenticado e garante isolamento entre contas.

### `0003_produto_marketplace.py`

Adiciona o campo `marketplace` em `Produto`, permitindo que o mesmo banco armazene produtos de Magalu, Mercado Livre, Amazon e futuros marketplaces.

### `0004_execucao_keywords_loop.py` até `0009_produto_indicadores_e_progresso_coleta.py`

Completam a evolução do modelo: configurações de loop da coleta, histórico de preços, canais e templates, alertas, produtos quentes, localização/timezone do perfil, snapshots das mensagens, indicadores de comissão/vendas/lucro e cursor persistente de coleta. A migration `0007_loop_categorias_e_perfil_timezone.py` cria `PerfilUsuario`; por isso ela é necessária para o cadastro atual.

Em instalações novas e existentes, aplique a sequência com `python manage.py migrate` após fazer backup do banco. Não use `--run-syncdb` como substituto das migrations do app `core`.

---

# 10. Comando de canais

### `core/management/commands/configurar_canais.py`

Comando administrativo para preparar configurações de Telegram/WhatsApp.

Executar:

```powershell
python manage.py configurar_canais
```

---

# 11. Módulo `magalu_bot/`

Esse módulo contém o coletor Selenium e não deve ser confundido com o Django web.

### `magalu_bot/bot.py`

Orquestra a execução completa:

1. conecta ao Chrome;
2. valida login;
3. descobre a vitrine autenticada;
4. monta a fila de categorias/palavras-chave;
5. coleta produtos;
6. abre cada produto;
7. captura preços;
8. gera link afiliado;
9. salva banco + Excel/CSV;
10. atualiza estado e logs.

### `magalu_bot/controlador.py`

Controlador da thread de execução. Recebe comandos de iniciar, pausar, retomar e parar.

### `magalu_bot/bot_controller.py`

Camada de controle auxiliar do bot e compatibilidade com o fluxo existente.

### `magalu_bot/estados.py`

Estados possíveis do coletor, como inicialização, login, execução, pausa, finalização e parada.

---

# 12. Automação Magalu

### `automacao/afiliados.py`

Responsável por:

- abrir o produto;
- localizar preço anterior;
- localizar preço atual;
- normalizar preços;
- clicar em `Gerar link`;
- localizar o link no modal;
- validar a URL retornada.

Links como:

```text
https://magazineluiza.onelink.me/...
```

são aceitos como deep links válidos do fluxo de afiliados.

Rotas administrativas como `/admin/` continuam sendo rejeitadas.

### `automacao/categorias.py`

Coleta produtos por categoria e por palavra-chave.

### `automacao/logger.py`

Camada de logging utilizada pelo coletor.

---

# 13. Configuração do bot

### `config/config.py`

Centraliza:

- URLs base;
- limite de produtos;
- categorias predefinidas;
- parâmetros do Chrome;
- timeouts;
- configurações do coletor.

Categorias atuais:

```text
cozinha
quarto
sala
banheiro
acessórios
```

---

# 14. Persistência

### `persistencia/django_db.py`

Converte preços para `Decimal` e grava produtos/links no banco Django.

Todos os produtos gravados pelo coletor Magalu recebem:

```text
marketplace = MAGALU
```

### `persistencia/excel.py`

Mantém a geração/atualização do Excel e CSV como relatório externo ao banco.

---

# 15. Relatórios

### `relatorios/relatorios.py`

Gera relatórios de console sobre produtos, links e categorias processadas.

---

# 16. Categorias x palavras-chave no gráfico

O banco mantém o valor real usado na coleta.

Exemplo:

```text
cozinha
keyword:air fryer
keyword:cafeteira
quarto
```

Na Home:

```text
cozinha       → Cozinha
quarto        → Quarto
keyword:*     → Outros
```

Assim palavras-chave não criam infinitas fatias no gráfico de pizza.

---

# 17. Marketplace

Todo `Produto` possui um campo:

```text
marketplace
```

Magalu grava:

```text
MAGALU
```

Futuramente:

```text
MERCADO_LIVRE
AMAZON
OUTROS
```

O gráfico de marketplace já lê esse campo, portanto a inclusão de um novo bot não exige alterar a estrutura do dashboard.

---

# 18. Selenium e Chrome

O coletor conecta ao Chrome via debugging remoto.

O fluxo local típico é:

```text
Chrome
  ↓
porta de debugging
  ↓
Selenium
  ↓
Magalu Bot
```

Antes de executar o coletor, configure o Chrome conforme os parâmetros de `magalu_bot/config/config.py` e `magalu_bot/bot.py`.

Em produção, o ideal é executar Selenium em um worker separado do processo web.

---

# 19. PostgreSQL

O projeto suporta PostgreSQL usando `DATABASE_URL`.

Exemplo:

```env
DATABASE_URL=postgresql://usuario:senha@host:5432/afillimetrics
```

O Django escolhe automaticamente o PostgreSQL quando essa variável existe. Sem ela, o desenvolvimento local usa SQLite.

Depois de configurar a variável:

```powershell
python manage.py migrate
```

Nunca coloque senha real do banco no Git.

---

# 20. Render

O Django web está preparado para deploy no Render com PostgreSQL. O coletor Selenium, porém, **não deve ser considerado pronto para produção no mesmo Web Service**: ele precisa de um ambiente com Chrome/Chromium e sessão gráfica/automação apropriada. Em produção, mantenha o Django Web separado do worker Selenium.

## Deploy do Django Web no Render

1. Suba o projeto para um repositório GitHub privado ou público.
2. No Render, crie um **PostgreSQL**.
3. Crie um **Web Service** apontando para o repositório.
4. Selecione o runtime Python.
5. O projeto já possui `render.yaml` e `build.sh`; eles instalam dependências, coletam estáticos e executam migrations.
6. Configure as variáveis de ambiente:

```text
SECRET_KEY=<gerada pelo Render ou secret seguro>
DEBUG=False
ALLOWED_HOSTS=.onrender.com
CSRF_TRUSTED_ORIGINS=https://SEU-SERVICO.onrender.com
DATABASE_URL=<Internal Database URL do PostgreSQL do Render>
TIME_ZONE=America/Sao_Paulo
```

7. Faça o deploy. O build executará:

```text
pip install -r requirements.txt
python manage.py collectstatic --noinput
python manage.py migrate --noinput
```

8. Após o primeiro deploy, crie o administrador pelo Shell do Render:

```bash
python manage.py createsuperuser
```

9. Acesse o domínio do serviço e teste cadastro/login, Home, gráficos e banco.

## PostgreSQL

O projeto usa automaticamente PostgreSQL quando `DATABASE_URL` existe. Sem essa variável, desenvolvimento local usa SQLite.

## Selenium no Render

O `render.yaml` atual publica o Django Web. Isso não garante Chrome/Selenium operacional. Para o coletor, crie posteriormente um **worker dedicado** com Chrome/Chromium e as variáveis/sessões necessárias. O worker deve comunicar-se com o Django/DB, em vez de depender da thread do processo web. Essa separação também evita perder uma execução quando o Web Service for reiniciado.

## Persistência da tela do coletor

As categorias, palavras-chave e palavras do loop são persistidas em dois níveis:

- `localStorage`: mantém a configuração ao sair e voltar para a página no mesmo navegador;
- `Execucao` no banco: registra a configuração usada pela execução, incluindo `keywords_loop`.

Isso é diferente do estado do Selenium: navegar para outra página **não deveria parar o bot**. Reiniciar o processo web, reiniciar o computador ou derrubar o worker encerra uma execução Selenium em memória; por isso o worker separado é recomendado para produção.

---

# 21. Testes

Execute:

```powershell
python manage.py check
python manage.py test
```

Antes de subir para produção, confirme também:

```powershell
python manage.py migrate --plan
```

---

# 22. Fluxo recomendado de desenvolvimento

```text
1. Instalar dependências
2. Configurar .env
3. python manage.py migrate
4. python manage.py check
5. python manage.py test
6. python manage.py runserver
7. Criar conta
8. Testar login
9. Testar Home e gráficos
10. Testar Coletor Magalu
11. Validar links afiliados
12. Validar Excel/CSV
13. Validar Ofertas
14. Configurar PostgreSQL
15. Testar migrations no PostgreSQL
16. Publicar Django no Render
17. Separar Selenium em worker de produção
```

---

# 23. Segurança

Nunca publique:

- `.env`;
- tokens de Telegram;
- tokens de WhatsApp;
- senha PostgreSQL;
- cookies/sessões do Chrome;
- arquivos de perfil do Chrome;
- dumps de banco;
- CSV/Excel contendo dados que não deveriam ser públicos.

Em produção:

- `DEBUG=False`;
- HTTPS;
- `ALLOWED_HOSTS` configurado;
- `CSRF_TRUSTED_ORIGINS` configurado;
- secrets somente em variáveis de ambiente.

---

# 24. Próximos módulos

A arquitetura foi deixada preparada para:

```text
Magalu
Mercado Livre
Amazon
outros marketplaces
```

Todos devem alimentar o mesmo modelo `Produto`, diferenciados por `marketplace`.

O fluxo futuro será:

```text
Marketplace Bot
      ↓
Produto
      ↓
Afiliado
      ↓
Oferta
      ↓
Mensagem
      ↓
Telegram / WhatsApp
```

Isso mantém o coletor independente dos canais de divulgação e evita acoplamento entre Selenium e WhatsApp/Telegram.

---

# Licença / uso

Projeto destinado ao uso privado e desenvolvimento da plataforma Afillimetrics. Verifique os termos de uso e as políticas dos marketplaces e provedores de mensagens antes de operar automações em produção.

## Política de captura de links de afiliado

O coletor não considera um produto como sucesso apenas porque conseguiu abrir a página ou clicar em `Gerar link`. O sucesso exige uma URL afiliada válida.

A captura utiliza múltiplas estratégias, nesta ordem geral:

1. elementos do modal (`input`, `textarea`, `href` e atributos `data-*`);
2. elementos visíveis relevantes do DOM;
3. shadow DOM aberto;
4. URL atual, caso a geração tenha redirecionado o navegador;
5. `page_source` como último recurso.

Cada produto possui um número limitado de tentativas (`MAX_TENTATIVAS_AFILIADO`, atualmente 4). A cada nova tentativa o produto é reaberto e o processo de geração é repetido. Se todas as tentativas falharem, o produto é salvo como `REVISAR`, com diagnóstico, e o coletor segue para o próximo produto. Isso evita tanto perder silenciosamente a falha quanto travar a execução indefinidamente.

Somente links dos domínios de saída conhecidos do afiliado Magalu são aceitos pela validação atual:

- `divulgador.magalu.com`
- `magazineluiza.onelink.me`

A camada de ofertas também não usa mais a URL normal do produto como fallback: sem link afiliado, a oferta não é criada para divulgação.

---

# Divulgação inteligente (integrada)

O projeto agora incorpora o motor de divulgação do Smart Affiliate Bot de referência, sem depender de o usuário escrever as mensagens.

## O que já vem pronto

- Templates automáticos por categoria e tipo de produto.
- Chamadas dinâmicas para beleza, casa, cozinha, celulares, eletrônicos, games, informática, livros e achadinhos gerais.
- Regras especiais para produtos baratos e palavras-chave como perfume, air fryer, fone, notebook, celular, smartwatch, games, TV e fraldas.
- Blocos automáticos `De/Por`, percentual de desconto e CTA.
- Turnos automáticos: MANHÃ, ALMOÇO, TARDE, NOITE e RELÂMPAGO.
- Campanha sazonal por variável `CAMPANHA_SAZONAL`.
- Histórico de preços para futura evolução da validação de oportunidade.
- Cache de 120 horas por produto/canal para evitar repetição.
- Telegram com envio de texto e tentativa de envio com imagem via `sendPhoto`, com fallback para `sendMessage`.
- WhatsApp por API configurada ou, no fluxo Selenium, por WhatsApp Web usando a sessão já aberta.
- Publicação automática opcional depois que o link afiliado foi validado.

## Ativar publicação automática

No `.env`:

```env
AUTO_PUBLICAR_OFERTAS=true
CANAIS_AUTOMATICOS=TELEGRAM,WHATSAPP
CACHE_RETENCAO_HOURS=120
CAMPANHA_SAZONAL=NENHUM
```

A publicação **nunca acontece antes de existir um link afiliado válido**. Se o produto ficar `REVISAR`, ele não é divulgado.

## Publicar manualmente ofertas prontas

```powershell
python manage.py publicar_ofertas --limite 20 --canal TELEGRAM
```

Ou:

```powershell
python manage.py publicar_ofertas --limite 20 --canal TELEGRAM --canal WHATSAPP
```

Forçar uma nova publicação ignorando o cache:

```powershell
python manage.py publicar_ofertas --limite 20 --forcar
```

## Estratégia de turnos incorporada

- MANHA: 08:30–10:30 — utilidades, casa, beleza e achadinhos baratos.
- ALMOCO: 12:00–14:00 — celulares, games e tecnologia pessoal.
- TARDE: 15:30–18:30 — notebooks, periféricos, áudio e produtividade.
- NOITE: 20:00–01:00 — TV, eletrodomésticos, PC gamer e itens de maior ticket.
- RELAMPAGO: campanhas com teto de preço.

A copy é escolhida automaticamente; não é necessário cadastrar um texto por produto.


## Atualização — coleta contínua, categorias personalizadas e fuso por usuário
- Produtos Quentes exibem o desconto calculado a partir dos preços reais.
- Palavras-chave passam a ser categorias personalizadas reutilizáveis na Coleta Geral.
- Nova categoria personalizada pode ser criada em modal, com template, sem abandonar a coleta.
- Loop disponível para categorias nativas e personalizadas; o limite por página é lote, não fim da execução.
- Coleta em loop avança páginas e, ao esgotar resultados, retorna ao topo para reavaliar itens relevantes.
- Cadastro armazena país/estado/cidade e o timezone IANA detectado pelo navegador.
- Mensagens por turno usam o timezone do proprietário do produto.

---

# Histórico consolidado de alterações

# Atualização — divulgação, templates e produtos quentes

## O que mudou

- Erros de Telegram/WhatsApp agora geram alertas persistentes por usuário.
- O processamento/coleta do produto não é perdido quando a divulgação falha.
- Nova página `/configuracoes/` para credenciais e automação por usuário.
- Tokens de canais e credenciais são criptografados em repouso; na implementação atual, a chave própria é `CREDENTIAL_ENCRYPTION_KEY`, separada da `SECRET_KEY`.
- Nova página `/ofertas/templates/` com templates nativos por categoria e personalizados por palavra-chave.
- Palavras-chave novas precisam de template ou da opção **divulgar sem template** antes do bot iniciar.
- Ofertas geradas podem ser editadas individualmente.
- Nova página `/produtos-quentes/`, com filtro por categoria e ranking recalculado a cada 5 dias.
- A antiga rota `/ofertas/` redireciona para a nova tela de templates.

## Depois de atualizar

```bash
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

> Em produção, execute as migrações durante o deploy.

## Segurança

As credenciais por usuário não são gravadas de volta no `.env`. O `.env` continua sendo usado para configurações globais/segredos da aplicação. Os tokens dos canais são criptografados no banco com `CREDENTIAL_ENCRYPTION_KEY`; registros legados com prefixo `enc::` ainda podem depender da `SECRET_KEY` antiga durante a leitura/migração. Os tokens Meta do módulo TPB usam uma chave Fernet independente (`TOKEN_ENCRYPTION_KEY`).

**Não troque `CREDENTIAL_ENCRYPTION_KEY` ou `TOKEN_ENCRYPTION_KEY` sem planejar a migração dos valores já persistidos.** A `SECRET_KEY` também deve permanecer estável para sessões/estados assinados e para a leitura de registros de credenciais legados.

## Ranking de Produtos Quentes

Como o projeto ainda não possui métricas reais de clique/conversão por produto, o ranking usa sinais disponíveis no banco: desconto, queda recente de preço, recência da coleta e validade do link afiliado. Quando houver métricas de clique/venda, elas podem substituir ou complementar esse score.

## Fila e revezamento de categorias

- Sem loop, cada categoria/categoria personalizada conclui seu lote configurado antes da próxima.
- Em loop, os alvos são reordenados a cada rodada para evitar prioridade fixa.
- Cada alvo em loop processa um lote de 2 produtos antes de liberar a fila para outro alvo.
- O restante dos produtos coletados fica em buffer e é retomado na próxima passagem, sem descartar itens da página.
- O loop não possui encerramento automático; a parada continua sob controle do usuário.
- Paginação permanece independente por alvo e volta à página 1 quando os resultados se esgotam.


## Aplicativo desktop Skallora (integração)

O projeto agora inclui o cliente Windows em `desktop_app/` e uma API autenticada em `/api/desktop/`. A documentação detalhada de arquitetura, integração Mercado Livre, uso da Central Magalu, build e limitações está em `docs/IMPLEMENTACAO_DESKTOP.md`.

A pasta `desktop_app/integrations/mercado_livre/mercado_livre_busca.py` mantém o script Mercado Livre recebido como anexo, sem alterações. Para compilar no Windows, execute `desktop_app/build_windows.bat` e distribua a pasta `desktop_app/dist/Skallora/` completa.

**Nota sobre banco:** esta versão inclui as migrations versionadas `core/migrations/0001` até `0009`, incluindo a tabela `PerfilUsuario` e o modelo `ProgressoColeta`. Em instalações existentes, faça backup do banco e execute `python manage.py migrate`. Não use `flush` nem apague `db.sqlite3` para resolver falhas de migration.


# 25. Tráfego Pago (TPB) — integração Meta Ads

O módulo vem do ZIP `TPB---Ferramenta-isolada-by-Scallora-main`, versão atual enviada em 16/11/2026, e está integrado ao mesmo Django, autenticação e banco do Afillimetrics.

## 25.1 Navegação e rotas

A sidebar tem o agrupador recolhível **Avançado**. Ao expandi-lo, aparece **Tráfego Pago**. A tela usa a mesma sidebar do restante do ecossistema; no interior do módulo há navegação para Visão geral, Ativos, Campanhas e Métricas.

| Rota | Finalidade |
|---|---|
| `/trafego-pago/` | Visão geral do TPB |
| `/trafego-pago/auth/meta/connect/` | Inicia OAuth Meta |
| `/trafego-pago/auth/meta/callback/` | Callback OAuth cadastrado na Meta |
| `/trafego-pago/ativos/` | Empresas, páginas e contas de anúncios |
| `/trafego-pago/contas/selecionar/` | Seleciona a conta a analisar (POST) |
| `/trafego-pago/campanhas/` | Lista e sincroniza campanhas da conta selecionada |
| `/trafego-pago/metricas/` | Insights agregados dos últimos 30 dias |
| `/trafego-pago/auth/meta/desconectar/` | Remove a conexão local (POST) |

As rotas do módulo usam o namespace `ads_manager:`. O login é o do Afillimetrics (`/login/`); o cadastro e as sessões independentes do protótipo TPB não foram incorporados.

## 25.2 Fonte única das campanhas

As informações de tráfego pago que aparecem na Home e no módulo TPB não são cópias independentes:

- `ConnectedAccount` guarda a conexão Meta vinculada ao usuário Django;
- `AdAccount` guarda as contas de anúncios sincronizadas;
- `Campaign` guarda os registros de campanhas vinculados à conta selecionada;
- `AdAccount.last_campaign_sync_at` registra o último sincronismo completo;
- `ads_manager/services/campaign_sync.py` é usado pela Home e pelo módulo TPB.

A Home `/home/`, a visão geral `/trafego-pago/` e a lista `/trafego-pago/campanhas/` consultam o mesmo conjunto persistido. A Home/visão geral reutiliza o snapshot por até 10 minutos. Ao abrir a lista completa de campanhas, o módulo força uma nova consulta à Meta. A consulta percorre até 100 páginas; se a API ainda indicar outra página, o sincronismo é interrompido antes de gravar ou remover registros. Se a Meta estiver indisponível, a paginação vier incompleta ou o token não puder ser lido, o sistema preserva e exibe os dados do último sincronismo, sem apagar o snapshot.

A conta selecionada é guardada na sessão Django (`selected_ad_account_id`) e validada dentro das contas pertencentes à conexão do usuário atual. O card principal exibe a quantidade de contas, total de campanhas na conta selecionada e campanhas ativas, além de até cinco campanhas ativas. O módulo separado exibe a mesma contagem/resumo e mantém a listagem completa.

O status ativo considera `effective_status == ACTIVE`; apenas quando o provedor não envia `effective_status`, o campo `status` é usado como fallback.

## 25.3 Escopo funcional e limites

A integração mantém o escopo do ZIP TPB recebido:

- Login OAuth da Meta;
- consulta de perfil, permissões, Business Managers, páginas e contas de anúncios;
- sincronização de campanhas e consulta de Insights;
- adaptador `AdsProvider` preparado para provedores futuros;
- armazenamento do token cifrado no banco.

**Somente leitura.** Não há criação, edição ou publicação de campanhas, conjuntos, criativos ou anúncios; não há alteração de orçamento, pagamentos, saldo, webhooks, renovação automática de token ou fila de tarefas. A atualização das informações ocorre quando as telas são acessadas; o sistema não faz sincronização em segundo plano.

## 25.4 Configuração da Meta e variáveis de ambiente

Configure um aplicativo em Meta for Developers, com OAuth e acesso necessário à Marketing API. Cadastre no aplicativo a URI de callback exata do ambiente. Para desenvolvimento local:

```text
http://127.0.0.1:8000/trafego-pago/auth/meta/callback/
```

Para produção, `META_REDIRECT_URI` deve conter a URL pública HTTPS completa, exatamente igual à cadastrada no aplicativo Meta. Configure no `.env`/Render:

```env
META_APP_ID=
META_APP_SECRET=
META_API_VERSION=v25.0
META_REDIRECT_URI=https://SEU-DOMINIO/trafego-pago/auth/meta/callback/
META_SCOPES=ads_read,business_management,pages_show_list,pages_read_engagement,instagram_basic
META_APPSECRET_PROOF=True
TOKEN_ENCRYPTION_KEY=
```

Gere `TOKEN_ENCRYPTION_KEY` como chave Fernet válida:

```powershell
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

A chave é obrigatória para conectar a Meta. Ela precisa ser persistente, privada e ter backup seguro. Não a troque depois de salvar tokens, a menos que os tokens existentes tenham sido descriptografados e recriptografados. Se a chave for perdida, os tokens salvos não poderão ser recuperados.

As chaves têm finalidades diferentes: `SECRET_KEY` assina sessões/estados Django; `CREDENTIAL_ENCRYPTION_KEY` protege credenciais dos canais Telegram/WhatsApp do `core`; `TOKEN_ENCRYPTION_KEY` protege tokens Meta. Não reutilize os valores entre elas. Nunca versione o `.env` nem credenciais reais.

## 25.5 Dependências e migrations

As dependências TPB foram mescladas em `requirements.txt`: Requests 2.32+, Cryptography 44+, `dj-database-url` 2.3+ e Psycopg 3 para PostgreSQL, mantendo as dependências preexistentes do coletor e do desktop. Não instale o `requirements.txt` do ZIP TPB por cima do principal; use apenas o arquivo do app host.

Migrations do app `ads_manager`:

- `0001_initial.py`: conexão Meta, contas de anúncios e campanhas;
- `0002_adaccount_last_campaign_sync_at.py`: campo de controle do sincronismo compartilhado.

Depois de atualizar uma instalação existente, faça backup e execute:

```powershell
python manage.py migrate
python manage.py check
python manage.py test core ads_manager ltv cpa financeiro
```

O deploy Render continua usando `build.sh`, que instala `requirements.txt`, coleta estáticos e aplica migrations. Adicione no painel do Render as variáveis `META_APP_ID`, `META_APP_SECRET`, `META_REDIRECT_URI` e `TOKEN_ENCRYPTION_KEY`; as demais opções da Meta possuem padrão documentado em `.env.example`/`render.yaml`.

## 25.6 Arquivos principais

```text
aflmain/
├── ads_manager/
│   ├── models.py
│   ├── views.py
│   ├── urls.py
│   ├── services/
│   │   ├── campaign_sync.py
│   │   ├── encryption.py
│   │   └── meta.py
│   ├── providers/
│   ├── migrations/
│   ├── templates/ads_manager/
│   └── static/ads_manager/css/app.css
├── core/
│   ├── templates/core/_sidebar.html
│   ├── templates/core/home.html
│   └── static/core/dashboard-ui.js
└── docs/BIBLIA_RECONSTRUCAO.md
```

A documentação de arquitetura e recuperação completa está em `docs/BIBLIA_RECONSTRUCAO.md`.


# 26. LTV Manager — integração ao ecossistema

Em 25/11/2026, o LTV Manager do pacote `ltv_manager_django.zip` foi incorporado como app Django `ltv`. Ele fica em **Avançado → LTV Manager** e utiliza a autenticação, o banco, o deploy e o ambiente Python do projeto principal. Não existe servidor, banco, `.env`, login ou cadastro separado.

### 26.1 Navegação e rotas

- Sidebar global: **Avançado → LTV Manager**.
- Dashboard: `/ltv/dashboard/` (`ltv:dashboard`).
- Análise de LTV: `/ltv/analises/`.
- Coortes: `/ltv/coortes/`.
- Aquisições: `/ltv/aquisicoes/`.
- Comissões: `/ltv/comissoes/`.
- Marketplaces, produtos, campanhas e canais: `/ltv/marketplaces/`, `/ltv/produtos/`, `/ltv/campanhas/`, `/ltv/canais/`.
- Importações e automações: `/ltv/importacoes/`, `/ltv/automacoes/`.
- Relatórios: `/ltv/relatorios/` e `/ltv/relatorios/exportar-comissoes/`.
- API de gráficos: `/ltv/api/graficos/`.

O namespace `ltv` é obrigatório nos `reverse()`, redirects e templates (`ltv:dashboard`, `ltv:campaigns`, etc.), para evitar colisões com `core` e `ads_manager`. O login segue em `/login/` e o logout em `/logout/`.

### 26.2 Dashboard principal e fonte única

A Home `/home/` exibe quatro indicadores executivos do LTV: LTV médio observado, total de comissões aprovadas, aquisições cadastradas e total de comissões pendentes. A dashboard completa `/ltv/dashboard/` apresenta os mesmos números e os demais gráficos e análises.

As duas telas chamam `ltv.analytics.metrics.dashboard_metrics(request.user)` e leem as mesmas tabelas filtradas pelo usuário. Não existe cópia, importação paralela nem cache de métricas entre as telas. Mudanças feitas em aquisições ou comissões ficam refletidas na próxima requisição a ambas.

### 26.3 Dados, isolamento e migrations

O módulo inclui `Marketplace`, `Channel`, `Product`, `Campaign`, `Acquisition`, `Commission`, `AttributionHistory`, `ImportBatch`, `AutomationSettings`, `AutomationRun` e `LTVSnapshot`. As entidades operacionais têm vínculo com `AUTH_USER_MODEL`; as consultas e operações são delimitadas por `request.user`.

- `ltv/migrations/0001_initial.py`: cria o esquema do módulo.
- `ltv/migrations/0002_seed_existing_users.py`: cria configurações de automação e marketplaces/canais padrão para usuários já existentes no ecossistema.
- `ltv/apps.py` / `ltv/signals.py`: provisionam os mesmos defaults para novos usuários.

A migration não apaga dados do `core` ou do TPB. Atualizações existentes devem fazer backup e executar `python manage.py migrate`; nunca apagar o banco ou rodar `flush`.

### 26.4 Importação e regras financeiras

CSV/XLSX passa por prévia, validação, revisão e confirmação em transação. Identificador externo + fonte é a chave de deduplicação quando preenchidos. O vínculo de comissão com aquisição só ocorre por referência externa exata; ausência de prova mantém a comissão sem atribuição. O LTV realizado considera comissões aprovadas e atribuídas; pendentes aparecem separadamente. A exclusão operacional de comissão marca o status como revertido e preserva o histórico.

Modelo de cabeçalhos: `ltv/docs/modelo_importacao_comissoes.csv`. Fórmulas, maturidade das coortes e limitações da projeção estão descritas em `ltv/BIBLIA_RECONSTRUCAO.md`.

### 26.5 Dependências e configuração

O `requirements.txt` único em `aflmain/` já contém as dependências necessárias: Django, `dj-database-url`, `openpyxl`, `psycopg`, `whitenoise` e dependências gerais existentes. Não há pacote, serviço ou banco adicional para o LTV. A única configuração opcional específica da rotina é `AUTOMATION_INTERVAL_SECONDS` (padrão `900`), documentada no `.env.example`; os demais ajustes usam as configurações já carregadas pelo projeto principal. `python-dotenv` não é necessário.

O `build.sh` e `render.yaml` permanecem como entrada única de deploy; o build instala requisitos, coleta estáticos e aplica todas as migrations.

### 26.6 Automação e limites

A manutenção analítica pode ser executada manualmente ou em processo dedicado:

```powershell
python manage.py run_automations --once
python manage.py run_automations --loop --interval 900
```

A execução contínua não é inicializada pelo processo web. O argumento `--interval` usa `AUTOMATION_INTERVAL_SECONDS` (padrão de 900 segundos, definido no `.env`/ambiente) como frequência de verificação do processo; cada usuário habilitado só é processado quando seu próprio `AutomationSettings.interval_seconds` vence. O comando cria snapshots e registros de execução; não consulta APIs de marketplaces. Os conectores de Magalu, Mercado Livre, Amazon e Shopee não estão ativos nesta versão.

### 26.7 Testes e arquivos principais

```powershell
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test core ads_manager ltv cpa financeiro
```

Arquivos principais: `ltv/models.py`, `ltv/views.py`, `ltv/analytics/metrics.py`, `ltv/services/importer.py`, `ltv/automation/tasks.py`, `ltv/management/commands/run_automations.py`, `ltv/templates/ltv/` e `ltv/static/ltv/`. A documentação completa está em `docs/BIBLIA_RECONSTRUCAO.md` e `ltv/BIBLIA_RECONSTRUCAO.md`.


# 27. CPA Manager — integração

## 27.1 Navegação e rotas

Acesse **Avançado → CPA Manager**. O app está em `cpa/`, registrado por `cpa.apps.CpaConfig`, montado em `/cpa/` com namespace `cpa`. A dashboard usa `/cpa/`; API de leitura `/cpa/api/v1/metrics/`. O login/logout são os do projeto principal. Cadastro próprio e segundo banco foram removidos do fluxo integrado.

## 27.2 Dados e métricas

O app mantém tabelas próprias de `Platform`, `Channel`, `Campaign`, `PerformanceRecord`, `ImportBatch` e `IntegrationToken`, todos relacionados ao usuário central. Métricas: gasto, cliques, conversões, impressões, CPC, CPA, taxa de conversão e CTR. CPC/CPA calculados pela razão entre somas. A Home usa `cpa.analytics.build_dashboard_data(request.user)` igual ao dashboard CPA; o resumo cobre os últimos 30 dias e lista campanhas ativas/ não arquivadas em contador separado.

A função de agregação agrupa por data e campanha no banco, não percorre cada linha de desempenho para cada agrupamento. A importação aceita CSV/XLSX até 10 MB e 2.000 linhas, com prévia e confirmação em transação.

## 27.3 API e limite de integração

`GET /cpa/api/v1/metrics/` aceita sessão ou Bearer token individual por conta. Tokens são mostrados uma vez, armazenados por hash e revogáveis. A API retorna métricas agregadas, série diária e campanhas. Não existe OAuth, conector de anúncios ou sincronização automática. Uma conversão CPA não é uma comissão LTV/ROI nem uma aquisição individual.

## 27.4 Migrations, dependências e documentação

- `cpa/0001_initial.py`: schema.
- `cpa/0002_seed_existing_users.py`: dimensões padrão de plataformas/canais para usuários já existentes; idempotente.
- `cpa/signals.py`: defaults para novos usuários.
- Assets em `cpa/templates/cpa/` e `cpa/static/cpa/`.
- Dependências necessárias (Django, openpyxl, dj-database-url, psycopg, WhiteNoise) já constam no requirements principal; não usar requirements do projeto isolado.
- Documentação em `cpa/README.md` e `cpa/docs/`.

# 28. ROI Manager — integração

## 28.1 Navegação e rotas

Acesse **Avançado → ROI Manager**. O pacote `financeiro/` é registrado como `financeiro.apps.FinanceiroConfig` e usa namespace `roi` sob `/roi/`. A raiz do módulo é `/roi/`. Não copiar `config`, `manage.py`, `db.sqlite3`, login/cadastro ou deploy do ZIP independente.

## 28.2 Dados e fórmula

Modelos incluem marketplaces, canais, produtos, campanhas, investimentos (`Expense`), comissões (`Commission`), auditoria e automações. Todos os dados são associados ao usuário principal. A regra é `ROI (%) = ((comissões aprovadas - investimento total) / investimento total) × 100`; investimento zero produz ROI não calculável. Somente comissões aprovadas compõem a receita realizada; pendentes são indicador separado.

A Home chama `financeiro.services.indicadores.dashboard_metrics(request.user)`, a mesma função utilizada na dashboard ROI. Seu card mostra histórico padrão sem gravar uma cópia dos dados.

## 28.3 Automação local

`python manage.py executar_automacoes` executa uma passada; `python manage.py executar_automacoes --loop --interval 900` mantém processo separado. O diretório padrão é `ROI_INBOX_DIR` (por padrão `aflmain/data/inbox`), com pastas segmentadas por usuário. A rotina importa CSV e gera despesas recorrentes; não consulta APIs de marketplace nem deve rodar dentro dos web workers.

## 28.4 Migrations, assets e dependências

- `financeiro/0001_initial.py`: schema do app.
- Templates em `financeiro/templates/roi/`; estáticos em `financeiro/static/roi/`.
- `ROI_INBOX_DIR` está em `.env.example`; demais configurações são as do projeto principal.
- O `requirements.txt` principal permanece único; `openpyxl`, Django e dependências de banco já estão incluídos. `python-dotenv` do projeto isolado não é usado pelo módulo integrado.
- Docs em `financeiro/README.md` e `financeiro/BIBLIA_RECONSTRUCAO.md`.

## 28.5 Validação do conjunto integrado

```powershell
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test core ads_manager ltv cpa financeiro
```

A Home apresenta dados de TPB, LTV, CPA e ROI por serviços/fontes respectivas. Os domínios são intencionalmente independentes. Não fazer sincronização por nomes de campanha, data, valores coincidentes ou suposição de conversão = comissão.
