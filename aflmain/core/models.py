from django.db import models
from django.conf import settings
from decimal import Decimal, ROUND_HALF_UP
from .fields import EncryptedTextField


class Produto(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="produto")

    marketplace = models.CharField(max_length=40, default="MAGALU", db_index=True)
    categoria = models.CharField(max_length=120, db_index=True)
    nome = models.CharField(max_length=500, blank=True, default="")
    url_produto = models.URLField(max_length=2000)
    preco_anterior = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    preco_atual = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    imagem_url = models.URLField(max_length=3000, blank=True, default="")

    # Indicadores atuais do ecossistema de afiliados.
    comissao_porcentagem = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))
    comissao_valor = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))

    # Campos preparados para as próximas etapas da jornada: dropshipping e
    # e-commerce com estoque. Permanecem neutros enquanto essas fases não
    # estiverem ativas no produto.
    vendas_count = models.PositiveIntegerField(default=0)
    lucro_estimado = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal("0.00"))

    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-atualizado_em"]
        constraints = [models.UniqueConstraint(fields=["owner", "url_produto"], name="uniq_produto_por_owner_url")]

    def calcular_desconto_porcentagem(self):
        """Retorna o desconto percentual atual, limitado a zero quando não há queda."""
        if self.preco_anterior is None or self.preco_atual is None:
            return Decimal("0.00")
        if self.preco_anterior <= 0 or self.preco_atual >= self.preco_anterior:
            return Decimal("0.00")
        desconto = ((self.preco_anterior - self.preco_atual) / self.preco_anterior) * Decimal("100")
        return desconto.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def score_chefe(self):
        """Calcula um score extensível para eleger o Produto Chefe.

        Enquanto o produto estiver na fase de afiliado (sem métricas de vendas
        ou lucro), desconto e comissão recebem pesos de 60/40. Quando as fases
        futuras começarem a alimentar vendas/lucro, esses indicadores passam a
        ter prioridade, normalizados para manter o score em uma faixa previsível.
        """
        vendas = int(self.vendas_count or 0)
        lucro = Decimal(self.lucro_estimado or 0)

        if vendas > 0 or lucro > 0:
            vendas_score = min(Decimal(vendas), Decimal("100"))
            lucro_score = min(max(lucro, Decimal("0")), Decimal("10000")) / Decimal("100")
            score = (vendas_score * Decimal("0.60")) + (lucro_score * Decimal("0.40"))
        else:
            desconto = self.calcular_desconto_porcentagem()
            comissao = max(Decimal(self.comissao_porcentagem or 0), Decimal("0"))
            score = (desconto * Decimal("0.60")) + (comissao * Decimal("0.40"))

        return score.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

    def obter_motivo_chefe(self):
        """Retorna uma justificativa curta e compreensível para o destaque."""
        desconto = self.calcular_desconto_porcentagem()
        comissao = Decimal(self.comissao_porcentagem or 0)

        if self.vendas_count or self.lucro_estimado:
            if self.vendas_count and self.lucro_estimado:
                return "Bom histórico de vendas e lucro estimado."
            if self.vendas_count:
                return "Bom histórico de vendas."
            return "Maior potencial de lucro estimado entre os produtos."

        if desconto > 0 and comissao > 0:
            return "Comissão alta e desconto promocional bom."
        if desconto > 0:
            return "Desconto promocional bom."
        if comissao > 0:
            return "Comissão de afiliado atrativa."
        return "Melhor oportunidade disponível com os dados atuais."

    def __str__(self):
        return self.nome or self.url_produto


class Afiliado(models.Model):
    produto = models.OneToOneField(Produto, on_delete=models.CASCADE, related_name="afiliado")
    link_afiliado = models.URLField(max_length=3000, blank=True, null=True)
    status = models.CharField(max_length=30, default="REVISAR", db_index=True)
    data_criacao = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.produto} - {self.status}"


class Execucao(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="execucao")

    inicio = models.DateTimeField(auto_now_add=True)
    fim = models.DateTimeField(null=True, blank=True)
    estado = models.CharField(max_length=40, default="INICIANDO", db_index=True)
    produtos_processados = models.PositiveIntegerField(default=0)
    produtos_total = models.PositiveIntegerField(default=0)
    links_obtidos = models.PositiveIntegerField(default=0)
    categorias = models.JSONField(default=list, blank=True)
    keywords = models.JSONField(default=list, blank=True)
    keywords_loop = models.JSONField(default=list, blank=True)
    categorias_loop = models.JSONField(default=list, blank=True)
    erro = models.TextField(blank=True, default="")

    class Meta:
        ordering = ["-inicio"]

    def __str__(self):
        return f"Execução #{self.pk} - {self.estado}"


class Mensagem(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="mensagem")

    CANAIS = (
        ("TELEGRAM", "Telegram"),
        ("WHATSAPP", "WhatsApp"),
    )
    STATUS = (
        ("PENDENTE", "Pendente"),
        ("ENVIADO", "Enviado"),
        ("ERRO", "Erro"),
        ("FALHOU", "Falhou"),
    )
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name="mensagens")
    canal = models.CharField(max_length=20, choices=CANAIS)
    status = models.CharField(max_length=20, choices=STATUS, default="PENDENTE")
    conteudo = models.TextField(blank=True, default="")
    data_envio = models.DateTimeField(null=True, blank=True)
    erro = models.TextField(blank=True, default="")
    # Snapshot da oferta no momento da publicação. Permite que o cache diferencie
    # uma repetição idêntica de uma queda real de preço/desconto.
    preco_anterior = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    preco_atual = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    desconto_percentual = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-criado_em"]


class Oferta(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="oferta")

    STATUS = (
        ("RASCUNHO", "Rascunho"),
        ("PRONTA", "Pronta"),
        ("ENVIADA", "Enviada"),
        ("ARQUIVADA", "Arquivada"),
    )
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name="ofertas")
    titulo = models.CharField(max_length=500, blank=True, default="")
    mensagem = models.TextField(blank=True, default="")
    desconto_percentual = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS, default="RASCUNHO")
    criada_em = models.DateTimeField(auto_now_add=True)
    atualizada_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-criada_em"]


class ConfiguracaoCanal(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True, related_name="configuracaocanal")

    CANAIS = (("TELEGRAM", "Telegram"), ("WHATSAPP", "WhatsApp"))
    canal = models.CharField(max_length=20, choices=CANAIS)
    ativo = models.BooleanField(default=False)
    destino = models.CharField(max_length=255, blank=True, default="")
    token = EncryptedTextField(blank=True, default="")
    endpoint = models.URLField(max_length=1000, blank=True, default="")

    class Meta:
        constraints = [models.UniqueConstraint(fields=["owner", "canal"], name="uniq_canal_por_owner")]

    def __str__(self):
        return f"{self.canal}: {'ativo' if self.ativo else 'inativo'}"


class LogExecucao(models.Model):
    NIVEIS = (("INFO", "Info"), ("OK", "OK"), ("WARNING", "Warning"), ("ERROR", "Error"))
    execucao = models.ForeignKey(Execucao, on_delete=models.CASCADE, related_name="logs")
    nivel = models.CharField(max_length=20, choices=NIVEIS, default="INFO")
    mensagem = models.CharField(max_length=2000)
    criado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["id"]


class HistoricoPreco(models.Model):
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name="historico_precos")
    preco = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    registrado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-registrado_em"]



class ConfiguracaoAutomacao(models.Model):
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="configuracao_automacao")
    auto_publicar_ofertas = models.BooleanField(default=False)
    canais_automaticos = models.JSONField(default=list, blank=True)
    cache_retencao_hours = models.PositiveIntegerField(default=120)
    campanha_sazonal = models.CharField(max_length=80, default="NENHUM", blank=True)
    turno_padrao = models.CharField(max_length=20, default="", blank=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Automação de {self.owner}"


class TemplateOferta(models.Model):
    TIPOS = (("CATEGORIA", "Categoria"), ("KEYWORD", "Palavra-chave"))
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="templates_oferta")
    tipo = models.CharField(max_length=20, choices=TIPOS)
    chave = models.CharField(max_length=160)
    chamadas = models.JSONField(default=list, blank=True)
    divulgar_sem_template = models.BooleanField(default=False)
    nativo = models.BooleanField(default=False)
    ativo = models.BooleanField(default=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["tipo", "chave"]
        constraints = [models.UniqueConstraint(fields=["owner", "tipo", "chave"], name="uniq_template_por_owner_tipo_chave")]

    def __str__(self):
        return f"{self.get_tipo_display()}: {self.chave}"


class AlertaSistema(models.Model):
    NIVEIS = (("INFO", "Informação"), ("WARNING", "Alerta"), ("ERROR", "Erro"))
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="alertas_sistema")
    codigo = models.CharField(max_length=100, db_index=True)
    canal = models.CharField(max_length=20, blank=True, default="")
    nivel = models.CharField(max_length=20, choices=NIVEIS, default="WARNING")
    titulo = models.CharField(max_length=180)
    mensagem = models.TextField()
    resolvido = models.BooleanField(default=False)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-atualizado_em"]
        constraints = [models.UniqueConstraint(fields=["owner", "codigo"], name="uniq_alerta_ativo_codigo_owner")]

    def __str__(self):
        return self.titulo


class ProdutoQuente(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="produtos_quentes")
    produto = models.OneToOneField(Produto, on_delete=models.CASCADE, related_name="ranking_quente")
    score = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    motivo = models.CharField(max_length=300, blank=True, default="")
    calculado_em = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-score", "-calculado_em"]

    def __str__(self):
        return f"{self.produto} ({self.score})"


class PerfilUsuario(models.Model):
    owner = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="perfil_local")
    pais = models.CharField(max_length=80, default="Brasil", blank=True)
    estado = models.CharField(max_length=100, blank=True, default="")
    cidade = models.CharField(max_length=120, blank=True, default="")
    timezone = models.CharField(max_length=80, default="America/Sao_Paulo")
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Localização de {self.owner}: {self.timezone}"


class ProgressoColeta(models.Model):
    """Cursor persistente da coleta por usuário/alvo.

    Permite que uma nova execução recente continue da próxima página em vez de
    recomeçar sempre na página 1. Também guarda um pequeno histórico semântico
    para favorecer variedade entre produtos do mesmo nicho.
    """
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="progressos_coleta")
    marketplace = models.CharField(max_length=40, default="MAGALU", db_index=True)
    tipo_alvo = models.CharField(max_length=20, choices=(("categoria", "Categoria"), ("keyword", "Palavra-chave")))
    alvo = models.CharField(max_length=180)
    proxima_pagina = models.PositiveIntegerField(default=1)
    familias_recentes = models.JSONField(default=list, blank=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["owner", "marketplace", "tipo_alvo", "alvo"],
                name="uniq_progresso_coleta_owner_alvo",
            )
        ]
        ordering = ["-atualizado_em"]

    def __str__(self):
        return f"{self.owner} · {self.marketplace} · {self.tipo_alvo}:{self.alvo} → p.{self.proxima_pagina}"
