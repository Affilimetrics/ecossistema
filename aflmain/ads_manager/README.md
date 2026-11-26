# ads_manager — Tráfego Pago (TPB)

Este é o app Django integrado a Afillimetrics/Skallora a partir do ZIP TPB atual.

- Prefixo: `/trafego-pago/`
- Namespace: `ads_manager`
- Autenticação: usuário/sessão Django do Afillimetrics (`/login/`)
- Banco: o mesmo `DATABASE_URL`/SQLite do projeto principal
- Provedor operacional nesta versão: Meta Ads, em modo somente leitura
- Criptografia de tokens: variável Fernet `TOKEN_ENCRYPTION_KEY`

Não copie um `config/`, `manage.py`, settings, urls, banco, login ou requirements autônomos para este app. As telas e os dados de campanha são integrados ao app principal. Home e área TPB compartilham as tabelas `ConnectedAccount`, `AdAccount` e `Campaign`, com sincronização centralizada em `services/campaign_sync.py`.

Para configuração da Meta, callback OAuth, migrations, dependências, segurança e procedimentos de reconstrução, consulte [`../docs/BIBLIA_RECONSTRUCAO.md`](../docs/BIBLIA_RECONSTRUCAO.md) e a seção 25 do [`../README.md`](../README.md).
