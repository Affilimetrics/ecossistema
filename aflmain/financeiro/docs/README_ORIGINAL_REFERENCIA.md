> Documento histórico de origem. Referência preservada para rastreabilidade; não seguir procedimentos de instalação isolada. A arquitetura vigente está em `../BIBLIA_RECONSTRUCAO.md` e `../README.md`.

# ROI Manager

Aplicação web independente para controle financeiro de operações de afiliados. O projeto organiza investimentos, comissões, produtos e campanhas, calcula o retorno sobre investimento (ROI) e oferece rotinas locais de importação CSV e despesas recorrentes. Foi estruturado para funcionar isoladamente agora e permitir integração futura com o ecossistema Skallora.

> **Ambiente documentado:** Windows 10/11, Prompt de Comando (CMD), Python 3.11 ou superior e Django 5.2.

## 1. Identidade visual

A interface utiliza a paleta definida para o projeto:

| Uso | Cor | Hexadecimal |
|---|---|---|
| Fundo e identidade principal | Verde | `#018D3E` |
| Superfícies, cards e áreas claras | Creme | `#FDF7E6` |
| Alertas, prejuízos e pequenos destaques | Vermelho | `#E71506` |

O visual aplica glassmorphism com transparência, `backdrop-filter`, bordas translúcidas e sombras difusas. A interface é responsiva, utiliza templates Django e CSS/JavaScript locais. As fontes DM Sans e Manrope são carregadas do Google Fonts quando há conexão com a internet; existem fontes de sistema como fallback.

## 2. Requisitos

- Windows 10 ou Windows 11.
- Python 3.11 ou superior, adicionado ao `PATH`.
- Acesso à internet durante a instalação das dependências.
- CMD (Prompt de Comando). Os scripts `.bat` não exigem PowerShell.

## 3. Instalação pelo CMD

1. Extraia o ZIP em uma pasta permanente, por exemplo `C:\Projetos\roi_manager`.
2. Abra o CMD nessa pasta. Uma forma simples é abrir a pasta no Explorador de Arquivos, clicar na barra de endereço, digitar `cmd` e pressionar Enter.
3. Execute:

```cmd
scripts\preparar_ambiente.bat
```

O script cria o ambiente virtual `venv`, copia `.env.example` para `.env` (sem sobrescrever um `.env` que já exista), instala as dependências, aplica a migração inicial incluída no projeto e executa `manage.py check`.

### Instalação manual, se preferir

```cmd
python --version
python -m venv venv
venv\Scripts\activate.bat
copy .env.example .env
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py check
```

A migração `financeiro/migrations/0001_initial.py` já acompanha o projeto. Não é necessário executar `makemigrations` na instalação normal.

## 4. Iniciar o sistema

Com o CMD aberto na raiz do projeto:

```cmd
scripts\iniciar_servidor.bat
```

Acesse no navegador:

**http://127.0.0.1:8000/**

Para iniciar manualmente:

```cmd
venv\Scripts\activate.bat
set DEBUG=True
python manage.py runserver 127.0.0.1:8000
```

Mantenha a janela do servidor aberta enquanto estiver utilizando o sistema. Para encerrar, pressione `CTRL+C`.

## 5. Primeiro acesso e configuração

1. Abra `http://127.0.0.1:8000/` e selecione **Criar conta**.
2. Depois do cadastro, o sistema prepara automaticamente opções iniciais de marketplaces: Magalu, Mercado Livre, Amazon, Shopee e Outros.
3. Também são criados canais iniciais: Telegram, WhatsApp, Instagram, TikTok, YouTube, Facebook, Site/Blog e Outros.
4. Cadastre investimentos e comissões para que os indicadores do dashboard comecem a refletir sua operação.
5. Cadastre produtos e campanhas para organizar os registros. Os campos de relacionamento são limitados aos dados da própria conta.

As opções iniciais são criadas por usuário. Para cadastrar marketplaces ou canais adicionais, entre no painel administrativo `/admin/` usando uma conta de superusuário.

## 6. Como utilizar as áreas

### Visão geral

O dashboard apresenta comissões aprovadas, investimento total, lucro/prejuízo, ROI, comissões pendentes e semáforo financeiro. Os filtros permitem consultar período e marketplace.

### Investimentos

Registre cada custo com descrição, valor, data, categoria e relacionamentos opcionais. As categorias incluem tráfego pago, anúncios, ferramentas, assinaturas, conteúdo, terceirizados, operação e outros. A área permite filtrar, exportar CSV e importar CSV.

### Comissões

Registre o valor da comissão (não o valor bruto da venda), marketplace, data e status. Os estados são pendente, aprovada, cancelada e reembolsada. Somente comissões aprovadas entram na receita realizada usada no ROI.

### Produtos e campanhas

Cadastre produtos vinculados a marketplaces e campanhas que podem agrupar marketplace, canal e produtos. Essas associações ajudam a organizar os dados, mas não criam atribuição automática de vendas.

### Importação manual de investimentos

Na área **Investimentos → Importar CSV**, envie um arquivo UTF-8 com as colunas:

```csv
descricao;valor;data;categoria
Hospedagem;39,90;2026-11-17;assinaturas
```

O sistema valida os registros, apresenta uma prévia e só grava os itens depois de clicar em **Confirmar importação**. Categorias aceitas: `trafego`, `anuncios`, `ferramentas`, `assinaturas`, `conteudo`, `terceiros`, `operacao`, `outros`.

## 7. Cálculo do ROI

A regra aplicada é:

```text
ROI (%) = ((comissões aprovadas - investimento total) / investimento total) * 100
```

Exemplo: R$ 500,00 em comissões aprovadas e R$ 200,00 em investimentos resultam em lucro operacional de R$ 300,00 e ROI de 150%.

- **Verde:** ROI positivo acima da faixa de equilíbrio.
- **Amarelo:** ROI entre 0% e 5% (faixa de equilíbrio definida atualmente no serviço de cálculo).
- **Vermelho:** ROI negativo.
- **Cinza:** sem investimento ou dados insuficientes para calcular.

Quando o investimento é zero, o ROI é exibido como não calculável. Comissões pendentes, canceladas e reembolsadas não compõem a receita aprovada. O valor bruto da venda/GMV não é tratado como receita do afiliado.

Os cálculos monetários usam `Decimal`, não `float`.

## 8. Automações locais

A automação é executada em um processo local separado do servidor web. Abra **outro CMD** na raiz do projeto e execute:

```cmd
scripts\iniciar_automacao.bat
```

A janela precisa permanecer aberta. Para interromper, pressione `CTRL+C`.

O processo pode:

- Importar arquivos CSV colocados nas pastas de entrada do usuário.
- Evitar reprocessamento do mesmo arquivo usando hash SHA-256.
- Mover arquivos processados para `processados` e arquivos com falha para `com_erros`.
- Gerar investimentos recorrentes vencidos conforme as regras cadastradas.
- Registrar eventos de sucesso e erro na Central de automação.

### Pastas e formatos da automação

Quando a pasta de entrada personalizada está vazia, o diretório padrão é:

```text
data\inbox\<ID_DO_USUARIO>\
    investimentos\
    comissoes\
```

O importador cria automaticamente as subpastas `processados` e `com_erros` em cada tipo.

CSV de investimentos:

```csv
descricao;valor;data;categoria
Hospedagem;39,90;2026-11-17;assinaturas
```

CSV de comissões:

```csv
marketplace;comissao;pedido;transacao;data;status;valor_venda
Magalu;12,50;PED-001;TRX-001;2026-11-17;aprovada;199,90
```

Para comissões, `marketplace` e `comissao` são obrigatórios. `pedido`, `transacao`, `data`, `status` e `valor_venda` são opcionais. Status aceitos incluem `pending`, `approved`, `cancelled`, `refunded` e as formas em português reconhecidas pelo importador. Arquivos repetidos com o mesmo conteúdo não são importados novamente.

A frequência de execução é definida na Central de automação. O processo é local: o computador precisa estar ligado e o CMD da automação precisa permanecer em execução.

## 9. Backups e dados

- Banco padrão: `db.sqlite3` na raiz do projeto.
- Arquivo de configurações e segredo local: `.env`.
- Para criar/atualizar uma cópia do banco, execute `scripts\gerar_backup.bat`.
- O backup será gravado em `backups\db_latest.sqlite3`.
- Faça backup do banco e guarde uma cópia segura do `.env` antes de atualizar o projeto ou migrar o banco.

**Não apague `db.sqlite3` para resolver erros de tela ou de CSS.** Isso remove os dados financeiros locais.

## 10. Verificações e testes

Execute pelo CMD:

```cmd
scripts\verificar_projeto.bat
```

Esse script verifica referências do CSS/JavaScript, paleta e glassmorphism, executa `manage.py check` e roda os testes automatizados. Também é possível executar manualmente:

```cmd
venv\Scripts\python.exe scripts\verificar_frontend.py
venv\Scripts\python.exe manage.py check
venv\Scripts\python.exe manage.py makemigrations --check --dry-run
venv\Scripts\python.exe manage.py test financeiro.tests
```

## 11. Estrutura do projeto

```text
roi_manager/
├── config/                 Configurações, URLs e WSGI do Django
├── financeiro/             Modelos, views, formulários e serviços financeiros
│   ├── management/          Comandos de automação do Django
│   ├── migrations/          Migrações versionadas do banco
│   ├── services/             ROI, indicadores, relatórios e automações
│   └── tests/                Testes de cálculos e páginas
├── templates/               Templates HTML Django
├── static/
│   ├── css/app.css           Identidade visual e layout responsivo
│   └── js/app.js             Menu mobile, avisos e confirmações
├── scripts/                 Instalação, execução, backup e verificação via CMD
├── data/inbox/               Entrada padrão de arquivos CSV
├── backups/                  Cópias locais do banco (geradas pelo usuário)
├── .env.example              Modelo de variáveis de ambiente
├── manage.py
└── requirements.txt
```

## 12. Limitações e escopo atual

- O projeto ainda não consulta diretamente as APIs de Magalu, Mercado Livre, Amazon ou Shopee. As integrações oficiais dependem de documentação, credenciais, permissões e implementação específicas.
- A automação atual cobre CSV e despesas recorrentes locais; não é um conector de marketplace nem um serviço em nuvem.
- O vínculo de comissões a produtos, campanhas e canais é manual. O sistema não presume que um clique gerou uma venda nem atribui comissão por coincidência de data.
- A aplicação usa SQLite por padrão. O uso de PostgreSQL exige configurar o backend de banco, dependência e `DATABASE_URL` em uma etapa específica.
- A interface utiliza fontes Google quando disponíveis; o restante do front-end (CSS e JavaScript) está no próprio projeto.

## 13. Desenvolvimento e evolução

Consulte [`BIBLIA_RECONSTRUCAO.md`](BIBLIA_RECONSTRUCAO.md) para a arquitetura, decisões de implementação, regras financeiras, identidade visual, testes e procedimento de reconstrução/manutenção do projeto.

Para alterar modelos, crie uma nova migração e versioná-la junto ao código:

```cmd
venv\Scripts\python.exe manage.py makemigrations financeiro
venv\Scripts\python.exe manage.py migrate
```

Não edite uma migração que já tenha sido aplicada em bancos de usuários. Crie uma nova migração para cada mudança de esquema.
