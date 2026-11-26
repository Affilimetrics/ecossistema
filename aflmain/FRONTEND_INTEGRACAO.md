# Integração visual do frontend Skallora

Esta versão aplica a linguagem visual do frontend React anexado às telas Django já existentes. A integração mantém o Django Templates como camada de apresentação e não introduz uma segunda aplicação React em produção.

## Telas adaptadas

- **Página inicial pública:** apresentação dos recursos que já existem no projeto, com links para cadastro, login e páginas operacionais.
- **Login e cadastro:** nova composição responsiva inspirada nos formulários do anexo; nomes dos campos, CSRF, validação e envio continuam conectados às views atuais.
- **Visão geral:** cards, hierarquia visual, estados de hover, gráficos e Produto Chefe utilizam os dados já enviados pela view `home`.
- **Coleta Geral:** a apresentação usa a nova linguagem visual, mantendo os controles, a seleção de categorias, loops, categoria personalizada, polling e comandos já existentes.
- **Produtos Quentes:** cartões e filtros usam os objetos reais do ranking Django; não são usados os produtos, preços, datas ou links fictícios da demonstração React.
- **Demais telas autenticadas:** compartilham a sidebar redesenhada e os estilos globais.

## Interações visuais incluídas

- Sidebar recolhível, com preferência salva no navegador.
- Alternância entre tema claro e escuro, com preferência salva no navegador.
- Estados de hover, foco, seleção, cards e botões.
- Layout responsivo para telas menores.
- Transições suaves respeitando a preferência do sistema por movimento reduzido.
- Alternância de visibilidade de senha nas telas de login e cadastro.

## Componentes demonstrativos deixados de fora

O anexo continha indicadores e interações locais sem integração com o Django, incluindo receita demonstrativa, listas de produtos fixas, notificações inventadas e atalhos para áreas sem funcionalidade correspondente. Esses itens não foram ligados a dados falsos. A tela adaptada prioriza os recursos operacionais existentes.

## Compatibilidade e inicialização

As observações acima descrevem a integração visual original. Na revisão de 18/11/2026, o módulo TPB também passou a integrar o mesmo frontend Django: ele reutiliza autenticação, sidebar, tema, layout de navegação e sessão do projeto principal. O TPB adiciona seus próprios modelos, views, URLs, migrations, dependências e folhas de estilo; não cria uma aplicação React ou um segundo servidor.

A navegação **Avançado** é recolhível e revela **Tráfego Pago**. As telas internas do TPB usam uma navegação secundária para Visão geral, Ativos, Campanhas e Métricas. A Home exibe campanhas ativas a partir da mesma fonte persistida que o módulo TPB.

O script `iniciar.bat` foi preservado; continua sendo o ponto de inicialização local. Os arquivos de sidebar e tema continuam em `core/static/core/`; o CSS específico TPB está em `ads_manager/static/ads_manager/css/app.css`.

Para detalhes de rotas, dados, migrations e configuração da Meta, consulte `docs/BIBLIA_RECONSTRUCAO.md`.


## Ferramentas avançadas incorporadas (25/11/2026)

A sidebar global apresenta **Avançado** como seção recolhível com quatro destinos: Tráfego Pago (`ads_manager`), LTV Manager (`ltv`), CPA Manager (`cpa`) e ROI Manager (`roi`). A seção abre automaticamente quando a rota atual pertence a um desses namespaces. As interfaces CPA e ROI preservam seu sistema visual interno e incluem retorno ao Workspace.

A Home contém cards-resumo de TPB, LTV, CPA e ROI. CPA e ROI foram conectados pela mesma função de métricas que cada dashboard completo utiliza: `cpa.analytics.build_dashboard_data` (últimos 30 dias; a Home usa o modo de totais sem séries/lista detalhada) e `financeiro.services.indicadores.dashboard_metrics` (histórico padrão). Esses valores não são copiados para tabelas-resumo. Os domínios de CPA, ROI e LTV permanecem separados e sem atribuição automática.
