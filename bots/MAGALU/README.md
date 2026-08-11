# Magalu - Coletor de Links de Afiliado

Automação em Python usando Selenium para acessar uma vitrine do Magazine Você através de um Chrome já aberto em modo de depuração remota, percorrer categorias, coletar produtos e gerar links de afiliado.

O programa:

1. Conecta a um Chrome existente na porta `9222`.
2. Abre a vitrine configurada.
3. Acessa cada categoria.
4. Coleta até 20 produtos por categoria.
5. Entra individualmente em cada produto.
6. Localiza o botão **Gerar link**.
7. Abre o modal de geração de link.
8. Localiza o campo **Link do produto**.
9. Extrai o link diretamente do campo, sem usar o botão "Copiar".
10. Armazena os resultados.
11. Ao final, gera um arquivo `.xlsx` com os links coletados.
12. Mostra um relatório da quantidade de produtos e links obtidos.

---

## 1. Requisitos

### Python

É necessário ter o Python instalado.

Recomenda-se utilizar uma versão recente do Python compatível com as versões instaladas no projeto.

Para verificar:

```bash
python --version
```

ou:

```bash
py --version
```

---

## 2. Criar o ambiente virtual

Dentro da pasta do projeto:

```bash
python -m venv venv
```

Ative o ambiente virtual no Windows:

```bash
venv\Scripts\activate
```

Quando estiver ativado, o terminal deverá mostrar algo semelhante a:

```text
(venv) C:\Users\SeuUsuario\...\>
```

---

## 3. Instalar as dependências

O projeto utiliza somente:

```text
selenium
openpyxl
```

Crie um arquivo chamado:

```text
requirements.txt
```

com:

```txt
selenium
openpyxl
```

Depois instale:

```bash
pip install -r requirements.txt
```

Também é possível instalar diretamente:

```bash
pip install selenium openpyxl
```

---

# 4. Estrutura do projeto

Uma estrutura simples pode ser:

```text
MAGALU_COLETOR/
│
├── venv/
│
├── coletor.py
│
├── requirements.txt
│
└── links_afiliados_magalu.xlsx
```

O arquivo Excel não precisa existir previamente.

Ele será criado automaticamente pelo programa.

---

# 5. Configuração do código

No início do arquivo Python existem algumas configurações importantes:

```python
CHROME_DEBUGGER = "127.0.0.1:9222"

MINHA_LOJA = "magazineblackriseco"

BASE_URL = f"https://www.magazinevoce.com.br/{MINHA_LOJA}"
```

## MINHA_LOJA

Altere:

```python
MINHA_LOJA = "magazineblackriseco"
```

para o identificador da sua vitrine.

Por exemplo:

```python
MINHA_LOJA = "minhavitrine"
```

O programa então utilizará:

```text
https://www.magazinevoce.com.br/minhavitrine
```

---

# 6. Configuração das categorias

As categorias ficam nesta lista:

```python
CATEGORIAS = [
    "acessórios",
    "cozinha",
    "banheiro",
    "sala de estar",
    "eletrodomesticos",
]
```

Você pode alterar, adicionar ou remover categorias.

Exemplo:

```python
CATEGORIAS = [
    "acessórios",
    "cozinha",
    "celulares",
    "informática",
    "televisores",
]
```

O código transforma automaticamente o nome da categoria em uma URL.

---

# 7. Quantidade de produtos por categoria

A quantidade máxima é definida por:

```python
LIMITE_POR_CATEGORIA = 20
```

Com:

```python
LIMITE_POR_CATEGORIA = 20
```

o programa tenta coletar até 20 produtos de cada categoria.

Por exemplo, com 5 categorias:

```text
5 categorias × 20 produtos = 100 produtos
```

---

# 8. IMPORTANTE: Chrome na porta 9222

Esse programa **não abre um Chrome novo**.

Ele se conecta a uma instância do Chrome que já esteja aberta com a depuração remota habilitada.

A configuração utilizada é:

```python
options = Options()

options.add_experimental_option(
    "debuggerAddress",
    "127.0.0.1:9222"
)
```

Portanto, antes de executar o programa, o Chrome precisa estar iniciado com:

```text
--remote-debugging-port=9222
```

---

# 9. Abrindo o Chrome corretamente

No Windows, primeiro feche completamente o Chrome.

Depois abra o Prompt de Comando (`cmd`).

Um exemplo de comando é:

```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="C:\ChromeDebug"
```

Dependendo da instalação, o Chrome pode estar em:

```cmd
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
```

ou em outro caminho.

O importante é que o Chrome seja iniciado com:

```text
--remote-debugging-port=9222
```

---

# 10. Verificando se a porta 9222 está funcionando

Antes de executar o Python, você pode verificar se o Chrome respondeu.

No navegador, abra:

```text
http://127.0.0.1:9222/json/version
```

Se estiver funcionando, deverá aparecer uma resposta contendo informações semelhantes a:

```json
{
    "Browser": "Chrome/...",
    "Protocol-Version": "1.3",
    "User-Agent": "Mozilla/5.0 ..."
}
```

Se a página não abrir, o Chrome provavelmente não foi iniciado corretamente com a porta `9222`.

---

# 11. Fazer login antes de executar

Como o programa utiliza o Chrome já aberto, o ideal é:

1. Abrir o Chrome com a porta `9222`.
2. Acessar sua conta/vitrine do Magazine Você.
3. Fazer login normalmente.
4. Confirmar que a conta está funcionando.
5. Só então executar o Python.

O Selenium utilizará essa sessão existente do Chrome.

---

# 12. Executando o programa

Com o ambiente virtual ativado:

```bash
python coletor.py
```

Se o arquivo tiver outro nome, utilize o nome correspondente.

Por exemplo:

```bash
python magalu.py
```

---

# 13. Fluxo de execução

Ao iniciar, o programa mostra:

```text
======================================================================
        MAGALU - COLETOR DE LINKS DE AFILIADO
======================================================================
[OK] Chrome conectado.
[INFO] Página atual:
...
```

Depois abre a vitrine:

```text
[1] Abrindo sua vitrine...
[OK] Vitrine aberta.
```

Em seguida começa a primeira categoria:

```text
======================================================================
CATEGORIA 1/5: ACESSÓRIOS
======================================================================
```

O programa acessa a categoria e procura os produtos.

Exemplo:

```text
[INFO] Elementos encontrados: 48
[OK] 20 produtos encontrados para 'acessórios'.
```

---

# 14. Processamento dos produtos

Para cada produto, o programa:

1. Abre a URL.
2. Procura **Gerar link**.
3. Clica no botão.
4. Aguarda o modal.
5. Procura o campo que contém uma URL.
6. Lê o valor do campo.

Exemplo:

```text
----------------------------------------------------------------------
ABRINDO PRODUTO
----------------------------------------------------------------------
https://www.magazinevoce.com.br/...

[OK] Botão 'Gerar link' encontrado.
[OK] Botão 'Gerar link' clicado.
[OK] Link de afiliado obtido:
https://magazineluiza.onelink.me/...
```

O botão **Copiar** não é utilizado.

O código lê diretamente o valor do campo:

```python
valor = campo.get_attribute("value")
```

Isso evita depender do clipboard do Windows.

---

# 15. Tratamento de produtos com erro

Se um produto não conseguir gerar o link, o programa não encerra imediatamente.

Ele registra:

```text
[ERRO] Não foi possível clicar em 'Gerar link'.
```

ou:

```text
[ERRO] Não consegui encontrar o link no modal.
```

Nesse caso, o resultado é registrado com:

```python
"link_afiliado": None
```

e o programa continua para o próximo produto.

---

# 16. Arquivo Excel

Ao terminar todas as categorias, o programa cria:

```text
links_afiliados_magalu.xlsx
```

A planilha terá uma aba chamada:

```text
Links Afiliados
```

Com as colunas:

| Categoria  | Produto Nº | Link do Produto | Link de Afiliado |
| ---------- | ---------: | --------------- | ---------------- |
| acessórios |          1 | URL do produto  | URL de afiliado  |
| acessórios |          2 | URL do produto  | URL de afiliado  |
| acessórios |          3 | URL do produto  | URL de afiliado  |
| cozinha    |          1 | URL do produto  | URL de afiliado  |

As larguras das colunas também são ajustadas automaticamente.

---

# 17. Relatório final

Quando terminar, o programa mostra um resumo semelhante a:

```text
======================================================================
                    COLETA FINALIZADA
======================================================================
ACESSÓRIOS                Produtos: 20 | Links: 20
COZINHA                   Produtos: 20 | Links: 19
BANHEIRO                  Produtos: 20 | Links: 20
SALA DE ESTAR             Produtos: 20 | Links: 20
ELETRODOMESTICOS          Produtos: 20 | Links: 18
----------------------------------------------------------------------
TOTAL DE PRODUTOS PROCESSADOS: 100
TOTAL DE LINKS DE AFILIADO:    97
ARQUIVO GERADO:                links_afiliados_magalu.xlsx
======================================================================
```

Nesse exemplo, 100 produtos foram processados, mas 3 não conseguiram gerar link.

---

# 18. Dependências

O `requirements.txt` desta versão é:

```txt
selenium
openpyxl
```

Não é necessário adicionar:

```text
time
random
urllib
```

porque essas bibliotecas fazem parte do Python.

---

# 19. Problemas comuns

## Chrome não conecta

Erro semelhante a:

```text
cannot connect to chrome at 127.0.0.1:9222
```

Verifique se o Chrome foi iniciado com:

```text
--remote-debugging-port=9222
```

Também confirme:

```text
http://127.0.0.1:9222/json/version
```

---

## Selenium não encontrado

Se aparecer:

```text
ModuleNotFoundError: No module named 'selenium'
```

ative o ambiente virtual:

```bash
venv\Scripts\activate
```

e instale:

```bash
pip install selenium
```

---

## OpenPyXL não encontrado

Se aparecer:

```text
ModuleNotFoundError: No module named 'openpyxl'
```

execute:

```bash
pip install openpyxl
```

---

## Botão "Gerar link" não encontrado

Isso pode acontecer se a interface do Magazine Você tiver mudado ou se a página ainda não tiver carregado.

O código utiliza este XPath:

```python
//*[self::button or self::a][contains(normalize-space(.), 'Gerar link')]
```

Portanto, ele procura elementos `<button>` ou `<a>` contendo o texto:

```text
Gerar link
```

---

## Link não encontrado no modal

O código procura inputs visíveis que contenham uma URL:

```python
inputs = driver.find_elements(
    By.CSS_SELECTOR,
    "input"
)
```

Depois verifica o atributo:

```python
value
```

e procura:

```text
http://
```

ou:

```text
https://
```

Isso permite obter o link diretamente do campo sem clicar em **Copiar**.

---

# 20. Limitações desta versão

Esta versão possui uma característica importante:

**O Excel só é gerado ao final da execução.**

Se o programa for encerrado no meio do processo, os resultados que ainda estão somente na memória serão perdidos.

Por isso, nesta versão, **não é recomendado interromper o programa com `Ctrl+C`**.

A próxima versão pode implementar:

* salvamento automático após cada produto;
* interrupção segura com `Ctrl+C`;
* listagem dos links obtidos até o momento;
* recuperação da execução;
* continuação sem repetir produtos já processados.

Esses recursos devem ser adicionados separadamente para não alterar desnecessariamente o fluxo atual.

---

# 21. Comando rápido para começar

Depois de configurar o Chrome:

```bash
cd CAMINHO_DO_PROJETO
```

Ative o ambiente:

```bash
venv\Scripts\activate
```

Instale as dependências:

```bash
pip install -r requirements.txt
```

Confirme que o Chrome está acessível:

```text
http://127.0.0.1:9222/json/version
```

Depois execute:

```bash
python coletor.py
```

---

## Resumo

```text
Chrome com --remote-debugging-port=9222
              │
              ▼
       Python + Selenium
              │
              ▼
       Abre a vitrine
              │
              ▼
       Percorre categorias
              │
              ▼
       Coleta até 20 produtos
              │
              ▼
       Abre cada produto
              │
              ▼
       Clica "Gerar link"
              │
              ▼
       Lê o campo "Link do produto"
              │
              ▼
       Armazena os resultados
              │
              ▼
       Gera Excel no final
```

**Dependências:**

```text
selenium
openpyxl
```

**Entrada:** vitrine do Magazine Você.

**Saída:**

```text
links_afiliados_magalu.xlsx
```
