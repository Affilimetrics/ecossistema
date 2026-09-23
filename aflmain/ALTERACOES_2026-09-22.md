# Atualização — divulgação, templates e produtos quentes

## O que mudou

- Erros de Telegram/WhatsApp agora geram alertas persistentes por usuário.
- O processamento/coleta do produto não é perdido quando a divulgação falha.
- Nova página `/configuracoes/` para credenciais e automação por usuário.
- Tokens são criptografados em repouso usando a `SECRET_KEY` da aplicação.
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

As credenciais por usuário não são gravadas de volta no `.env`. O `.env` continua sendo usado para configurações globais/segredos da aplicação e como fallback inicial. Os tokens cadastrados pela interface ficam no banco de dados criptografados com uma chave derivada da `SECRET_KEY`.

**Não troque a `SECRET_KEY` de produção sem planejar uma migração dos tokens já gravados**, pois ela participa da criptografia.

## Ranking de Produtos Quentes

Como o projeto ainda não possui métricas reais de clique/conversão por produto, o ranking usa sinais disponíveis no banco: desconto, queda recente de preço, recência da coleta e validade do link afiliado. Quando houver métricas de clique/venda, elas podem substituir ou complementar esse score.
