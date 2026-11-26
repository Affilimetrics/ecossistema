# CPA Manager — integração no Django principal

O CPA Manager já está incorporado ao Afillimetrics / Skallora. Este documento descreve a arquitetura efetiva e substitui o procedimento de cópia manual do app.

## Registro e URLs

- App: `cpa.apps.CpaConfig` em `INSTALLED_APPS`.
- Rotas: `path("cpa/", include("cpa.urls", namespace="cpa"))`.
- Namespace: `cpa:`.
- Dashboard: `cpa:dashboard` → `/cpa/`.
- API: `cpa:api_metrics` → `/cpa/api/v1/metrics/`.
- Autenticação: sessão central do Django; `LOGIN_URL=/login/`; logout central em `/logout/`.

Não inclua `cpa/config`, `manage.py`, settings, WSGI/ASGI ou `db.sqlite3` do pacote independente. Não habilite cadastro local.

## Dados e integração entre ferramentas

O banco principal contém as tabelas do app `cpa`. Todos os modelos pertencem a `settings.AUTH_USER_MODEL`. As telas da Home e do CPA usam `build_dashboard_data(user)`; a agregação é executada no banco por data e campanha. A Home mostra o resumo dos últimos 30 dias.

O endpoint `GET /cpa/api/v1/metrics/` retorna `schema_version=1.0`, moeda BRL, período, totais, série diária e métricas por campanha. Requer sessão Django válida ou `Authorization: Bearer <token>`. Os tokens são gerados na tela **Integrações**, exibidos uma vez, armazenados por hash e revogáveis.

CPA, ROI e LTV compartilham autenticação e banco, mas não compartilham automaticamente registros financeiros nem atribuição. O integrador futuro deve usar `integration_key` e `external_id` com mapeamento explícito, nunca nomes/textos ou datas como chave. Uma conversão agregada no CPA não identifica uma comissão ou aquisição específica.

## Migrations e dados padrão

- `0001_initial`: tabelas do CPA.
- `0002_seed_existing_users`: cria plataformas e canais padrão para usuários já existentes, via `get_or_create`.
- `cpa/signals.py`: cria dimensões padrão para novos usuários.

Execute `python manage.py migrate`. Não rode `flush`, não apague o banco e não copie SQLite entre projetos.

## Assets e templates

- Templates em `cpa/templates/cpa/`.
- Estáticos em `cpa/static/cpa/`, carregados com prefixo `cpa/`.

O prefixo impede colisões com `core`, `ads_manager`, `ltv` e `financeiro`/ROI.

## Validação

```bash
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test cpa core.test_advanced_tools
```

A integração não adiciona um novo processo web, settings, ambiente virtual ou dependência exclusiva. Consulte `../README.md` e `BIBLIA_RECONSTRUCAO.md`.
