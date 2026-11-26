# Bíblia de Reconstrução — Mercado Livre Afiliados

## 1. Responsabilidade

O app `mercado_livre` é o módulo web Django do Mercado Livre dentro da Skallora. Não é um app Node nem uma segunda instalação. A origem enviada foi um CLI Python independente com `requests`; esta implementação converte a lógica para views, forms, services, models e templates Django.

## 2. Mapa técnico

- `apps.py`: registra `MercadoLivreConfig`.
- `models.py`: credenciais por usuário, anúncio vinculado a Produto e histórico de busca.
- `forms.py`: valida termo, quantidade, site/timeout, URLs de afiliado e arquivo JSON de mapeamentos.
- `services.py`: cliente da API, validação de domínio, normalização Decimal, persistência transacional e atualização do link afiliado compartilhado.
- `views.py`: dashboard, busca, configuração, mapeamento individual/em lote e exportações.
- `urls.py`: namespace `mercado_livre`.
- `templates/mercado_livre/dashboard.html`: interface integrada à sidebar do core.
- `migrations/0001_initial.py`: tabelas do app, dependente de `core.0009`.
- `tests.py`: busca mockada, mapeamento, integração dashboard, isolamento e exportação.

## 3. Fonte de dados comum

`Produto` é a entidade de produto do ecossistema. Um produto do Mercado Livre recebe `marketplace="MERCADO_LIVRE"`, owner autenticado, categoria de busca, nome, URL, preços e imagem. `MarketplaceItem` liga o identificador externo àquele Produto. `Afiliado` guarda o link consumido pelo painel, Produto Chefe e módulos que precisam de link publicável.

O `owner` de Produto e o `user` de MarketplaceItem devem sempre corresponder. Nunca buscar ou editar o item apenas pelo ID sem filtrar pelo usuário autenticado.

## 4. Resolução de link

O link deve vir do portal oficial. O ID/apelido (`affiliate_id`) é somente metadado. Ao salvar a URL oficial no módulo, atualiza-se `MarketplaceItem.affiliate_url` e `core.Afiliado.link_afiliado` dentro de uma transação. Ao pesquisar novamente, o vínculo existente por ID/URL é preservado e reutilizado. Não apagar link previamente válido porque a API de busca não retornou informação de afiliado.

## 5. Integração de dashboard

A Home calcula:
- produtos totais: todos os `core.Produto` do usuário;
- links afiliados: Produtos com `core.Afiliado.link_afiliado` não vazio;
- gráfico por marketplace: `GROUP BY marketplace` em SQL, com os mesmos filtros de link;
- gráfico por categoria: agregação em SQL e agrupamento das palavras-chave desconhecidas em `Outros`.

Assim, Magalu e Mercado Livre compartilham totais. Um item pesquisado sem link oficial aparece no catálogo e na página do Mercado Livre, mas não deve ser contado como link afiliado. O resumo da tela do Mercado Livre é apenas um recorte dos mesmos registros.

## 6. Segurança e credenciais

- Views protegidas por `login_required` e operações de escrita por POST + CSRF.
- Todas as consultas são filtradas por `request.user`.
- Access Token por usuário usa `EncryptedTextField`; não renderizar o valor e não escrever token em logs.
- `CREDENTIAL_ENCRYPTION_KEY` deve ser preservada. Alternativa de token compartilhado: `ML_ACCESS_TOKEN` no ambiente.
- Timeout limitado entre 5 e 60 segundos nas configurações da conta; limite de 1 a 50 itens por consulta.
- URL original deve pertencer a domínio de anúncio do Mercado Livre (`mercadolivre.com.br`, `mercadolibre.com` ou `meli.la`).

## 7. Integridade e eficiência

- A resposta da API é validada antes de persistir.
- Busca normaliza valores monetários em Decimal; desconto só existe quando `original_price > price > 0`.
- `transaction.atomic()` mantém catálogo e metadados do item consistentes.
- Rebuscas por item reaproveitam o ID/URL e atualizam Produto em vez de duplicar o catálogo.
- Home agrupa dados no banco, sem materializar todos os registros em Pandas.
- Uma consulta API por termo; quantidade máxima 50. O módulo não mantém polling/worker contínuo.

## 8. Dependências e deploy

`requests` já consta no requirements principal. Não foi adicionado npm, Node, bundler, serviço novo nem banco adicional. `pandas` saiu do requirements porque deixou de ter uso no projeto. O deploy permanece no pipeline Django existente; `collectstatic` usa os estáticos globais já presentes.

## 9. Comandos

```bash
python manage.py migrate
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test mercado_livre core
```

## 10. Restrições de negócio

Não produzir tracking URLs por aproximação, não prometer comissão, não criar nem editar anúncios. A API serve à descoberta de produtos. A URL de afiliado é fornecida e verificada pelo próprio usuário através do fluxo oficial do programa.
