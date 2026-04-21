# ⚡ QUICK START - INTEGRACIÓN RÁPIDA (5 MINUTOS)

## ANTES DE EMPEZAR
- [ ] Archivo `index.html` abierto
- [ ] Archivos nuevos descargados en `js/`
- [ ] Git commit hecho (`git status` limpio)

---

## PASO 1: Agregar toast-container (1 minuto)

Abre `index.html` y busca `<body>`:

```html
<body>
  <!-- AGREGAR ESTA LÍNEA -->
  <div id="toast-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 10000;"></div>
  
  <!-- El resto de tu HTML... -->
</body>
```

**Verificación:** Guarda archivo (Ctrl+S)

---

## PASO 2: Reemplazar script principal (1 minuto)

Busca al final de `index.html` (antes de `</body>`):

```html
<!-- CAMBIAR ESTO -->
<script type="module" src="bundle.js"></script>

<!-- POR ESTO -->
<script type="module" src="js/index.js"></script>
```

**Verificación:** Guarda archivo (Ctrl+S)

---

## PASO 3: Agregar vista de categorías (1 minuto)

Busca donde están otras vistas (ej: `<div id="view-ventas">`) y agrega:

```html
<!-- VISTA CATEGORÍAS - Agregar en el mismo lugar que otras vistas -->
<div id="view-categorias" style="display: none; padding: 20px;">
  <div class="view-header">
    <h1><i class="ph ph-folder"></i> Categorías</h1>
  </div>
  <div id="categories-container"></div>
</div>
```

**Verificación:** Guarda archivo (Ctrl+S)

---

## PASO 4: Verificar usuarios en Google Sheets (1 minuto)

Abre tu Google Sheets y revisa que haya una tabla "usuarios" con:

| id | usuario | contraseña | nombre | rol | activo |
|----|---------|-----------|--------|-----|--------|
| USER-1 | admin | 123456 | Admin | admin | true |
| USER-2 | cajero | 123456 | Cajero | cajero | true |

**Verificación:** ¿Existen usuarios? ✓

---

## PASO 5: Prueba en navegador (1 minuto)

1. Abre `http://localhost:3000` (o donde tengas tu app)
2. Login: `admin` / `123456`
3. Busca botón **Categorías** en el menú
4. Click en Categorías
5. Click **Nueva Categoría**
6. Ingresa: `Papelería`
7. Click **Guardar**

**Esperado:**
- [ ] Toast verde: "✓ Guardado en línea"
- [ ] Categoría aparece en tabla
- [ ] Nombre: "Papelería"

---

## VERIFICACIÓN EXTRA (Opcional)

### Verificar localStorage
1. DevTools (F12)
2. Tab **Application**
3. **Local Storage** → tu dominio
4. Busca clave: `cache_categorias`
5. Deberías ver array JSON con tu categoría

### Verificar Google Sheets
1. Abre Google Sheets
2. Tabla "categorias"
3. Deberías ver la categoría guardada

---

## ✅ SI FUNCIONÓ

Felicidades! 🎉

Ahora puedes:
- ✅ Crear, editar, eliminar categorías
- ✅ Todo se guarda automáticamente
- ✅ Funciona sin internet (offline-first)
- ✅ Se sincroniza cuando vuelve conexión

---

## ❌ SI NO FUNCIONA

### Error 1: "Módulos no encontrados"
**Solución:**
1. Verifica que existan estos archivos:
   - `js/state.js`
   - `js/apiV2.js`
   - `js/app.js`
   - `js/index.js`
   - `js/modules/categorias-v2.js`

2. Verifica rutas en `js/index.js`:
   ```javascript
   import { initializeApp } from './app.js';  // ✅ Correcto
   // No: import { initializeApp } from './app';  ❌ Falta .js
   ```

### Error 2: "Usuario o contraseña incorrectos"
**Solución:**
1. Verifica que exista tabla "usuarios" en Google Sheets
2. Verifica credenciales: `admin` / `123456`
3. Si no existen, crea usuarios primero

### Error 3: "Categoría no aparece después de guardar"
**Solución:**
1. Abre DevTools Console (F12)
2. Busca errores (texto en rojo)
3. Comparte el error aquí
4. Verifica que BASE_API sea correcto en `apiV2.js`

### Error 4: "Toast no aparece"
**Solución:**
1. Verifica que agregaste `<div id="toast-container">` en HTML
2. Abre DevTools → Tab Console
3. Ejecuta: `localStorage.getItem('appState')`
4. Debería devolver un JSON grande

---

## 📞 AYUDA RÁPIDA

### Ver qué está en localStorage
```javascript
// En DevTools Console, ejecuta:
console.log(JSON.parse(localStorage.getItem('cache_categorias')));
```

### Ver estado global actual
```javascript
// En DevTools Console:
console.log(JSON.parse(localStorage.getItem('appState')));
```

### Limpiar todo y resetear
```javascript
// En DevTools Console:
localStorage.clear();
location.reload();
```

---

## 🎯 PRÓXIMAS VISTAS

Una vez que Categorías funcione, agrega de la misma forma:

- [ ] Vista Productos
- [ ] Vista Usuarios
- [ ] Vista Clientes
- [ ] Vista Proveedores
- [ ] Vista Compras

Cada una seguirá el patrón:
1. `modules/{nombre}-v2.js`
2. Importar en `index.js`
3. `<div id="view-{nombre}">` en HTML

---

**¿Listo? ¡Que funcione! 🚀**
