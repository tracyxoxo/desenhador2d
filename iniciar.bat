@echo off
title Desenhador2D
echo ========================================
echo         Desenhador2D - Servidor
echo ========================================
echo.

cd /d "%~dp0"

echo Verificando Python...

where py >nul 2>&1

if errorlevel 1 (
    echo.
    echo ERRO: Python nao foi encontrado.
    echo.
    echo Instale o Python e marque a opcao:
    echo "Add Python to PATH"
    echo.
    echo Depois execute este arquivo novamente.
    pause
    exit /b 1
)

echo Python encontrado:
py --version

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

python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

pause
