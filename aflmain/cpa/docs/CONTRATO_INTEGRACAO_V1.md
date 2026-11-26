# Contrato de integração — CPA Manager / ROI Manager / LTV Manager

**Versão:** 1.0 · **Escopo implementado:** API de métricas do CPA em leitura, sessão Django ou Bearer token por usuário.

## 1. Arquitetura atual

CPA Manager, ROI Manager e LTV Manager estão instalados no mesmo projeto Django Afillimetrics / Skallora, compartilham autenticação central e banco de dados físico. Cada ferramenta, entretanto, conserva modelos, tabelas, regras e rotas namespaced próprios. Não há serviço, banco, settings ou servidor separado para cada uma.

A integração entre a Home e cada módulo é feita por serviços internos, com uma fonte de dados por métrica: CPA usa `cpa.analytics.build_dashboard_data`; ROI usa `financeiro.services.indicadores.dashboard_metrics`; LTV usa `ltv.analytics.metrics.dashboard_metrics`. A Home não persiste cópias dos valores.

## 2. O que não é sincronizado

- O gasto e as conversões registrados no CPA não são copiados para as despesas e comissões do ROI.
- Comissões e aquisições do LTV não são copiadas para o ROI.
- Uma conversão agregada não é uma comissão aprovada nem uma aquisição individual.
- Não existe sincronização automática de plataformas de anúncios ou marketplaces.

Qualquer sincronização futura precisa usar IDs externos estáveis, origem, conta, moeda, período, idempotência e evidência de atribuição. Não usar o nome da campanha, coincidência de data ou valor como chave.

## 3. API implementada

### `GET /cpa/api/v1/metrics/`

Requer sessão Django válida ou `Authorization: Bearer <token>` emitido na tela **CPA Manager → Integrações**. Retorna `schema_version=1.0`, `currency=BRL`, período, totais (`spend`, `clicks`, `conversions`, `impressions`, `cpc`, `cpa`, `conversion_rate_percent`), série diária e campanhas agregadas. `id` interno de campanha é omitido da resposta por conta; `integration_key` e `external_id` podem ser usados no mapeamento explícito.

Parâmetros opcionais: `start=YYYY-MM-DD` e `end=YYYY-MM-DD`. Padrão: últimos 30 dias. Intervalo máximo: 10 anos. Respostas são `private, no-store`. O token determina o usuário da consulta; não existe parâmetro que permita selecionar outra conta.

## 4. Chaves e correspondência recomendada

`Campaign.integration_key` deve ser uma chave estável definida pelo usuário; `Campaign.external_id` armazena o identificador no provedor. Para integração com campanhas do ROI/LTV, manter tabela de mapeamento com: `source_system`, `source_account_id`, `source_object_type`, `source_object_id`, `target_system`, `target_object_type`, `target_object_id`, `mapping_status`, `created_at`, `updated_at`.

A API é read-only. Tokens são gerados aleatoriamente, guardados como hash, revelados uma única vez, limitados à conta emissora e revogáveis. Usar HTTPS e gestão de segredos em qualquer consumidor externo.

## 5. Limites e próximos passos

Não implementados: conectores OAuth, webhooks, sincronização automática, atribuição individual, múltiplas moedas, ROAS, lucro líquido, rate limiting avançado e auditoria completa das chamadas. Não enviar dados pessoais de consumidores.
