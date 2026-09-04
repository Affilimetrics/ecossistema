@echo off
cd /d "%~dp0"

:: Verifica se a pasta do ambiente virtual já existe, se não, cria ela
if not exist .venv (
    echo Criando ambiente isolado para as dependencias...
    python -m venv .venv
)

:: Ativa o ambiente e instala o pandas caso não esteja instalado
echo Verificando dependencias...
call .venv\Scripts\activate
python -m pip install --upgrade pip
python -m pip install selenium
python -m pip install openpyxl


:: Roda o seu projeto principal
echo Iniciando o bot MAGALU...
python main.py

pause