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

## Fila e revezamento de categorias

- Sem loop, cada categoria/categoria personalizada conclui seu lote configurado antes da próxima.
- Em loop, os alvos são reordenados a cada rodada para evitar prioridade fixa.
- Cada alvo em loop processa um lote de 2 produtos antes de liberar a fila para outro alvo.
- O restante dos produtos coletados fica em buffer e é retomado na próxima passagem, sem descartar itens da página.
- O loop não possui encerramento automático; a parada continua sob controle do usuário.
- Paginação permanece independente por alvo e volta à página 1 quando os resultados se esgotam.
