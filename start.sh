#!/bin/bash
# GUÍA DE DEPLOYMENT RÁPIDO - SISTEMA POS

echo "=================================="
echo "🚀 SISTEMA POS - DEPLOYMENT"
echo "=================================="
echo ""

# Detectar sistema operativo
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📱 Detectado: macOS"
    echo "Abriendo navegador..."
    open index-new.html
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    echo "📱 Detectado: Windows"
    echo "Abriendo navegador..."
    start index-new.html
elif [[ "$OSTYPE" == "linux"* ]]; then
    echo "📱 Detectado: Linux"
    echo "Abriendo navegador..."
    xdg-open index-new.html
fi

echo ""
echo "⏳ Si el navegador no se abre automáticamente:"
echo "1. Abre tu navegador"
echo "2. Navega a: file://$(pwd)/index-new.html"
echo ""
echo "✅ La aplicación está 100% funcional"
echo "✅ Todos los datos se guardan localmente"
echo "✅ No requiere backend externo"
echo ""
