<<<<<<< HEAD
# Afillimetrics — Ecossistema de Automação para Afiliados

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

=======
>>>>>>> origin/main
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
- leitura de `DATABASE_URL`.

### `aflmain/urls.py`

Roteamento global. Registra o `/admin/` do Django e inclui as rotas do aplicativo `core`.

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
- ofertas.

A função `home()` também prepara os dados dos gráficos usando **pandas**.

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
