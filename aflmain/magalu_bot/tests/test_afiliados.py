import unittest

from magalu_bot.automacao.afiliados import validar_link_afiliado, extrair_links_validos_de_texto


class AfiliadosTests(unittest.TestCase):
    def test_valida_dominios_de_afiliado(self):
        self.assertTrue(validar_link_afiliado("https://divulgador.magalu.com/abc123"))
        self.assertTrue(validar_link_afiliado("https://magazineluiza.onelink.me/abc/xyz"))

    def test_rejeita_produto_e_vitrine(self):
        self.assertFalse(validar_link_afiliado("https://www.magazinevoce.com.br/loja/produto"))
        self.assertFalse(validar_link_afiliado("https://www.magazinevoce.com.br/loja/"))

    def test_extrai_url_permitida_de_texto(self):
        texto = "Link gerado: https://magazineluiza.onelink.me/abc/123"
        links = extrair_links_validos_de_texto(texto)
        self.assertEqual(links, ["https://magazineluiza.onelink.me/abc/123"])

    def test_rejeita_url_nao_permitida(self):
        texto = "https://example.com/abc https://www.magazinevoce.com.br/loja"
        self.assertEqual(extrair_links_validos_de_texto(texto), [])


class ComissaoParsingTests(unittest.TestCase):
    def test_extrai_comissao_percentual(self):
        from magalu_bot.automacao.afiliados import _extrair_comissao_texto
        percentual, valor = _extrair_comissao_texto("Comissão: 12,50%")
        self.assertEqual(percentual, 12.50)
        self.assertIsNone(valor)

    def test_fallback_seguro_quando_comissao_nao_existe(self):
        from magalu_bot.automacao.afiliados import _extrair_comissao_texto
        percentual, valor = _extrair_comissao_texto("Link gerado com sucesso")
        self.assertEqual(percentual, 0)
        self.assertIsNone(valor)
