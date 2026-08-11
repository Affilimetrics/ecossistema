# Magalu — Coletor de Links de Afiliado

Automação em Python utilizando Selenium para acessar uma vitrine do Magazine Você através de um Chrome já aberto em modo de depuração remota, percorrer categorias, coletar produtos e gerar links de afiliado.

A versão atual possui **salvamento incremental** e **interrupção segura com `Ctrl+C`**, evitando a perda dos dados já coletados.

---

# 1. O que o programa faz

O programa executa o seguinte fluxo:

1. Conecta ao Chrome em `127.0.0.1:9222`.
2. Abre a vitrine configurada.
3. Entra em cada categoria.
4. Coleta até 20 URLs de produtos por categoria.
5. Entra em cada produto individualmente.
6. Localiza o botão **Gerar link**.
7. Clica em **Gerar link**.
8. Aguarda o modal.
9. Localiza o campo **Link do produto**.
10. Extrai o link diretamente do campo.
11. Salva o resultado na memória.
12. Salva o Excel imediatamente.
13. Continua para o próximo produto.
14. Ao terminar todas as categorias, mostra um relatório final.

Também é possível interromper o programa usando:

```text
Ctrl+C
```

Nesse caso, o programa:

* interrompe a execução;
* salva novamente o Excel;
* preserva os dados coletados;
* lista os links de afiliado obtidos;
* informa quantos produtos foram processados;
* informa quantos links foram obtidos.

---

# 2. Requisitos

## Python

É necessário ter Python instalado.

Verifique com:

```bash
python --version
```

ou:

```bash
py --version
```

---

# 3. Ambiente virtual

É recomendado utilizar um ambiente virtual.

Dentro da pasta do projeto:

```bash
python -m venv venv
```

No Windows, ative:

```bash
venv\Scripts\activate
```

O terminal deverá ficar parecido com:

```text
(venv) C:\Users\SeuUsuario\...\>
```

---

# 4. Dependências

Crie o arquivo:

```text
requirements.txt
```

com:

```txt
selenium
openpyxl
```

Instale:

```bash
pip install -r requirements.txt
```

Ou diretamente:

```bash
pip install selenium openpyxl
```

---

# 5. Estrutura do projeto

Uma estrutura recomendada:

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

O arquivo:

```text
links_afiliados_magalu.xlsx
```

não precisa existir antes de executar o programa.

Ele será criado automaticamente.

---

# 6. Configuração

No início do código existem as principais configurações:

```python
CHROME_DEBUGGER = "127.0.0.1:9222"

MINHA_LOJA = "magazineblackriseco"

BASE_URL = f"https://www.magazinevoce.com.br/{MINHA_LOJA}"

CATEGORIAS = [
    "acessórios",
    "cozinha",
    "banheiro",
    "sala de estar",
    "eletrodomesticos",
]

LIMITE_POR_CATEGORIA = 20

ARQUIVO_SAIDA = "links_afiliados_magalu.xlsx"
```

---

# 7. Configurar sua vitrine

Altere:

```python
MINHA_LOJA = "magazineblackriseco"
```

para o identificador da sua própria vitrine.

Por exemplo:

```python
MINHA_LOJA = "minhavitrine"
```

O programa utilizará:

```text
https://www.magazinevoce.com.br/minhavitrine
```

---

# 8. Configurar categorias

As categorias são definidas em:

```python
CATEGORIAS = [
    "acessórios",
    "cozinha",
    "banheiro",
    "sala de estar",
    "eletrodomesticos",
]
```

É possível adicionar ou remover categorias.

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

O programa monta automaticamente a URL da categoria.

---

# 9. Quantidade de produtos

A quantidade máxima de produtos por categoria é definida por:

```python
LIMITE_POR_CATEGORIA = 20
```

Com cinco categorias:

```text
5 × 20 = 100 produtos
```

Portanto, o programa tentará processar até 100 produtos nesse exemplo.

---

# 10. Chrome na porta 9222

O programa não cria uma sessão independente do Chrome.

Ele se conecta a uma instância do Chrome já aberta utilizando:

```text
127.0.0.1:9222
```

O Chrome precisa ser iniciado com:

```text
--remote-debugging-port=9222
```

---

# 11. Iniciando o Chrome

Primeiro, feche completamente o Chrome.

Depois abra o `cmd`.

Exemplo:

```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

Dependendo da instalação:

```cmd
"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222
```

O caminho do executável pode variar.

O ponto importante é:

```text
--remote-debugging-port=9222
```

---

# 12. Verificar a porta 9222

Abra no navegador:

```text
http://127.0.0.1:9222/json/version
```

Se estiver funcionando, deverão aparecer informações semelhantes a:

```json
{
    "Browser": "Chrome/...",
    "Protocol-Version": "1.3",
    "User-Agent": "Mozilla/5.0 ..."
}
```

Se essa página não abrir, o Chrome não está disponível na porta `9222`.

---

# 13. Login

Antes de executar o programa:

1. Inicie o Chrome com a porta `9222`.
2. Acesse sua vitrine.
3. Faça login normalmente.
4. Confirme que sua conta está funcionando.
5. Execute o programa Python.

O Selenium utilizará a sessão do Chrome já existente.

---

# 14. Executando

Com o ambiente virtual ativado:

```bash
python coletor.py
```

Caso o arquivo tenha outro nome:

```bash
python nome_do_arquivo.py
```

---

# 15. Fluxo durante a execução

Ao iniciar:

```text
======================================================================
        MAGALU - COLETOR DE LINKS DE AFILIADO
======================================================================
[OK] Chrome conectado.
[INFO] Página atual:
...
```

Depois:

```text
[1] Abrindo sua vitrine...
[OK] Vitrine aberta.
```

O programa começa a processar as categorias:

```text
======================================================================
CATEGORIA 1/5: ACESSÓRIOS
======================================================================
```

Depois coleta os produtos:

```text
[INFO] Elementos encontrados: 48
[OK] 20 produtos encontrados para 'acessórios'.
```

---

# 16. Geração do link

Para cada produto:

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

O programa não precisa clicar no botão **Copiar**.

Ele lê diretamente o valor do campo do modal.

A lógica utiliza:

```python
valor = campo.get_attribute("value")
```

---

# 17. Salvamento incremental

Essa é uma das principais diferenças desta versão.

Depois de cada produto processado, o programa executa:

```python
salvar_excel(resultados)
```

Isso significa que o arquivo Excel é atualizado continuamente.

Exemplo:

```text
Produto 1 → salva
Produto 2 → salva
Produto 3 → salva
Produto 4 → salva
Produto 5 → salva
...
```

Portanto, se o programa chegar ao produto 37, os resultados anteriores já estarão gravados no arquivo.

---

# 18. Interromper com Ctrl+C

A execução pode ser interrompida manualmente pressionando:

```text
Ctrl+C
```

Por exemplo:

```text
Produto 34/20
Produto 35/20
Produto 36/20
Produto 37/20
```

Você pressiona:

```text
Ctrl+C
```

O programa captura a interrupção através de:

```python
except KeyboardInterrupt:
```

e realiza um salvamento final.

---

# 19. O que acontece depois do Ctrl+C

O programa exibirá algo semelhante a:

```text
======================================================================
       EXECUÇÃO INTERROMPIDA PELO USUÁRIO
======================================================================

[INFO] CTRL+C detectado.
[INFO] Salvando os dados coletados...
[OK] Dados salvos com sucesso.
```

Depois lista os links obtidos:

```text
LINKS DE AFILIADO OBTIDOS ATÉ AGORA:
----------------------------------------------------------------------

001. [acessórios]
https://magazineluiza.onelink.me/...

002. [acessórios]
https://magazineluiza.onelink.me/...

003. [acessórios]
https://magazineluiza.onelink.me/...

...

----------------------------------------------------------------------

TOTAL DE PRODUTOS PROCESSADOS: 36
TOTAL DE LINKS DE AFILIADO: 36

ARQUIVO SALVO: links_afiliados_magalu.xlsx
======================================================================
```

---

# 20. O que é preservado

Ao pressionar `Ctrl+C`, os resultados já processados permanecem no arquivo:

```text
links_afiliados_magalu.xlsx
```

Por exemplo, se 36 produtos já tiverem sido processados:

```text
Produto 1  ✓
Produto 2  ✓
Produto 3  ✓
...
Produto 36 ✓
Produto 37 ✗
```

Os 36 anteriores estarão no Excel.

---

# 21. Produtos com erro

Se um produto não conseguir gerar o link, o programa não encerra toda a execução.

Por exemplo:

```text
[ERRO] Não foi possível clicar em 'Gerar link'.
```

ou:

```text
[ERRO] Não consegui encontrar o link no modal.
```

O resultado será armazenado como:

```python
"link_afiliado": None
```

E o programa continuará para o próximo produto.

---

# 22. Arquivo Excel

O arquivo gerado é:

```text
links_afiliados_magalu.xlsx
```

A planilha possui uma aba:

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

---

# 23. Relatório final

Quando todas as categorias forem concluídas:

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

---

# 24. Problemas comuns

## Chrome não conecta

Se aparecer algo como:

```text
cannot connect to chrome at 127.0.0.1:9222
```

verifique se o Chrome foi iniciado com:

```text
--remote-debugging-port=9222
```

Depois teste:

```text
http://127.0.0.1:9222/json/version
```

---

## Selenium não instalado

Erro:

```text
ModuleNotFoundError: No module named 'selenium'
```

Execute:

```bash
pip install selenium
```

ou:

```bash
pip install -r requirements.txt
```

---

## OpenPyXL não instalado

Erro:

```text
ModuleNotFoundError: No module named 'openpyxl'
```

Execute:

```bash
pip install openpyxl
```

---

## Botão "Gerar link" não encontrado

O programa procura elementos contendo:

```text
Gerar link
```

através do XPath:

```python
//*[self::button or self::a]
[contains(normalize-space(.), 'Gerar link')]
```

Se a interface do site mudar, esse seletor poderá precisar ser atualizado.

---

## Link não encontrado

O programa procura inputs visíveis que contenham uma URL.

Ele verifica o atributo:

```python
value
```

e procura valores contendo:

```text
http://
```

ou:

```text
https://
```

---

# 25. Importante sobre o Ctrl+C

O `Ctrl+C` é tratado pelo Python como:

```python
KeyboardInterrupt
```

O programa foi preparado para capturar essa interrupção.

Por isso, **não é necessário fechar o terminal à força**.

Use:

```text
Ctrl+C
```

e aguarde o programa mostrar:

```text
[OK] Dados salvos com sucesso.
```

Antes de fechar o terminal.

---

# 26. O que esta versão ainda NÃO faz

Esta versão possui salvamento incremental, mas ainda não possui **retomada automática**.

Por exemplo, se o programa parar no produto 37, o Excel terá os dados dos produtos anteriores.

Porém, ao executar novamente:

```bash
python coletor.py
```

o programa ainda começará o processo normalmente e poderá repetir produtos que já foram processados.

A próxima evolução poderá implementar:

```text
Execução
   │
   ├── Produto 1 ✓
   ├── Produto 2 ✓
   ├── Produto 3 ✓
   ├── ...
   ├── Produto 37 ✓
   │
   └── Ctrl+C
          │
          ▼
      Salva Excel
          │
          ▼
      Execução novamente
          │
          ▼
      Detecta produtos já processados
          │
          ▼
      Continua do próximo
```

Essa funcionalidade deve ser adicionada posteriormente para evitar misturar a lógica de **interrupção segura** com a lógica de **retomada**.

---

# 27. Comandos rápidos

## Criar ambiente virtual

```bash
python -m venv venv
```

## Ativar

```bash
venv\Scripts\activate
```

## Instalar dependências

```bash
pip install -r requirements.txt
```

## Executar

```bash
python coletor.py
```

## Interromper com segurança

```text
Ctrl+C
```

---

# 28. Dependências

O arquivo `requirements.txt` deve conter:

```txt
selenium
openpyxl
```

Bibliotecas como:

```text
time
random
urllib.parse
```

fazem parte da biblioteca padrão do Python e não precisam ser instaladas.

---

# 29. Fluxo geral

```text
                CHROME
                   │
                   │
        --remote-debugging-port=9222
                   │
                   ▼
             SELENIUM
                   │
                   ▼
             SUA VITRINE
                   │
                   ▼
             CATEGORIA
                   │
                   ▼
          ATÉ 20 PRODUTOS
                   │
                   ▼
          ABRE CADA PRODUTO
                   │
                   ▼
             "GERAR LINK"
                   │
                   ▼
          CAMPO "LINK DO PRODUTO"
                   │
                   ▼
          LINK DE AFILIADO
                   │
                   ▼
            SALVA NO EXCEL
                   │
                   ├───────────────┐
                   │               │
                   ▼               ▼
              PRÓXIMO          Ctrl+C
              PRODUTO             │
                                  ▼
                           SALVA E LISTA
                           OS RESULTADOS
```

---

# 30. Resultado

Ao final, o projeto produz:

```text
links_afiliados_magalu.xlsx
```

contendo:

* categoria;
* número do produto;
* URL original do produto;
* URL gerada de afiliado.

A principal garantia desta versão é:

> **Cada produto processado é salvo imediatamente no Excel, portanto ao parar e retomar um processo, o programa procura por um arquivo excel existente, e se houver, verifica onde o processo anterior encerrou, e parte daquele ponto.**

Portanto, uma interrupção no meio da execução não apaga o trabalho que já foi realizado.
