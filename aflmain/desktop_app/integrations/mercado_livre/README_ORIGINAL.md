# Mercado Livre Scraper com Playwright

![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)

Script em Python desenvolvido com **Playwright** para realizar buscas automatizadas de produtos no **Mercado Livre**, extraindo título, preço e link de forma rápida e eficiente. O projeto conta com suporte a **sessão persistente** para evitar logins repetitivos e contornar restrições anti-bot.

---

## Funcionalidades

* **Busca Automatizada:** Pesquisa qualquer produto direto no site do Mercado Livre.
* **Sessão Persistente:** Salva cookies, cache e dados de login em uma pasta local (`ml_session_cache`), garantindo que você não precise refazer o login ou resolver CAPTCHAs a cada execução.
* **Evasão Anti-Bot:** Configurado para ocultar rastros de automação (`navigator.webdriver`) e utilizar o Google Chrome real, reduzindo bloqueios de segurança.
* **Extração Precisa:** Coleta o título do produto, o valor atualizado e o link direto para a página de compra.

---

## Pré-requisitos

Certifique-se de ter os seguintes itens instalados em sua máquina:
* [Python](https://www.python.org/) (versão 3.8 ou superior)
* Google Chrome instalado

---

## Instalação e Configuração

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
   cd SEU-REPOSITORIO
   ```

2. **Instale as dependências necessárias:**
   ```bash
   pip install playwright
   playwright install
   ```

---

## Como Executar

Execute o script principal através do terminal:

```bash
python mercado_livre_busca.py
```

1. Na primeira execução, uma pasta chamada `ml_session_cache` será criada automaticamente.
2. Caso solicitado, faça o login ou resolva o CAPTCHA manualmente na janela do navegador que se abrirá.
3. Pressione `Enter` no terminal e o script listará os produtos solicitados diretamente no console.

---

## Aviso Legal
Este projeto é para fins educacionais e de automação pessoal. Certifique-se de cumprir os Termos de Serviço e as diretrizes de uso do Mercado Livre ao utilizar ferramentas de raspagem de dados.