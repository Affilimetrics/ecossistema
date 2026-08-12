# MAGALU — Coletor de Links de Afiliado

Projeto fragmentado a partir do `MAGALU.py` original.

## Estrutura

```text
MAGALU_COLETOR/
│
├── main.py
├── requirements.txt
├── README.md
│
├── config/
│   ├── __init__.py
│   └── config.py
│
├── interface/
│   ├── __init__.py
│   └── menu.py
│
├── automacao/
│   ├── __init__.py
│   ├── categorias.py
│   └── afiliados.py
│
├── persistencia/
│   ├── __init__.py
│   └── excel.py
│
└── relatorios/
    ├── __init__.py
    └── relatorios.py
```

## Responsabilidade dos módulos

- `main.py`: coordena o fluxo.
- `config/config.py`: configurações e categorias principais.
- `interface/menu.py`: menu de seleção, incluindo palavra-chave personalizada.
- `automacao/categorias.py`: navegação, rolagem e coleta de URLs.
- `automacao/afiliados.py`: abertura do produto e geração do link de afiliado.
- `persistencia/excel.py`: leitura, gravação incremental e retomada.
- `relatorios/relatorios.py`: relatórios final e de interrupção.

## Executar

```bash
venv\Scripts\activate
python main.py
```

O Chrome deve estar aberto com:

```text
--remote-debugging-port=9222
```

## Observação

A fragmentação mantém o comportamento existente: menu, categorias principais, palavra-chave personalizada, coleta, geração de links, salvamento incremental, retomada e `Ctrl+C`.

O `main.py` não fecha a sessão externa do Chrome.
