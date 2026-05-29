@echo off
cd /d "%~dp0"
set "MAERA_MODO_LOCAL=true"
set "MAERA_ORCAMENTOS_JSON=db_orcamentos_teste.json"
set "MAERA_VENDEDORES_JSON=vendedores_teste.json"
set "DATABASE_URL="
set "PORT=5500"

for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":5500" ^| findstr "LISTENING"') do (
  taskkill /PID %%P /F >nul 2>nul
)

start "Servidor Maera" /min node server.js
timeout /t 2 /nobreak >nul

start http://localhost:5500
exit
