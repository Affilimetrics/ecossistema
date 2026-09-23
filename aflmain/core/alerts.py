from .models import AlertaSistema


def registrar_alerta_canal(owner, canal, detalhe=""):
    canal = (canal or "CANAL").upper()
    nome = {"TELEGRAM": "Telegram", "WHATSAPP": "WhatsApp"}.get(canal, canal.title())
    titulo = f"{nome} mal configurado ou indisponível"
    mensagem = f"ALERTA: {nome} mal configurado ou indisponível no momento. Verifique as configurações ou contate o suporte."
    if detalhe:
        mensagem += f" Detalhe técnico: {str(detalhe)[:500]}"
    alerta, _ = AlertaSistema.objects.update_or_create(
        owner=owner, codigo=f"CANAL_{canal}",
        defaults={"canal": canal, "nivel": "ERROR", "titulo": titulo, "mensagem": mensagem, "resolvido": False},
    )
    return alerta


def resolver_alerta_canal(owner, canal):
    AlertaSistema.objects.filter(owner=owner, codigo=f"CANAL_{canal.upper()}", resolvido=False).update(resolvido=True)
