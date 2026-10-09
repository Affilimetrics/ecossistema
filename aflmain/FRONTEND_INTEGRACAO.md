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

- Não foram alterados Models, views, endpoints, rotas, serviços de negócio, migrações ou automações Selenium.
- Não foram adicionadas dependências Python ou Node.
- O script `iniciar.bat` foi preservado; continua sendo o ponto de inicialização local.
- Os novos arquivos estáticos são `core/static/core/auth-ui.css` e `core/static/core/dashboard-ui.js`; `core/static/core/sidebar.css` contém o sistema visual compartilhado.
