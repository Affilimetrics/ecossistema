from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    dependencies = [
        ("core", "0001_initial"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="produto",
            name="owner",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="produto",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="execucao",
            name="owner",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="execucao",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="mensagem",
            name="owner",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="mensagem",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="oferta",
            name="owner",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="oferta",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name="configuracaocanal",
            name="owner",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="configuracaocanal",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AlterField(
            model_name="produto",
            name="url_produto",
            field=models.URLField(max_length=2000),
        ),
        migrations.AddConstraint(
            model_name="produto",
            constraint=models.UniqueConstraint(
                fields=("owner", "url_produto"),
                name="uniq_produto_por_owner_url",
            ),
        ),
        migrations.AlterField(
            model_name="configuracaocanal",
            name="canal",
            field=models.CharField(max_length=20, choices=[("TELEGRAM", "Telegram"), ("WHATSAPP", "WhatsApp")]),
        ),
        migrations.AddConstraint(
            model_name="configuracaocanal",
            constraint=models.UniqueConstraint(
                fields=("owner", "canal"),
                name="uniq_canal_por_owner",
            ),
        ),
    ]
