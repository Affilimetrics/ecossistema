# Mercado Livre — Skallora (Django)

Este app integra à Skallora a ferramenta de busca/afiliados entregue no ZIP `mercado_livre_afiliados.zip`.

## O que veio no ZIP de origem

O pacote original **não era npm/Node**. Era um utilitário de terminal em Python (`main.py`) com `requests`, configurado por `.env`, que consultava `GET https://api.mercadolibre.com/sites/MLB/search`, normalizava título/preço/preço original/desconto/URL, associava links oficiais por ID ou URL via `affiliate_links.json`, e exportava CSV e JSON.

A implementação integrada substitui o CLI por páginas Django autenticadas, usa o banco principal, mantém o usuário atual e o catálogo unificado e não inclui outro processo, servidor ou ambiente npm.

## Acesso

Abra **Marketplaces → Mercado Livre** na sidebar ou acesse `/mercado-livre/`.

## Funcionalidades

- Busca por palavra-chave com limite validado de 1 a 50 resultados.
- Tratamento de timeout, falhas de conexão, HTTP 401/403, HTTP 429, outros erros HTTP e JSON inesperado.
- Normalização de ID, título, preço atual, preço original, desconto calculável, URL original e thumbnail.
- Persistência dos resultados em `core.Produto` e metadados em `MarketplaceItem`.
- Configuração de Access Token por usuário, criptografado com `CREDENTIAL_ENCRYPTION_KEY`, ou token global de ambiente.
- Cadastro/alteração/remoção do link de afiliado oficial associado ao anúncio.
- Importação em lote de `affiliate_links.json` (até 1 MB), com mapeamento por ID externo ou URL original; entradas sem correspondência ou com URL inválida são informadas e ignoradas.
- Exportação CSV (UTF-8 BOM) e JSON com os mesmos campos centrais da ferramenta original.
- Histórico de buscas e erros por usuário.

## Links de afiliado

A implementação não inventa parâmetros de rastreamento e não transforma `ML_AFFILIATE_ID` em link. Gere a URL no Gerador oficial do Mercado Livre e cadastre no campo do produto. `MarketplaceItem.affiliate_url` mantém o vínculo por ID do anúncio e URL original; `core.Afiliado` é atualizado em conjunto para que o restante do ecossistema reconheça o link.

Produto sem link oficial permanece no catálogo com estado pendente; não aumenta o contador de links afiliados. Ao cadastrar o link, o produto entra automaticamente nos totais e no gráfico consolidado da Home.

O JSON em lote mantém o formato original, por exemplo:

```json
{
  "MLB123456789": "https://link-oficial-gerado-no-portal",
  "https://produto.mercadolivre.com.br/MLB-123456789": "https://outro-link-oficial"
}
```

O campo por ID tem precedência se o mesmo anúncio aparecer nas duas formas. O arquivo é processado sem ser salvo no servidor; limite de 1 MB.

## Configuração

Opcionalmente, configure no `.env`:

```ini
ML_ACCESS_TOKEN=
ML_SITE_ID=MLB
ML_AFFILIATE_ID=
ML_REQUEST_TIMEOUT=20
```

Também é possível salvar token por usuário na tela do módulo. O token em banco utiliza `core.fields.EncryptedTextField` e exige `CREDENTIAL_ENCRYPTION_KEY`; mantenha essa chave estável. O token nunca é renderizado de volta.

## Rotas

| Nome | Caminho |
|---|---|
| `mercado_livre:dashboard` | `/mercado-livre/` |
| `mercado_livre:search` | `/mercado-livre/buscar/` |
| `mercado_livre:save_settings` | `/mercado-livre/configuracoes/` |
| `mercado_livre:import_affiliate_mapping` | `/mercado-livre/importar-mapeamento/` |
| `mercado_livre:update_affiliate_link` | `/mercado-livre/produto/<id>/afiliado/` |
| `mercado_livre:export_csv` | `/mercado-livre/exportar/csv/` |
| `mercado_livre:export_json` | `/mercado-livre/exportar/json/` |

Todos os endpoints exigem sessão autenticada; mutações aceitam POST e CSRF.

## Atualização

```bash
python manage.py migrate
python manage.py check
python manage.py makemigrations --check --dry-run
python manage.py test mercado_livre core
```

`requests` já existia no `requirements.txt` principal. A integração não adiciona dependência nova. `pandas` foi removido da instalação principal porque seu único uso era a agregação na Home, agora feita pelo ORM.

## Limitações da API

O Mercado Livre controla autenticação, permissões, limites e disponibilidade. Uma consulta pode funcionar sem token em algumas condições; HTTP 401/403 exige revisar autorização e permissões. Preços e disponibilidade podem mudar depois da busca. Não há operação de criação/edição de anúncios.
