# Implementação do Skallora Desktop — arquitetura, integração e operação

> Esta documentação descreve o que foi adicionado nesta entrega, os limites que permanecem e o procedimento para executar e compilar no Windows. O desktop é uma nova interface de operação; o Django continua sendo a fonte central de dados.

## 1. Resultado da implementação

A solução ficou dividida em três partes:

1. **Django (`core/desktop_api.py`)**: autenticação do desktop, API para consultar painel/produtos/execuções/logs e comandos para a Central Magalu.
2. **Aplicativo Windows (`desktop_app/`)**: interface PySide6 com Visão geral, Coleta Geral, Central Magalu, Mercado Livre, Produtos e Execuções.
3. **Integração Mercado Livre (`desktop_app/integrations/mercado_livre/`)**: o script Playwright fornecido foi copiado integralmente e preservado. O app o executa como processo filho e interpreta a saída textual para importar títulos e URLs para o banco Django.

Não foi criada uma segunda base de dados para o desktop. Produtos, ofertas, execuções e logs continuam no banco configurado pelo Django.

## 2. Estrutura adicionada

```text
aflmain/
├── core/
│   ├── desktop_api.py              # API autenticada para o aplicativo
│   ├── test_desktop_api.py         # testes de autenticação/isolamento
│   └── urls.py                     # rotas /api/desktop/
├── aflmain/
│   └── settings.py                 # chave/validade de tokens desktop
├── desktop_app/
│   ├── src/
│   │   ├── main.py                 # interface e coordenação dos coletores
│   │   ├── api_client.py           # cliente HTTP autenticado
│   │   └── ml_output.py             # interpretação da saída do coletor ML
│   ├── integrations/mercado_livre/
│   │   ├── mercado_livre_busca.py  # arquivo original, sem alteração
│   │   └── README_ORIGINAL.md       # documentação original preservada
│   ├── tests/test_ml_output.py
│   ├── requirements.txt
│   ├── Skallora.spec
│   ├── build_windows.bat
│   └── README.md
└── docs/
    └── IMPLEMENTACAO_DESKTOP.md
```

## 3. API Django

Todas as rotas, exceto login, exigem `Authorization: Bearer <token>`.

| Método | Rota | Uso |
|---|---|---|
| POST | `/api/desktop/login/` | Autenticar e emitir token |
| GET | `/api/desktop/me/` | Validar sessão e obter usuário |
| GET | `/api/desktop/dashboard/` | Métricas, Produto Chefe, alertas e últimas execuções |
| GET | `/api/desktop/products/` | Listar produtos do usuário; aceita `marketplace`, `limit`, `offset` |
| GET | `/api/desktop/executions/` | Listar execuções do usuário |
| GET | `/api/desktop/logs/` | Consultar logs do usuário com `since` e `execution_id` |
| POST | `/api/desktop/executions/create/` | Criar execução para ferramenta desktop, atualmente Mercado Livre |
| POST | `/api/desktop/executions/<id>/finish/` | Finalizar execução desktop |
| POST | `/api/desktop/products/ingest/` | Importar produto coletado localmente |
| GET | `/api/desktop/magalu/status/` | Estado e progresso do controlador Magalu |
| POST | `/api/desktop/magalu/start/` | Iniciar a coleta Magalu |
| POST | `/api/desktop/magalu/pause/` | Solicitar pausa |
| POST | `/api/desktop/magalu/resume/` | Retomar a mesma execução pausada |
| POST | `/api/desktop/magalu/stop/` | Solicitar parada segura |
| GET | `/api/desktop/magalu/logs/` | Consultar os logs da Central Magalu |

### 3.1 Autenticação

- O login valida usuário e senha usando o backend de autenticação nativo do Django.
- O servidor emite token assinado com prazo padrão de 30 dias.
- O token contém o identificador do usuário e o hash de sessão Django; não contém a senha.
- Alterar a senha ou trocar a chave de assinatura invalida tokens anteriores.
- O botão Sair remove a cópia local do token do Gerenciador de Credenciais; por ser um token assinado sem tabela de sessões, uma cópia previamente extraída ainda seria válida até expirar ou até a senha/chave ser alterada.
- A API filtra produtos, execuções e logs pelo usuário autenticado.
- O cliente rejeita HTTP para endereços remotos; use HTTPS fora de `localhost`/`127.0.0.1`.

Configure no `.env`:

```env
DESKTOP_API_SIGNING_KEY=gere-uma-chave-aleatoria-forte-e-mantenha-em-segredo
DESKTOP_API_TOKEN_MAX_AGE=2592000
```

`DESKTOP_API_SIGNING_KEY` pode ficar vazio para usar o `SECRET_KEY` do Django como fallback. Em produção, prefira uma chave própria, estável, secreta e diferente das chaves de canais de divulgação. Não coloque chaves reais no Git.

O desktop tenta armazenar o token no Gerenciador de Credenciais do Windows por meio do `keyring`. Se esse armazenamento não estiver disponível, o token é mantido somente na memória do processo.

### 3.2 Persistência e compatibilidade

A API usa os modelos existentes `Produto`, `Afiliado`, `Execucao`, `LogExecucao` e `HistoricoPreco`. O campo `marketplace` existente diferencia `MAGALU` e `MERCADO_LIVRE`.

**Correção desta revisão:** o pacote agora inclui migrations versionadas `0001` a `0009` para o app `core`. As migrations `0001` a `0008` foram recuperadas do histórico do próprio projeto; a referência da migration `0008` foi ajustada para apontar ao nome real do arquivo `0007_loop_categorias_e_perfil_timezone.py`. A migration `0009` adiciona os indicadores de comissão/vendas/lucro a `Produto` e cria `ProgressoColeta`. Isso corrige a ausência de `core_perfilusuario` causada pela entrega anterior sem migrations. Faça backup do banco antes de aplicar migrations em uma instalação com dados.

## 4. Aplicativo desktop

A interface contém:

- **Visão geral**: métricas, Produto Chefe e últimas execuções.
- **Coleta Geral**: seleção Magalu/Mercado Livre e parâmetros simplificados.
- **Central Magalu**: categorias, palavras-chave, listas de loop, iniciar, pausar, retomar, parar e logs atualizados por polling.
- **Mercado Livre**: busca local, quantidade até 50, janela de navegador e saída do processo.
- **Produtos**: tabela filtrável por marketplace.
- **Execuções**: histórico compartilhado com o site.

O cliente utiliza `requests` com timeout e autenticação Bearer. Não mantém um banco local separado.

## 5. Integração do coletor Mercado Livre

### 5.1 O que foi preservado

O arquivo `mercado_livre_busca.py` do anexo foi copiado para `desktop_app/integrations/mercado_livre/` sem mudanças no código. O README original também foi mantido como `README_ORIGINAL.md`.

O aplicativo inicia um processo filho do próprio programa (`--ml-child`) e entrega ao script original as entradas que antes eram digitadas no terminal. Quando o script chega à etapa que solicita confirmação da página, o desktop exibe uma janela para que o usuário finalize login/CAPTCHA manualmente e confirme a continuação.

O perfil persistente é criado em:

```text
%LOCALAPPDATA%\Skallora\mercado_livre\ml_session_cache
```

### 5.2 Importação dos produtos

A integração lê blocos impressos pelo script no formato `título`, `Preço` e `Link`. Cada URL é validada para domínios do Mercado Livre e enviada à API para criar/atualizar `Produto`, criar/atualizar `Afiliado` com status `REVISAR` e registrar log na execução.

O script original captura apenas a fração do preço (`.andes-money-amount__fraction`), sem centavos. Para evitar salvar um número enganoso, o preço exibido fica no log e o campo numérico do produto permanece vazio. O coletor também não gera link oficial de afiliado; o produto é importado sem link de afiliado, em revisão.

A ferramenta não adiciona identificador/apelido de afiliado ao URL e não tenta fabricar links oficiais. A associação do link deve seguir o fluxo oficial do marketplace.

## 6. Integração da Central Magalu — limite de execução

A interface desktop chama a mesma API e o mesmo `ControladorBot` Magalu já existentes. Assim, estados, logs, checkpoints, persistência e regra de parada são reaproveitados, em vez de duplicar o coletor.

**Importante:** nesta primeira integração, a thread Selenium do Magalu continua sendo executada no processo/host Django, não dentro do processo desktop. O `magalu_bot/config/config.py` configura o Chrome remoto em `127.0.0.1:9222`. Portanto:

- Para desenvolvimento local, execute Django no mesmo computador que tem o Chrome configurado para debugging remoto.
- Se o Django estiver em Render ou em outro servidor, a API desktop não torna o Chrome local acessível ao servidor. Nesse cenário, o start Magalu só funcionará depois que houver um worker/agent dedicado no computador do usuário ou em uma máquina de automação com Chrome. A documentação original do projeto já recomenda separar Selenium do Web Service.
- O coletor Mercado Livre, por outro lado, abre o Chrome diretamente no computador que executa o aplicativo desktop.

Essa diferença é intencionalmente documentada para não prometer uma execução Magalu local que a estrutura original, acoplada ao ORM e ao processo Django, ainda não suporta.

## 7. Passo a passo de execução local

### 7.1 Backend

Abra o terminal na pasta `aflmain` (a que contém `manage.py`).

PowerShell:

```powershell
py -3 -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
copy .env.example .env
```

O comando `py -3` usa a versão padrão do Python 3 detectada pelo launcher. Python 3.12 é recomendado; o ambiente pode usar Python 3.14 quando as dependências instaladas forem compatíveis.

Edite `.env`: defina `SECRET_KEY`, `DEBUG=True`, `ALLOWED_HOSTS=127.0.0.1,localhost` e uma `DESKTOP_API_SIGNING_KEY` própria. Depois:

```powershell
python manage.py check
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

O pacote inclui as migrations do app `core`. Execute `python manage.py migrate` para aplicar tanto as migrations nativas do Django quanto as migrations do projeto. Faça backup de `db.sqlite3` antes de atualizar uma instalação já utilizada. Não apague o banco para corrigir erros de migration.

### 7.2 Desktop em modo Python

Em outro terminal:

```powershell
cd desktop_app
py -3 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
python src\main.py
```

Se o comando `py -3` não estiver disponível, use `python -m venv .venv` com o Python instalado e adicionado ao PATH.

No login, informe `http://127.0.0.1:8000` e as credenciais da conta Django.

### 7.3 Build do executável

Em Windows com Python 3.12 (preferencial) ou outra versão suportada pelas dependências, e Chrome instalado:

```powershell
cd desktop_app
.\build_windows.bat
```

O resultado esperado é:

```text
desktop_app/dist/Skallora/Skallora.exe
```

Distribua a pasta `dist/Skallora` inteira, não apenas o executável. O build usa PyInstaller em modo `onedir`, que facilita diagnosticar dependências nativas de Qt/Playwright.

## 8. Testes disponíveis

Testes adicionados:

- `core/test_desktop_api.py`: login, sessão, isolamento de produtos por proprietário, proteção contra importação em execução de outro usuário e bloqueio sem token.
- `desktop_app/tests/test_ml_output.py`: leitura de vários resultados e rejeição de URL ausente/inválida.

Com Django e dependências de backend instalados:

```powershell
python manage.py check
python manage.py test core.test_desktop_api
python manage.py test core
```

Com o Python do desktop:

```powershell
python -m unittest discover -s tests -v
python -m py_compile src\main.py src\api_client.py src\ml_output.py
```

O teste real de navegador exige Chrome instalado, sessão válida e acesso ao Mercado Livre. O build do PyInstaller também precisa ser executado no Windows; não é possível gerar um binário Windows confiável a partir do ambiente Linux.

## 9. Limites conhecidos e próximos passos recomendados

1. Implementar um **agent/worker local Magalu** que receba tarefas pela API e faça callbacks de logs/produtos; assim o Selenium roda na máquina do usuário, mesmo com Django remoto.
2. Adicionar uma extração confiável de preço completo no Mercado Livre, com centavos, sem assumir que a fração é o preço inteiro.
3. Criar a etapa oficial de associação de links afiliados Mercado Livre.
4. Adicionar atualização em tempo real via WebSocket ou SSE caso o polling atual se torne insuficiente.
5. Fazer build, teste de instalação limpa e teste de navegador em Windows 10/11 antes da distribuição.

## 10. Segurança operacional

- Não versionar `.env`, tokens, perfis de navegador, cookies ou credenciais.
- Não compartilhar `ml_session_cache` entre usuários.
- Usar HTTPS para API remota.
- Não distribuir `SECRET_KEY`, `DESKTOP_API_SIGNING_KEY`, tokens de canais ou credenciais de marketplace.
- Manter o app e o Django atualizados.
- Respeitar os termos, limites e mecanismos de acesso do Mercado Livre; login e CAPTCHA são ações manuais do usuário quando solicitadas.
