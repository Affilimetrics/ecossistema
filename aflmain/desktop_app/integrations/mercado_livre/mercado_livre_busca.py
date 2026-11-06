import os
from playwright.sync_api import sync_playwright

def buscar_mercado_livre_persistente():
    print("=== Consulta de Produtos com Sessão Persistente (Mercado Livre) ===")
    
    produto = input("Digite o nome do produto que deseja buscar: ").strip()
    try:
        quantidade = int(input("Quantos produtos você deseja exibir? (ex: 5): ").strip())
    except ValueError:
        quantidade = 5

    pasta_cache = os.path.join(os.getcwd(), "ml_session_cache")
    
    print(f"\nIniciando o navegador... (Pasta de cache: {pasta_cache})")

    with sync_playwright() as p:
        # limpei config to avoid security gatilhos
        context = p.chromium.launch_persistent_context(
            user_data_dir=pasta_cache,
            headless=False,
            channel="chrome",  # usa chrome ja existente
            args=[
                "--start-maximized",
                "--disable-infobars",
                "--no-sandbox",
                "--disable-setuid-sandbox"
            ],
            # tira a identificação de atuomação
            ignore_default_args=["--enable-automation"]
        )
        
        page = context.pages[0] if context.pages else context.new_page()
        
        # oculta de forma definitiva qualquer vestígio de automação
        page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        url_busca = f"https://lista.mercadolivre.com.br/{produto.replace(' ', '-')}"
        page.goto(url_busca)
        
        print("\n[Atenção] Se aparecer uma tela de CAPTCHA ou login:")
        print("1. Resolva o CAPTCHA ou faça o login com calma na janela que abriu.")
        print("2. Espere a página de resultados dos produtos carregar por completo.")
        input("Pressione Enter aqui no terminal APENAS quando estiver visualizando os produtos...")
        
        # c oleta os elementos na tela
        items = page.locator(".ui-search-result, .poly-card, li.ui-search-layout__item").all()
        
        if not items:
            print("Nenhum produto encontrado na tela.")
            context.close()
            return

        print(f"\n--- Exibindo até {quantidade} resultados ---")
        
        exibidos = 0
        for item in items:
            if exibidos >= quantidade:
                break
                
            try:
                titulo_elem = item.locator(".ui-search-item__title, .poly-component__title").first
                titulo = titulo_elem.inner_text() if titulo_elem.count() > 0 else "Título indisponível"
                
                preco_elem = item.locator(".andes-money-amount__fraction").first
                preco = preco_elem.inner_text() if preco_elem.count() > 0 else "Preço indisponível"
                
                link_elem = item.locator("a.ui-search-link, a.poly-component__title").first
                link = link_elem.get_attribute("href") if link_elem.count() > 0 else "#"
                
                print(f"{exibidos + 1}. {titulo}")
                print(f"   Preço: R$ {preco}")
                print(f"   Link: {link}")
                print("-" * 50)
                
                exibidos += 1
            except Exception:
                continue

        input("\nPressione Enter para fechar o navegador...")
        context.close()

if __name__ == "__main__":
    buscar_mercado_livre_persistente()