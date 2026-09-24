from .models import AlertaSistema, ConfiguracaoAutomacao, ConfiguracaoCanal


def _nome_canal(canal):
    canal = (canal or "CANAL").upper()
    return {"TELEGRAM": "Telegram", "WHATSAPP": "WhatsApp"}.get(canal, canal.title())


def _classificar_erro_canal(canal, detalhe=""):
    canal = (canal or "CANAL").upper()
    nome = _nome_canal(canal)
    erro = str(detalhe or "").lower()

    if any(x in erro for x in ("desativado", "inativo", "disabled")):
        return (
            "WARNING",
            f"{nome} está desativado",
            f"A coleta continua normalmente, mas as ofertas não serão divulgadas pelo {nome} enquanto o canal estiver desativado.",
        )

    if any(x in erro for x in ("não configurado", "nao configurado", "informe token", "chat_id", "sem api", "sem driver", "obrigatórios", "obrigatorios", "configuração incompleta", "configuracao incompleta")):
        return (
            "ERROR",
            f"{nome} não está configurado",
            f"A coleta e o processamento das ofertas continuam normalmente, mas o {nome} precisa ser configurado antes de publicar.",
        )

    if any(x in erro for x in ("401", "unauthorized", "token is invalid", "invalid token", "403", "forbidden", "not enough rights", "bot was blocked")):
        return (
            "ERROR",
            f"Credenciais do {nome} foram recusadas",
            f"A coleta continua normalmente, mas o {nome} recusou a autenticação ou as permissões configuradas. Revise o canal antes de tentar publicar novamente.",
        )

    if any(x in erro for x in ("timeout", "timed out", "connection", "conexão", "conexao", "502", "503", "504", "500", "temporarily", "unavailable")):
        return (
            "WARNING",
            f"{nome} temporariamente indisponível",
            f"A coleta continua normalmente. Algumas ofertas podem não ser enviadas pelo {nome}; o aviso será removido após um envio bem-sucedido.",
        )

    return (
        "ERROR",
        f"Não foi possível divulgar pelo {nome}",
        f"O produto foi processado e preservado, mas a publicação pelo {nome} falhou. Verifique a configuração do canal.",
    )


def registrar_alerta_canal(owner, canal, detalhe=""):
    """Cria/atualiza um alerta sanitizado; detalhes técnicos nunca vão para a UI."""
    if owner is None:
        return None
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
    if owner is None:
        return
    AlertaSistema.objects.filter(
        owner=owner,
        codigo=f"CANAL_{canal.upper()}",
        resolvido=False,
    ).update(resolvido=True)


def _configuracao_incompleta(cfg, canal):
    if cfg is None:
        return True
    if canal == "TELEGRAM":
        return not bool(cfg.token and cfg.destino)
    if canal == "WHATSAPP":
        # Endpoint/token são necessários para publicação automática via API.
        return not bool(cfg.token and cfg.destino and cfg.endpoint)
    return True


def sincronizar_alertas_canais(owner):
    """Reconcilia alertas de configuração sem testar rede a cada carregamento.

    Indisponibilidade de API e credenciais recusadas são detectadas no envio real.
    Aqui tratamos canais esperados pela automação que foram desativados ou ficaram
    incompletos. Um envio bem-sucedido continua sendo a fonte de normalização de
    falhas remotas.
    """
    if owner is None:
        return

    auto = ConfiguracaoAutomacao.objects.filter(owner=owner).first()
    esperados = {str(c).upper() for c in (auto.canais_automaticos or [])} if auto else set()

    for canal in ("TELEGRAM", "WHATSAPP"):
        cfg = ConfiguracaoCanal.objects.filter(owner=owner, canal=canal).first()
        if canal not in esperados:
            # O usuário não espera publicação automática por este canal.
            resolver_alerta_canal(owner, canal)
            continue
        if cfg is None or _configuracao_incompleta(cfg, canal):
            registrar_alerta_canal(owner, canal, "configuração incompleta")
        elif not cfg.ativo:
            registrar_alerta_canal(owner, canal, "canal desativado")
        # Se está ativo e completo, não apagamos aqui um erro remoto anterior.
        # Esse alerta só é resolvido por um envio real bem-sucedido.
