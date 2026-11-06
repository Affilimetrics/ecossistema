"""Parser da saída textual do coletor Mercado Livre original."""
import re

_RESULT = re.compile(
    r"(?m)^\s*(\d+)\.\s*(.*?)\r?\n\s*Preço:\s*(.*?)\r?\n\s*Link:\s*(https?://\S+)",
    re.IGNORECASE,
)


def parse_results(output: str):
    """Retorna lista de tuplas (nome, preço exibido, URL) sem inferir centavos."""
    return [
        (name.strip(), price.strip(), url.strip())
        for _, name, price, url in _RESULT.findall(output or "")
    ]
