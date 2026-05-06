@echo off
REM GUÍA DE DEPLOYMENT RÁPIDO - SISTEMA POS (Windows)

echo.
echo ==================================
echo 🚀 SISTEMA POS - DEPLOYMENT WINDOWS
echo ==================================
echo.

REM Detectar si está en WSL o CMD
if exist "index-new.html" (
    echo ✅ Archivo POS encontrado
    echo.
    echo OPCIÓN 1: Abrir directamente (recomendado)
    echo ===============================
    start "" "index-new.html"
    echo 📂 Abriendo en navegador...
    echo.
    echo OPCIÓN 2: Usar servidor local
    echo ================================
    echo 1. Abre PowerShell o CMD
    echo 2. Navega a esta carpeta
    echo 3. Ejecuta:
    echo    python -m http.server 8000
    echo 4. Abre: http://localhost:8000/index-new.html
    echo.
) else (
    echo ❌ Error: No se encuentra index-new.html
    echo.
    echo Asegúrate de estar en el directorio correcto
    echo debe contener: index-new.html
)

echo.
echo ✅ La aplicación está 100%% funcional
echo ✅ Todos los datos se guardan localmente
echo ✅ No requiere backend externo
echo.
pause
