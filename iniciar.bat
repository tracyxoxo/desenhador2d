@echo off
title Desenhador2D
echo ========================================
echo         Desenhador2D - Servidor
echo ========================================
echo.

cd /d "%~dp0"

echo Verificando dependencias...
python -m pip install -r requirements.txt --quiet 2>nul

echo.
echo Iniciando servidor em http://127.0.0.1:8000
echo Pressione Ctrl+C para encerrar.
echo.

start http://127.0.0.1:8000

python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload

pause
