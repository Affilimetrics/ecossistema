from django.shortcuts import render, HttpResponse, redirect
from django.http import JsonResponse

from magalu_bot.bot_controller import (
    iniciar_bot,
    bot_esta_executando,
)


def index(request):
    """
    Página principal do Afillimetrics.
    """
    return render(request, "core/index.html")


def login(request):
    """
    Página de login do Afillimetrics.
    """
    return render(request, "core/login.html")


def magalu_bot(request):
    """
    Página do coletor Magalu.
    """
    return render(request, "core/magalu_bot.html")


def iniciar_bot_view(request):
    """
    Inicia o coletor Magalu através de uma requisição POST
    contendo JSON.
    """

    if request.method != "POST":

        return JsonResponse(
            {
                "sucesso": False,
                "erro": "Método não permitido. Use POST."
            },
            status=405
        )

    # =====================================================
    # VERIFICAR SE JÁ ESTÁ EXECUTANDO
    # =====================================================

    if bot_esta_executando():

        return JsonResponse(
            {
                "sucesso": False,
                "erro": "O bot já está em execução."
            },
            status=409
        )

    # =====================================================
    # LER JSON
    # =====================================================

    try:

        import json

        dados = json.loads(
            request.body.decode("utf-8")
        )

    except Exception:

        return JsonResponse(
            {
                "sucesso": False,
                "erro": "JSON inválido."
            },
            status=400
        )

    # =====================================================
    # CATEGORIAS
    # =====================================================

    categorias = dados.get(
        "categorias",
        []
    )

    keywords_loop = dados.get(
        "keywords_loop",
        []
    )

    # =====================================================
    # VALIDAR CATEGORIAS
    # =====================================================

    if not isinstance(categorias, list):

        return JsonResponse(
            {
                "sucesso": False,
                "erro": "O campo 'categorias' deve ser uma lista."
            },
            status=400
        )

    if not categorias:

        return JsonResponse(
            {
                "sucesso": False,
                "erro": "Selecione pelo menos uma categoria."
            },
            status=400
        )

    # =====================================================
    # VALIDAR KEYWORDS LOOP
    # =====================================================

    if not isinstance(keywords_loop, list):

        return JsonResponse(
            {
                "sucesso": False,
                "erro": "O campo 'keywords_loop' deve ser uma lista."
            },
            status=400
        )

    # =====================================================
    # INICIAR
    # =====================================================

    iniciou = iniciar_bot(
        categorias=categorias,
        keywords_loop=keywords_loop
    )

    if iniciou:

        return JsonResponse(
            {
                "sucesso": True,
                "mensagem": "Bot iniciado com sucesso.",
                "categorias": categorias,
                "keywords_loop": keywords_loop,
            }
        )

    return JsonResponse(
        {
            "sucesso": False,
            "erro": "Não foi possível iniciar o bot."
        },
        status=500
    )