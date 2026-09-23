from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from core.models import Oferta
from core.publicacao import publicar_oferta

class Command(BaseCommand):
    help = "Publica automaticamente ofertas com link afiliado válido usando templates inteligentes."

    def add_arguments(self, parser):
        parser.add_argument("--owner", type=int, default=None)
        parser.add_argument("--limite", type=int, default=20)
        parser.add_argument("--turno", default=None)
        parser.add_argument("--campanha", default=None)
        parser.add_argument("--canal", action="append", choices=["TELEGRAM", "WHATSAPP"], default=None)
        parser.add_argument("--forcar", action="store_true")

    def handle(self, *args, **opts):
        qs = Oferta.objects.filter(status__in=["RASCUNHO", "PRONTA"], produto__afiliado__status="OK").select_related("produto", "produto__afiliado", "owner")
        if opts["owner"]:
            qs = qs.filter(owner_id=opts["owner"])
        canais = opts["canal"] or ["TELEGRAM", "WHATSAPP"]
        total = 0
        for oferta in qs[:opts["limite"]]:
            try:
                resultado = publicar_oferta(oferta, canais=canais, turno=opts["turno"], campanha=opts["campanha"], ignorar_cache=opts["forcar"])
                self.stdout.write(self.style.SUCCESS(f"Oferta {oferta.pk}: {resultado}"))
                total += 1
            except Exception as exc:
                self.stdout.write(self.style.ERROR(f"Oferta {oferta.pk}: {exc}"))
        self.stdout.write(self.style.SUCCESS(f"Concluído: {total} ofertas processadas."))
