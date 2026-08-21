from django.shortcuts import render, HttpResponse

from magalu_bot.bot_controller import (
    iniciar_bot,
    bot_esta_executando,
)

def index(request):
    return render(request, 'core/index.html')

def login(request):
    return render(request, 'core/login.html')

def iniciar_bot_view(request):

    categorias = [
        "cozinha",
    ]

    if bot_esta_executando():

        return HttpResponse(
            "O bot já está em execução."
        )

    iniciou = iniciar_bot(
        categorias=categorias,
        keywords_loop=None
    )

    if iniciou:

        return HttpResponse(
            "Bot iniciado com sucesso."
        )

    return HttpResponse(
        "Não foi possível iniciar o bot."
    )
