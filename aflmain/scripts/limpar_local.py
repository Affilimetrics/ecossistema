"""Limpeza conservadora antes da inicialização local.

Remove apenas caches recriáveis. Para SQLite, nunca apaga db.sqlite3; quando o
banco existe, solicita checkpoint do WAL. Sidecars órfãos só são removidos se o
arquivo principal não existir.
"""
from pathlib import Path
import shutil
import sqlite3

ROOT = Path(__file__).resolve().parents[1]

for cache in ROOT.rglob('__pycache__'):
    if 'venv' not in cache.parts and '.venv' not in cache.parts:
        shutil.rmtree(cache, ignore_errors=True)
for pyc in ROOT.rglob('*.pyc'):
    if 'venv' not in pyc.parts and '.venv' not in pyc.parts:
        pyc.unlink(missing_ok=True)

main_db = ROOT / 'db.sqlite3'
sidecars = [ROOT / 'db.sqlite3-journal', ROOT / 'db.sqlite3-wal', ROOT / 'db.sqlite3-shm']
if main_db.exists():
    try:
        with sqlite3.connect(main_db, timeout=10) as con:
            con.execute('PRAGMA wal_checkpoint(TRUNCATE)')
    except sqlite3.DatabaseError as exc:
        print(f'[AVISO] SQLite não pôde ser consolidado automaticamente: {exc}')
else:
    for sidecar in sidecars:
        sidecar.unlink(missing_ok=True)

print('[OK] Caches temporários locais verificados.')
