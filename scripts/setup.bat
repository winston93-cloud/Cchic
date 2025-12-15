@echo off
echo 🚀 Configurando cChic...
echo.

echo 📦 Instalando dependencias...
call npm install

echo.
echo 🗄️ Inicializando base de datos...
call node server/init-data.js

echo.
echo ✅ ¡Configuración completada!
echo.
echo Para iniciar la aplicación:
echo   1. Terminal 1: npm run server:dev
echo   2. Terminal 2: npm run dev
echo   3. Abre: http://localhost:3000
echo.
pause

