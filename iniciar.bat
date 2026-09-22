@echo off
title Desenhador2D
echo ========================================
echo         Desenhador2D - Servidor
echo ========================================
echo.

cd /d "%~dp0"

echo Verificando o uv...
where uv >nul 2>nul
if errorlevel 1 (
    echo ERRO: 'uv' nao encontrado no PATH.
    echo Instale com: powershell -c "irm https://astral.sh/uv/install.ps1 ^| iex"
    pause
    exit /b 1
)

echo Sincronizando dependencias...
uv sync
if errorlevel 1 (
    echo ERRO: falha ao sincronizar as dependencias.
    pause
    exit /b 1
)

echo.
echo Verificando ambiente virtual...

if not exist "venv\Scripts\python.exe" (
    echo Criando ambiente virtual...
    py -m venv venv

    if errorlevel 1 (
        echo.
        echo ERRO: Nao foi possivel criar o ambiente virtual.
        pause
        exit /b 1
    )
)

echo.
echo Ativando ambiente virtual...
call "venv\Scripts\activate.bat"

if errorlevel 1 (
    echo.
    echo ERRO: Nao foi possivel ativar o ambiente virtual.
    pause
    exit /b 1
)

echo.
echo Python do ambiente virtual:
python --version

echo.
echo Atualizando pip...
python -m pip install --upgrade pip --quiet

echo.
echo Instalando dependencias...
python -m pip install -r requirements.txt --quiet

if errorlevel 1 (
    echo.
    echo ERRO: Falha ao instalar as dependencias.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Ambiente virtual: OK
echo Dependencias: OK
echo ========================================
echo.

echo Iniciando servidor em http://127.0.0.1:8000
echo Pressione Ctrl+C para encerrar.
echo.

start http://127.0.0.1:8000

uv run uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload

pause
