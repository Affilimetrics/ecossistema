import unittest
from pathlib import Path
import sys

SRC = Path(__file__).resolve().parents[1] / "src"
sys.path.insert(0, str(SRC))
from ml_output import parse_results


class MercadoLivreOutputTests(unittest.TestCase):
    def test_parses_multiple_products(self):
        output = (
            "1. Fone Bluetooth\nPreço: R$ 199\nLink: https://www.mercadolivre.com.br/p/MLB123\n"
            "--------------------------------------------------\n"
            "2. Teclado Mecânico\nPreço: R$ 299\nLink: https://produto.mercadolivre.com.br/MLB456\n"
        )
        self.assertEqual(
            parse_results(output),
            [
                ("Fone Bluetooth", "R$ 199", "https://www.mercadolivre.com.br/p/MLB123"),
                ("Teclado Mecânico", "R$ 299", "https://produto.mercadolivre.com.br/MLB456"),
            ],
        )

    def test_ignores_missing_or_invalid_links(self):
        output = "1. Produto sem link\nPreço: R$ 10\nLink: #\n"
        self.assertEqual(parse_results(output), [])


if __name__ == "__main__":
    unittest.main()
