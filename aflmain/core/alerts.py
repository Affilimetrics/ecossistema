from .models import AlertaSistema


def _classificar_erro_canal(canal, detalhe=""):
    canal = (canal or "CANAL").upper()
    nome = {"TELEGRAM": "Telegram", "WHATSAPP": "WhatsApp"}.get(canal, canal.title())
    erro = str(detalhe or "").lower()

    # Configuração ausente ou incompleta.
    if any(x in erro for x in ("não configurado", "nao configurado", "informe token", "chat_id", "sem api", "sem driver", "obrigatórios", "obrigatorios")):
        return (
            "ERROR",
            f"{nome} não está configurado",
            f"As ofertas continuam sendo processadas, mas não estão sendo divulgadas pelo {nome}. Configure o canal para habilitar os envios.",
        )

    # Falhas de autenticação/permissão: credenciais existem, mas foram recusadas.
    if any(x in erro for x in ("401", "unauthorized", "token is invalid", "invalid token", "403", "forbidden", "not enough rights", "bot was blocked")):
        return (
            "ERROR",
            f"Não foi possível autenticar no {nome}",
            f"As ofertas continuam sendo processadas, mas o {nome} recusou as credenciais ou permissões configuradas. Revise os dados do canal.",
        )

    # Falhas normalmente temporárias de rede/API.
    if any(x in erro for x in ("timeout", "timed out", "connection", "conexão", "conexao", "502", "503", "504", "500", "temporarily", "unavailable")):
        return (
            "WARNING",
            f"{nome} temporariamente indisponível",
            f"O processamento continua normalmente, mas algumas ofertas não puderam ser enviadas pelo {nome}. O sistema voltará a considerar o canal normal após um envio bem-sucedido.",
        )

    return (
        "ERROR",
        f"Falha na divulgação pelo {nome}",
        f"O produto foi processado e preservado, porém a divulgação pelo {nome} falhou. Verifique as configurações do canal ou contate o suporte.",
    )


def registrar_alerta_canal(owner, canal, detalhe=""):
    canal = (canal or "CANAL").upper()
    nivel, titulo, mensagem = _classificar_erro_canal(canal, detalhe)
    alerta, _ = AlertaSistema.objects.update_or_create(
        owner=owner,
        codigo=f"CANAL_{canal}",
        defaults={
            "canal": canal,
            "nivel": nivel,
            "titulo": titulo,
            "mensagem": mensagem,
            "resolvido": False,
        },
    )
    return alerta


def resolver_alerta_canal(owner, canal):
    AlertaSistema.objects.filter(
        owner=owner,
        codigo=f"CANAL_{canal.upper()}",
        resolvido=False,
    ).update(resolvido=True)
