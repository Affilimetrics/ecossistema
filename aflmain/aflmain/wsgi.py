"""
WSGI config for aflmain project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.1/howto/deployment/wsgi/
"""


import sys
from pathlib import Path
import os

from django.core.wsgi import get_wsgi_application

sys.path.append(str(Path(__file__).resolve().parent))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'aflmain.settings')

application = get_wsgi_application()
