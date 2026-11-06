# Skallora Desktop

Aplicativo Windows em PySide6 para acessar a API do Django, acompanhar produtos e execuções, controlar a Central Magalu e executar localmente o coletor Mercado Livre anexado.

## Build

Requisitos: Windows 10/11 e Google Chrome instalado. Python 3.12 é recomendado; o script tenta usar essa versão e, se não estiver instalada, tenta o Python padrão detectado pelo launcher (por exemplo, 3.14).

1. Abra esta pasta no Windows.
2. Execute `build_windows.bat`. O script procura Python 3.12 primeiro e usa `py -3` ou `python` como alternativa.
3. Se a instalação de dependências falhar por indisponibilidade de wheels para sua versão do Python, instale Python 3.12 e repita o build.
4. Aguarde a instalação das dependências e a compilação.
5. Execute `dist/Skallora/Skallora.exe`.
6. Distribua a pasta completa `dist/Skallora/`.

O coletor Mercado Livre utiliza `channel="chrome"`; por isso o Chrome instalado é necessário. O perfil persistente do navegador fica em `%LOCALAPPDATA%\Skallora\mercado_livre\ml_session_cache`.

## Conexão

Informe a URL do Django no login. Para desenvolvimento local: `http://127.0.0.1:8000`. Para servidor remoto, use HTTPS. O aplicativo não grava a senha; quando o backend do Windows oferece suporte, o token é salvo pelo `keyring` no Gerenciador de Credenciais. Se o armazenamento seguro não estiver disponível, a sessão permanece apenas na memória daquela execução.

## Limitações operacionais da versão inicial

- A Central Magalu chama o controlador Magalu existente por meio da API Django. Portanto, o processo Selenium Magalu executa na máquina/processo que hospeda o Django e precisa ter o Chrome remoto na porta configurada em `magalu_bot/config/config.py`. Em uma hospedagem como Render, essa configuração não torna o Chrome do computador do usuário acessível; use Django e Chrome no mesmo computador ou configure um worker local/remoto dedicado antes de operar Magalu em produção.
- O coletor Mercado Livre é executado no computador do usuário. O arquivo `integrations/mercado_livre/mercado_livre_busca.py` foi copiado sem alterações do anexo e roda em processo filho do próprio executável.
- O script Mercado Livre original extrai a fração exibida do preço, sem os centavos. Para não gravar valores incorretos, a integração salva título e URL; o preço aparece nos logs, mas não é persistido como valor numérico.
- O script Mercado Livre não produz link oficial de afiliado. Os produtos entram como `REVISAR`, sem link afiliado; o usuário deve completar a associação pelo fluxo oficial de afiliados.
- Parar forçadamente uma busca Mercado Livre encerra o processo filho. Se o Chrome continuar aberto, feche-o manualmente; o perfil persistente permanece.

Consulte `../docs/IMPLEMENTACAO_DESKTOP.md` para a arquitetura e o passo a passo completo.
