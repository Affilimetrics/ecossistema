import logging
from pathlib import Path
from datetime import datetime

# Pasta dos logs
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

# Nome do arquivo baseado na data
LOG_FILE = LOG_DIR / f"coletor_{datetime.now():%Y-%m-%d}.log"

logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    datefmt="%H:%M:%S",
    encoding="utf-8"
)

logger = logging.getLogger("coletor")


def log_info(mensagem):
    print(f"[INFO] {mensagem}")
    logger.info(mensagem)


def log_ok(mensagem):
    print(f"[OK] {mensagem}")
    logger.info(f"OK | {mensagem}")


def log_revisar(mensagem):
    print(f"[REVISAR] {mensagem}")
    logger.warning(f"REVISAR | {mensagem}")


def log_erro(mensagem):
    print(f"[ERRO] {mensagem}")
    logger.error(mensagem)