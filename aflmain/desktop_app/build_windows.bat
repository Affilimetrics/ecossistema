@echo off
setlocal
cd /d "%~dp0"

echo =============================================
echo   BUILD - SKALLORA DESKTOP (WINDOWS)
echo =============================================
echo.

REM Prefer Python 3.12 for broad wheel compatibility, but fall back to
REM the default Python installed on this machine (for example Python 3.14).
set "PYTHON_CMD="
py -3.12 --version >nul 2>&1
if not errorlevel 1 set "PYTHON_CMD=py -3.12"

if not defined PYTHON_CMD (
    py -3 --version >nul 2>&1
    if not errorlevel 1 set "PYTHON_CMD=py -3"
)

if not defined PYTHON_CMD (
    python --version >nul 2>&1
    if not errorlevel 1 set "PYTHON_CMD=python"
)

if not defined PYTHON_CMD goto :python_error

for /f "tokens=*" %%V in ('%PYTHON_CMD% --version 2^>^&1') do echo Python selecionado: %%V

echo.
if not exist ".venv\Scripts\python.exe" (
    echo Criando ambiente virtual do aplicativo...
    %PYTHON_CMD% -m venv .venv
    if errorlevel 1 goto :error
)

call ".venv\Scripts\activate.bat"
if errorlevel 1 goto :error

python --version
python -m pip install --upgrade pip
if errorlevel 1 goto :error

python -m pip install -r requirements.txt
if errorlevel 1 goto :error

python -m PyInstaller --clean --noconfirm Skallora.spec
if errorlevel 1 goto :error

echo.
echo Build concluido.
echo Executavel: %CD%\dist\Skallora\Skallora.exe
echo Distribua a pasta inteira dist\Skallora, nao apenas o .exe.
echo O computador de destino precisa ter Google Chrome instalado.
pause
exit /b 0

:python_error
echo ERRO: nenhum Python utilizavel foi encontrado pelo launcher ou pelo comando python.
echo Instale Python 3.12 ou 3.14 e habilite o Python Launcher (py), ou adicione python ao PATH.
pause
exit /b 1

:error
echo.
echo ERRO: o build falhou. Verifique a mensagem imediatamente acima.
echo Se a falha for de pacote sem suporte a sua versao do Python, instale Python 3.12 e execute novamente.
pause
exit /b 1
