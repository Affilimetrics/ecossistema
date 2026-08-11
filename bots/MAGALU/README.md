# Magalu — Coletor de Links de Afiliado

Automação em Python utilizando Selenium para acessar uma vitrine do Magazine Você através de um Chrome já aberto em modo de depuração remota, selecionar categorias ou palavras-chave, coletar produtos e gerar links de afiliado.

A versão atual possui:

* **seleção de categorias pelo terminal**;
* **palavra-chave personalizada**;
* **salvamento incremental**;
* **interrupção segura com `Ctrl+C`**;
* **retomada automática de processos anteriores**;
* **detecção de produtos já processados**;
* **continuidade sem precisar repetir links já obtidos**;
* geração de arquivo `.xlsx` com os resultados.

---

# 1. O que o programa faz

O programa executa o seguinte fluxo:

1. Verifica se existe um Excel de uma execução anterior.
2. Carrega os produtos e links já processados.
3. Exibe um menu de categorias no terminal.
4. Permite selecionar uma ou várias categorias.
5. Permite informar uma **palavra-chave personalizada**.
6. Conecta ao Chrome em `127.0.0.1:9222`.
7. Abre a vitrine configurada.
8. Entra em cada categoria selecionada.
9. Coleta até 20 URLs de produtos por categoria.
10. Verifica quais produtos já foram processados anteriormente.
11. Ignora produtos que já possuem link de afiliado.
12. Entra nos produtos ainda pendentes.
13. Localiza o botão **Gerar link**.
14. Clica em **Gerar link**.
15. Aguarda o modal.
16. Localiza o campo **Link do produto**.
17. Extrai o link diretamente do campo.
18. Salva o resultado no Excel.
19. Continua para o próximo produto.
20. Ao finalizar, mostra um relatório.

---

# 2. Seleção de categorias

Ao iniciar o programa, o terminal apresenta:

```text
======================================================================
              MAGALU - COLETOR DE LINKS
======================================================================

Selecione as categorias que deseja executar.

1 - Cozinha
2 - Quarto
3 - Sala
4 - Banheiro
5 - Acessórios
6 - Palavra-chave personalizada

Digite os números separados por espaço.
Exemplo: 1 3 4 6
Digite 0 para cancelar.

>
```

A pessoa pode selecionar várias opções ao mesmo tempo.

Por exemplo:

```text
> 1 3 4
```

O programa processará:

```text
Cozinha
Sala
Banheiro
```

---

# 3. Palavra-chave personalizada

A opção:

```text
6 - Palavra-chave personalizada
```

permite informar uma categoria ou termo específico diretamente pelo terminal.

Por exemplo:

```text
> 1 3 4 6
```

O programa perguntará:

```text
Digite a palavra-chave:

>
```

Se for informado:

```text
guitarras
```

o processamento ficará:

```text
Cozinha
Sala
Banheiro
guitarras
```

Isso permite utilizar o mesmo coletor para pesquisas específicas sem precisar alterar o código.

Exemplo:

```text
> 6

Digite a palavra-chave:

> guitarras
```

O programa trabalhará com:

```text
guitarras
```

como termo de busca.

---

# 4. Seleção múltipla

É possível selecionar qualquer combinação das opções.

Exemplo:

```text
> 1 3 4 6
```

Resultado:

```text
1 - cozinha
2 - sala
3 - banheiro
4 - guitarras
```

A ordem escolhida é preservada.

Também é possível selecionar apenas uma:

```text
> 2
```

Ou todas as categorias principais:

```text
> 1 2 3 4 5
```

---

# 5. Requisitos

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

Recomenda-se utilizar uma versão compatível com o ambiente já utilizado no projeto.

---

# 6. Ambiente virtual

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

# 7. Dependências

O arquivo:

```text
requirements.txt
```

deve conter:

```txt
selenium
openpyxl
```

Instale as dependências com:

```bash
pip install -r requirements.txt
```

Ou diretamente:

```bash
pip install selenium openpyxl
```

Bibliotecas como:

```text
time
random
os
urllib.parse
```

fazem parte da biblioteca padrão do Python e não precisam ser instaladas.

---

# 8. Estrutura atual do projeto

Estrutura inicial:

```text
MAGALU_COLETOR/
│
├── venv/
│
├── MAGALU.py
│
├── requirements.txt
│
└── links_afiliados_magalu.xlsx
```

O arquivo:

```text
links_afiliados_magalu.xlsx
```

é criado automaticamente caso ainda não exista.

Ele também é utilizado como base para a retomada automática.

---

# 9. Configuração

No início do código existem as principais configurações:

```python
CHROME_DEBUGGER = "127.0.0.1:9222"

MINHA_LOJA = "magazineblackriseco"

BASE_URL = f"https://www.magazinevoce.com.br/{MINHA_LOJA}"

LIMITE_POR_CATEGORIA = 20

ARQUIVO_SAIDA = "links_afiliados_magalu.xlsx"
```

As categorias principais ficam separadas:

```python
CATEGORIAS_PRINCIPAIS = {
    "1": "cozinha",
    "2": "quarto",
    "3": "sala",
    "4": "banheiro",
    "5": "acessórios",
}
```

---

# 10. Configurar sua vitrine

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

# 11. Categorias principais

As categorias padrão são:

```text
1 - cozinha
2 - quarto
3 - sala
4 - banheiro
5 - acessórios
```

Elas podem ser alteradas diretamente no código:

```python
CATEGORIAS_PRINCIPAIS = {
    "1": "cozinha",
    "2": "quarto",
    "3": "sala",
    "4": "banheiro",
    "5": "acessórios",
}
```

A opção `6` é reservada para palavras-chave digitadas pelo usuário.

---

# 12. Quantidade de produtos

A quantidade máxima de produtos por categoria é definida por:

```python
LIMITE_POR_CATEGORIA = 20
```

Por exemplo, se forem selecionadas:

```text
cozinha
sala
banheiro
guitarras
```

o programa poderá coletar:

```text
20 + 20 + 20 + 20 = 80 produtos
```

---

# 13. Chrome na porta 9222

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

# 14. Iniciando o Chrome

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

# 15. Verificar a porta 9222

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

# 16. Login

Antes de executar o programa:

1. Inicie o Chrome com a porta `9222`.
2. Acesse sua vitrine.
3. Faça login normalmente.
4. Confirme que sua conta está funcionando.
5. Execute o programa Python.

O Selenium utilizará a sessão do Chrome já existente.

---

# 17. Executando

Com o ambiente virtual ativado:

```bash
python MAGALU.py
```

---

# 18. Fluxo de inicialização

Ao executar:

```bash
python MAGALU.py
```

o programa primeiro verifica se existe um Excel anterior.

Se não existir:

```text
[INFO] Nenhum Excel anterior encontrado.
```

Se existir:

```text
======================================================================
              VERIFICANDO RETOMADA
======================================================================

[INFO] Arquivo encontrado: links_afiliados_magalu.xlsx
[OK] 37 registros encontrados.
[OK] 37 links de afiliado já obtidos.
[INFO] O programa continuará somente com os produtos ainda pendentes.
```

Depois disso, o menu de categorias é apresentado.

---

# 19. Retomada automática

A retomada automática utiliza o arquivo:

```text
links_afiliados_magalu.xlsx
```

O programa verifica os registros já existentes e identifica produtos que já possuem link de afiliado.

Exemplo:

```text
Produto 1 ✓
Produto 2 ✓
Produto 3 ✓
Produto 4 ✓
Produto 5 ✓
...
Produto 37 ✓
```

Se a execução anterior foi interrompida, ao executar novamente o programa ele verifica os produtos encontrados e pula aqueles que já possuem resultado.

---

# 20. Exemplo de retomada

Imagine que o programa esteja processando:

```text
Guitarras
```

E tenha concluído:

```text
Produto 1 ✓
Produto 2 ✓
Produto 3 ✓
...
Produto 12 ✓
```

Você pressiona:

```text
Ctrl+C
```

O Excel é salvo.

Na próxima execução, o programa poderá encontrar esses produtos novamente.

Em vez de processá-los novamente, exibirá mensagens como:

```text
[RETOMADA] Produto já processado. Pulando:
https://www.magazinevoce.com.br/...
```

Depois:

```text
[RETOMADA] 8 produtos pendentes.
[RETOMADA] 12 produtos já concluídos.
```

E continuará somente com os pendentes.

---

# 21. Importante sobre a retomada

A retomada atual utiliza o conjunto:

```text
categoria + URL do produto + link de afiliado
```

para identificar um produto já concluído.

Portanto, se o produto já possuir um link de afiliado salvo no Excel, ele será considerado concluído.

Produtos que não possuem link de afiliado continuam podendo ser processados.

---

# 22. Salvamento incremental

Depois de cada produto processado, o programa executa:

```python
salvar_excel(resultados)
```

Isso significa que o Excel é atualizado continuamente.

Exemplo:

```text
Produto 1 → salva
Produto 2 → salva
Produto 3 → salva
Produto 4 → salva
Produto 5 → salva
...
```

Portanto, se o programa chegar ao produto 37, os resultados anteriores já estarão gravados.

---

# 23. Interromper com Ctrl+C

A execução pode ser interrompida manualmente pressionando:

```text
Ctrl+C
```

O programa captura:

```python
KeyboardInterrupt
```

e realiza um salvamento final.

---

# 24. O que acontece depois do Ctrl+C

O programa exibirá algo semelhante a:

```text
======================================================================
       EXECUÇÃO INTERROMPIDA PELO USUÁRIO
======================================================================

[INFO] Ctrl+C detectado.
[INFO] Salvando os dados coletados...
[OK] Dados salvos com sucesso.
```

Depois lista os links obtidos:

```text
LINKS DE AFILIADO OBTIDOS ATÉ AGORA:
----------------------------------------------------------------------

001. [cozinha]
https://magazineluiza.onelink.me/...

002. [cozinha]
https://magazineluiza.onelink.me/...

003. [guitarras]
https://magazineluiza.onelink.me/...

...

----------------------------------------------------------------------

TOTAL DE PRODUTOS PROCESSADOS: 36
TOTAL DE LINKS DE AFILIADO:    36

ARQUIVO SALVO: links_afiliados_magalu.xlsx
======================================================================
```

---

# 25. O que é preservado

Ao pressionar `Ctrl+C`, os resultados já processados permanecem no:

```text
links_afiliados_magalu.xlsx
```

Por exemplo:

```text
Produto 1  ✓
Produto 2  ✓
Produto 3  ✓
...
Produto 36 ✓
Produto 37 ✗
```

Os 36 anteriores estarão no Excel.

Ao executar novamente, o programa poderá utilizar esses dados para realizar a retomada.

---

# 26. Geração do link

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

Ele lê diretamente o valor do campo do modal:

```python
valor = campo.get_attribute("value")
```

---

# 27. Produtos com erro

Se um produto não conseguir gerar o link, o programa não encerra toda a execução.

Por exemplo:

```text
[ERRO] Não foi possível clicar em 'Gerar link'.
```

ou:

```text
[ERRO] Não consegui encontrar o link no modal.
```

Nesse caso:

```python
"link_afiliado": None
```

e o programa continua para o próximo produto.

---

# 28. Arquivo Excel

O arquivo gerado é:

```text
links_afiliados_magalu.xlsx
```

A planilha possui uma aba:

```text
Links Afiliados
```

Com as colunas:

| Categoria | Produto Nº | Link do Produto | Link de Afiliado |
| --------- | ---------: | --------------- | ---------------- |
| cozinha   |          1 | URL do produto  | URL de afiliado  |
| cozinha   |          2 | URL do produto  | URL de afiliado  |
| sala      |          1 | URL do produto  | URL de afiliado  |
| guitarras |          1 | URL do produto  | URL de afiliado  |

---

# 29. Relatório final

Quando as categorias selecionadas forem concluídas:

```text
======================================================================
                    COLETA FINALIZADA
======================================================================
COZINHA                   Produtos: 20 | Links: 20
SALA                      Produtos: 20 | Links: 19
BANHEIRO                  Produtos: 20 | Links: 20
GUITARRAS                 Produtos: 20 | Links: 20
----------------------------------------------------------------------
TOTAL DE PRODUTOS PROCESSADOS: 80
TOTAL DE LINKS DE AFILIADO:    79
ARQUIVO GERADO:                links_afiliados_magalu.xlsx
======================================================================
```

---

# 30. Problemas comuns

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

# 31. Comandos rápidos

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
python MAGALU.py
```

## Interromper com segurança

```text
Ctrl+C
```

---

# 32. Dependências

O arquivo `requirements.txt` deve conter:

```txt
selenium
openpyxl
```

Bibliotecas como:

```text
time
random
os
urllib.parse
```

fazem parte da biblioteca padrão do Python e não precisam ser instaladas.

---

# 33. Fluxo geral atual

```text
                       INÍCIO
                         │
                         ▼
                VERIFICA EXCEL
                         │
              ┌──────────┴──────────┐
              │                     │
           EXISTE                 NÃO EXISTE
              │                     │
              ▼                     ▼
       CARREGA RESULTADOS       COMEÇA LIMPO
              │                     │
              └──────────┬──────────┘
                         │
                         ▼
                  MENU DE CATEGORIAS
                         │
             ┌───────────┼───────────┐
             │           │           │
             ▼           ▼           ▼
          1-5       6 - PALAVRA    CANCELAR
       categorias      CHAVE           │
             │           │             ▼
             │           ▼           FIM
             │      pergunta termo
             │           │
             └─────┬─────┘
                   │
                   ▼
            CONFIRMA SELEÇÃO
                   │
                   ▼
             CONECTA CHROME
                   │
                   ▼
             ABRE VITRINE
                   │
                   ▼
              CATEGORIA
                   │
                   ▼
            COLETA PRODUTOS
                   │
                   ▼
            VERIFICA RETOMADA
                   │
          ┌────────┴─────────┐
          │                  │
       JÁ FEITO           PENDENTE
          │                  │
          ▼                  ▼
        PULA            ABRE PRODUTO
                             │
                             ▼
                       "GERAR LINK"
                             │
                             ▼
                      EXTRAI LINK
                             │
                             ▼
                       SALVA EXCEL
                             │
                             ▼
                        PRÓXIMO
                             │
                             ▼
                         FINALIZA
                             │
                             ▼
                    RELATÓRIO FINAL
```

---

# 34. Estrutura conceitual atual

A versão atual ainda está concentrada em um único arquivo:

```text
MAGALU.py
```

Isso foi mantido propositalmente neste estágio para validar o fluxo completo antes da fragmentação.

A próxima etapa natural do projeto será separar responsabilidades em módulos, por exemplo:

```text
MAGALU/
│
├── MAGALU.py
│
├── config.py
│
├── chrome.py
│
├── categorias.py
│
├── produtos.py
│
├── afiliados.py
│
├── excel.py
│
├── retomada.py
│
├── requirements.txt
│
└── links_afiliados_magalu.xlsx
```

A ideia é manter o comportamento atual e apenas dividir o código em responsabilidades menores, facilitando manutenção, testes e futuras expansões.

---

# 35. Próxima evolução planejada

Depois da validação desta versão, o projeto poderá evoluir para uma arquitetura modular.

Um exemplo seria:

```text
MAGALU.py
    │
    ├── Menu
    │
    ├── Configuração
    │
    ├── Chrome
    │
    ├── Categorias
    │
    ├── Coleta de produtos
    │
    ├── Geração de links
    │
    ├── Excel
    │
    └── Retomada
```

Posteriormente, outros marketplaces poderão seguir a mesma estrutura, permitindo que cada bot tenha seu próprio módulo sem misturar as implementações.

---

# 36. Resultado

Ao final, o projeto produz:

```text
links_afiliados_magalu.xlsx
```

contendo:

* categoria;
* número do produto;
* URL original do produto;
* URL gerada de afiliado.

A versão atual possui quatro mecanismos importantes de segurança:

1. **Salvamento incremental**
   Cada produto processado é salvo imediatamente.

2. **Interrupção segura**
   `Ctrl+C` interrompe o processo sem apagar os dados existentes.

3. **Retomada automática**
   Ao iniciar novamente, o programa verifica o Excel existente.

4. **Seleção personalizada**
   O usuário pode escolher quais categorias executar ou informar uma palavra-chave específica.

Dessa forma, uma execução pode ser interrompida e posteriormente retomada sem precisar refazer os produtos que já possuem links de afiliado registrados.
