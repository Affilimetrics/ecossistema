"""Publicação automática multicanal e controle de repetição."""
from __future__ import annotations

import os
import time
from datetime import timedelta
from decimal import Decimal
from pathlib import Path
import requests
from django.utils import timezone
from .models import ConfiguracaoCanal, ConfiguracaoAutomacao, Mensagem, Oferta
from .marketing import gerar_mensagem, detectar_turno
from .alerts import registrar_alerta_canal, resolver_alerta_canal

CACHE_HORAS = int(os.getenv("CACHE_RETENCAO_HOURS", "120"))


def _cfg(owner, canal):
    # Em modo multiusuário nunca reutiliza credenciais globais para um usuário
    # autenticado. Isso evita envio acidental pelo bot/chat de outra conta.
    if owner is not None:
        return ConfiguracaoCanal.objects.filter(owner=owner, canal=canal, ativo=True).first()
    return ConfiguracaoCanal.objects.filter(owner__isnull=True, canal=canal, ativo=True).first()


def _desconto_percentual(produto):
    anterior = getattr(produto, "preco_anterior", None)
    atual = getattr(produto, "preco_atual", None)
    if anterior is None or atual is None or anterior <= 0 or atual >= anterior:
        return Decimal("0")
    return ((anterior - atual) / anterior * Decimal("100")).quantize(Decimal("0.01"))


def _produto_quente(produto):
    try:
        return Decimal(str(produto.ranking_quente.score)) >= Decimal("70")
    except Exception:
        return False


def avaliar_elegibilidade_publicacao(produto, canal, horas=None):
    """Política de republicação para execuções longas.

    CACHE evita repetição imediata, mas nunca torna o produto inelegível para
    sempre. Queda relevante de preço/desconto antecipa a elegibilidade e um
    produto muito bem ranqueado recebe uma janela reduzida.
    """
    if horas is None:
        cfg_auto = ConfiguracaoAutomacao.objects.filter(owner=produto.owner).first()
        horas = cfg_auto.cache_retencao_hours if cfg_auto else CACHE_HORAS
    horas = max(1, int(horas))
    ultima = Mensagem.objects.filter(
        produto=produto, canal=canal, status="ENVIADO"
    ).order_by("-data_envio", "-criado_em").first()
    if not ultima:
        return True, "PRIMEIRA_PUBLICACAO"

    agora = timezone.now()
    referencia = ultima.data_envio or ultima.criado_em
    idade = agora - referencia
    retencao = timedelta(hours=horas)
    if idade >= retencao:
        return True, "CACHE_EXPIRADO"

    # Mesmo uma mudança forte não deve causar republicação em sequência.
    if idade < timedelta(hours=1):
        return False, "CACHE"

    atual = getattr(produto, "preco_atual", None)
    preco_publicado = ultima.preco_atual
    desconto_atual = _desconto_percentual(produto)
    desconto_publicado = ultima.desconto_percentual

    # Queda >= 3% em relação ao preço efetivamente divulgado.
    if atual is not None and preco_publicado is not None and preco_publicado > 0:
        queda = (preco_publicado - atual) / preco_publicado * Decimal("100")
        if queda >= Decimal("3"):
            return True, "PRECO_RELEVANTE"

    # Aumento de pelo menos 3 pontos percentuais no desconto anunciado.
    if desconto_publicado is not None and desconto_atual - desconto_publicado >= Decimal("3"):
        return True, "DESCONTO_RELEVANTE"

    # Itens altamente recomendáveis voltam antes à fila, mas ainda respeitam
    # um cooldown mínimo para não gerar spam.
    janela_quente = timedelta(hours=max(6, horas // 4))
    if _produto_quente(produto) and idade >= janela_quente:
        return True, "PRODUTO_QUENTE"

    return False, "CACHE"


def ja_enviada_recentemente(produto, canal, horas=None):
    elegivel, _motivo = avaliar_elegibilidade_publicacao(produto, canal, horas=horas)
    return not elegivel


def mensagem_pronta(produto, turno=None, campanha=None):
    return gerar_mensagem(produto, turno=turno or detectar_turno(owner=produto.owner), campanha=campanha)


def _telegram_erro(response):
    """Extrai o erro real retornado pela API do Telegram."""
    try:
        data = response.json()
        descricao = data.get("description") or data.get("error") or response.text
        codigo = data.get("error_code", response.status_code)
        return f"Telegram API [{codigo}]: {descricao}"
    except ValueError:
        return f"Telegram HTTP [{response.status_code}]: {response.text[:500]}"


def _telegram_post(url, *, json_payload=None, data=None, files=None, timeout=20):
    response = requests.post(
        url,
        json=json_payload,
        data=data,
        files=files,
        timeout=timeout,
    )
    if not response.ok:
        raise RuntimeError(_telegram_erro(response))
    try:
        payload = response.json()
    except ValueError as exc:
        raise RuntimeError(f"Telegram retornou resposta inválida: {response.text[:500]}") from exc
    if not payload.get("ok", False):
        raise RuntimeError(
            f"Telegram API [{payload.get('error_code', 'desconhecido')}]: "
            f"{payload.get('description', 'erro desconhecido')}"
        )
    return payload


def _limitar_mensagem_telegram(texto):
    """Garante o limite da API sem cortar HTML no meio de uma tag."""
    texto = str(texto or "").strip()
    if len(texto) <= 4096:
        return texto
    # A mensagem gerada normalmente fica muito abaixo disso. Se um link/campo
    # excepcionalmente grande ultrapassar o limite, removemos HTML e truncamos
    # de forma segura, preservando a URL caso ela esteja no final.
    from html import unescape
    from re import sub
    plano = unescape(sub(r"<[^>]+>", "", texto))
    return plano[:4093].rstrip() + "..."


def enviar_telegram(oferta, texto=None, imagem_url=None):
    cfg = _cfg(oferta.owner, "TELEGRAM")
    if not cfg or not cfg.token or not cfg.destino:
        raise RuntimeError("Telegram não configurado: informe token e destino (chat_id).")

    texto = _limitar_mensagem_telegram(texto or oferta.mensagem)
    base = f"https://api.telegram.org/bot{cfg.token.strip()}"

    # sendPhoto aceita no máximo 1024 caracteres no caption. Para não transformar
    # uma oferta válida em "Bad Request", quando passar desse limite enviamos a
    # foto sem legenda e depois a mensagem completa.
    if imagem_url:
        try:
            r = requests.get(
                imagem_url,
                timeout=12,
                headers={"User-Agent": "Mozilla/5.0"},
            )
            r.raise_for_status()
            if len(texto) <= 1024:
                return _telegram_post(
                    f"{base}/sendPhoto",
                    data={
                        "chat_id": cfg.destino.strip(),
                        "caption": texto,
                        "parse_mode": "HTML",
                    },
                    files={"photo": ("oferta.jpg", r.content)},
                )

            _telegram_post(
                f"{base}/sendPhoto",
                data={"chat_id": cfg.destino.strip()},
                files={"photo": ("oferta.jpg", r.content)},
            )
            return _telegram_post(
                f"{base}/sendMessage",
                json_payload={
                    "chat_id": cfg.destino.strip(),
                    "text": texto,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": False,
                },
            )
        except Exception:
            # Falha na imagem não deve impedir a publicação do texto. A exceção
            # final do sendMessage, se houver, contém agora o motivo real.
            pass

    return _telegram_post(
        f"{base}/sendMessage",
        json_payload={
            "chat_id": cfg.destino.strip(),
            "text": texto,
            "parse_mode": "HTML",
            "disable_web_page_preview": False,
        },
    )


def enviar_whatsapp_api(oferta, texto=None):
    cfg = _cfg(oferta.owner, "WHATSAPP")
    if not cfg or not cfg.token or not cfg.destino or not cfg.endpoint:
        raise RuntimeError("WhatsApp API não configurado.")
    texto = texto or oferta.mensagem
    headers = {"Authorization": f"Bearer {cfg.token}", "Content-Type": "application/json"}
    payload = {"messaging_product": "whatsapp", "to": cfg.destino, "type": "text", "text": {"preview_url": True, "body": texto}}
    response = requests.post(cfg.endpoint, json=payload, headers=headers, timeout=20)
    response.raise_for_status()
    return response.json()


def enviar_whatsapp_web(driver, oferta, texto=None):
    """Envia pelo WhatsApp Web na aba já autenticada do Chrome do coletor."""
    from selenium.webdriver.common.by import By
    from selenium.webdriver.common.keys import Keys
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    cfg = _cfg(oferta.owner, "WHATSAPP")
    if not cfg or not cfg.destino:
        raise RuntimeError("Configure o destino WhatsApp com o nome exato do grupo/canal.")
    texto = texto or oferta.mensagem
    origem = driver.current_window_handle
    alvo = None
    try:
        for handle in driver.window_handles:
            driver.switch_to.window(handle)
            if "web.whatsapp.com" in (driver.current_url or ""):
                alvo = handle
                break
        if not alvo:
            driver.switch_to.window(origem)
            driver.execute_script("window.open('https://web.whatsapp.com','_blank');")
            alvo = driver.window_handles[-1]
            driver.switch_to.window(alvo)
        wait = WebDriverWait(driver, 30)
        busca = wait.until(EC.element_to_be_clickable((By.XPATH, '//input[@role="textbox"][@aria-label="Pesquisar ou começar uma nova conversa"] | //div[@data-testid="search-input"]')))
        busca.click(); busca.send_keys(Keys.CONTROL, "a"); busca.send_keys(cfg.destino); time.sleep(2); busca.send_keys(Keys.ENTER); time.sleep(2)
        caixa = wait.until(EC.presence_of_element_located((By.XPATH, '//div[@contenteditable="true"][@role="textbox"]')))
        caixa.click(); caixa.send_keys(texto); caixa.send_keys(Keys.ENTER)
        return True
    finally:
        try: driver.switch_to.window(origem)
        except Exception: pass


def publicar_oferta(oferta, canais=None, driver=None, turno=None, campanha=None, ignorar_cache=False):
    produto = oferta.produto
    if not getattr(getattr(produto, "afiliado", None), "link_afiliado", None):
        raise RuntimeError("Oferta sem link de afiliado validado.")
    texto = mensagem_pronta(produto, turno=turno, campanha=campanha)
    oferta.mensagem = texto
    oferta.status = "PRONTA"
    oferta.save(update_fields=["mensagem", "status", "atualizada_em"])
    canais = canais or ["TELEGRAM", "WHATSAPP"]
    resultados = {}
    for canal in canais:
        canal = canal.upper()
        if not ignorar_cache:
            elegivel, motivo = avaliar_elegibilidade_publicacao(produto, canal)
            if not elegivel:
                resultados[canal] = "CACHE"
                continue
        try:
            if canal == "TELEGRAM":
                resultado = enviar_telegram(oferta, texto, getattr(produto, "imagem_url", None))
            elif canal == "WHATSAPP":
                cfg = _cfg(oferta.owner, "WHATSAPP")
                if cfg and cfg.endpoint and cfg.token:
                    resultado = enviar_whatsapp_api(oferta, texto)
                elif driver:
                    resultado = enviar_whatsapp_web(driver, oferta, texto)
                else:
                    raise RuntimeError("WhatsApp sem API e sem driver Selenium disponível.")
            else:
                raise RuntimeError(f"Canal não suportado: {canal}")
            Mensagem.objects.create(
                owner=oferta.owner, produto=produto, canal=canal, status="ENVIADO",
                conteudo=texto, data_envio=timezone.now(),
                preco_anterior=produto.preco_anterior, preco_atual=produto.preco_atual,
                desconto_percentual=_desconto_percentual(produto),
            )
            resolver_alerta_canal(oferta.owner, canal)
            resultados[canal] = "ENVIADO"
        except Exception as exc:
            Mensagem.objects.create(
                owner=oferta.owner, produto=produto, canal=canal, status="FALHOU",
                conteudo=texto, erro=str(exc),
                preco_anterior=produto.preco_anterior, preco_atual=produto.preco_atual,
                desconto_percentual=_desconto_percentual(produto),
            )
            registrar_alerta_canal(oferta.owner, canal, str(exc))
            resultados[canal] = f"FALHOU: {exc}"
    if any(v == "ENVIADO" for v in resultados.values()):
        oferta.status = "ENVIADA"
        oferta.save(update_fields=["status", "atualizada_em"])
    return resultados
