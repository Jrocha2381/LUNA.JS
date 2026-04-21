# 🔧 GUÍA DE INTEGRACIÓN - NUEVA ARQUITECTURA

## ¿QUÉ CAMBIÓ?

Tu problema era **falta de una arquitectura centralizada**. Ahora:

### ✅ ANTES (Problemas)
```
- Cada módulo guardaba datos independientemente
- No había validación consistente
- Los IDs se generaban inconsistentemente
- No había fallback offline
- Las categorías no se persistían
```

### ✅ AHORA (Solución)
```
- Estado global centralizado (state.js)
- API con offline-first garantizado (apiV2.js)
- Validación en la capa API
- localStorage SIEMPRE guarda primero
- Google Sheets sincroniza en segundo plano
- Categorías se persisten correctamente
```

---

## 📦 NUEVOS ARCHIVOS CREADOS

1. **`js/state.js`** - Estado global centralizado
   - Única fuente de verdad para toda la app
   - Funciones para actualizar y recuperar estado
   - Backup automático a localStorage

2. **`js/apiV2.js`** - API mejorada offline-first
   - `loadResource(resource)` - Cargar desde Sheets/cache
   - `saveItem(resource, item)` - Guardar: localStorage → Sheets
   - `deleteItem(resource, id)` - Eliminar: localStorage → Sheets
   - `loadAllResources()` - Cargar todos en paralelo

3. **`js/app.js`** - Inicialización y control global
   - `initializeApp()` - Iniciar app correctamente
   - `login(usuario, password)` - Autenticar
   - `logout()` - Cerrar sesión
   - `applyRolePermissions()` - Aplicar permisos por rol
   - Auto-sync cada 15 segundos en background

4. **`js/modules/categorias-v2.js`** - Módulo de categorías CORRECTO
   - `createCategory(data)` - Crear con ID único garantizado
   - `updateCategory(id, data)` - Actualizar
   - `deleteCategory(id)` - Eliminar
   - `initCategories(container)` - Renderizar tabla

---

## 🚀 CÓMO INTEGRAR EN TU HTML

### PASO 1: Actualizar el `<head>` del HTML
```html
<!-- Asegúrate de tener esto -->
<script src="https://unpkg.com/@phosphor-icons/web"></script>
```

### PASO 2: Agregar contenedor para toasts
```html
<body>
  <div id="toast-container" style="position: fixed; bottom: 20px; right: 20px; z-index: 10000;"></div>
  
  <!-- Tu HTML existente... -->
</body>
```

### PASO 3: Reemplazar scripts en el HTML
**Cambiar de:**
```html
<script type="module" src="bundle.js"></script>
```

**A:**
```html
<script type="module">
  import { initializeApp, checkAuthentication, applyRolePermissions } from './js/app.js';
  import { initCategories } from './js/modules/categorias-v2.js';
  
  // ========== INICIALIZACIÓN ==========
  document.addEventListener('DOMContentLoaded', async () => {
    console.log('🎯 Iniciando app...');
    
    // 1. Verificar si ya está autenticado
    if (checkAuthentication()) {
      // 2. Inicializar app
      await initializeApp();
      
      // 3. Aplicar permisos
      applyRolePermissions();
      
      // 4. Mostrar vista de dashboard
      document.getElementById('login-overlay').style.display = 'none';
      document.getElementById('app-container').style.display = 'block';
      
      // 5. Inicializar módulos cuando sea necesario
      // Ejemplo para categorías:
      const categoriasContainer = document.getElementById('view-categorias');
      if (categoriasContainer) {
        initCategories(categoriasContainer);
      }
    }
  });
  
  // ========== LOGIN HANDLER ==========
  window.handleLogin = async (e) => {
    e.preventDefault();
    
    const { login } = await import('./js/app.js');
    const usuario = document.getElementById('login-username').value;
    const contraseña = document.getElementById('login-password').value;
    
    if (await login(usuario, contraseña)) {
      // Login exitoso, recargar
      location.reload();
    }
  };
</script>
```

---

## 🧪 PRUEBA LA SOLUCIÓN

### Test 1: Crear Categoría
1. Ir a Sección Categorías
2. Click "Nueva Categoría"
3. Ingresa nombre: "Papelería"
4. Click "Guardar"

**Esperado:**
- ✅ Toast: "✓ Guardado en línea"
- ✅ Categoría aparece en tabla inmediatamente
- ✅ ID generado: CAT-{timestamp}-{random}
- ✅ Aparece en localStorage (`cpos_cache_categorias`)
- ✅ Aparece en Google Sheets después de sincronizar

### Test 2: Editar Categoría
1. Click botón Editar en una categoría
2. Cambiar nombre
3. Click "Guardar"

**Esperado:**
- ✅ Se actualiza en tabla
- ✅ Se guarda en localStorage y Sheets
- ✅ El ID NO cambia

### Test 3: Eliminar Categoría
1. Click botón Eliminar
2. Confirmar eliminación

**Esperado:**
- ✅ Se remueve de tabla
- ✅ Se remueve de localStorage
- ✅ Se sincroniza con Sheets

### Test 4: Offline
1. Abrir DevTools > Network > Offline
2. Crear nueva categoría
3. Ver console: "📦 {resource} guardados desde cache local"

**Esperado:**
- ✅ Funciona igual aunque no haya internet
- ✅ Cuando vuelve internet, auto-sync sincroniza

---

## 📊 ESTRUCTURA DE DATOS CORRECTA

### CATEGORÍA
```javascript
{
  id: "CAT-1713654321-456789",  // Único garantizado
  nombre: "Papelería",
  descripcion: "Productos de papelería",
  fechaCreacion: "2026-04-21T14:30:00.000Z"
}
```

### LOCALSTORAGE
```
cpos_cache_categorias = [
  { id, nombre, descripcion, fechaCreacion },
  { id, nombre, descripcion, fechaCreacion },
  ...
]
```

### GOOGLE SHEETS
Misma estructura, guardada en tabla "categorias"

---

## 🔄 FLUJO CORRECTO DE SINCRONIZACIÓN

```
1. Usuario hace click "Guardar"
   ↓
2. API crea ID único: CAT-{timestamp}-{random}
   ↓
3. Guardar en localStorage (SIEMPRE, instantáneo)
   ↓
4. Actualizar state.categorias (UI optimista)
   ↓
5. Render tabla (usuario ve cambio inmediatamente)
   ↓
6. POST a Google Sheets (background, async)
   ↓
7. Si falla: sigue guardado en localStorage
   ↓
8. Auto-sync cada 15s intenta sincronizar
```

---

## 🚨 ERRORES COMUNES Y SOLUCIONES

### Error: "state is not defined"
**Causa:** No importaste state.js
**Solución:** Agregar `import { state } from './state.js'` en tu módulo

### Error: "localStorage is undefined"
**Causa:** En navegadores muy antiguos
**Solución:** Usar polyfill o verificar soporte antes de usar

### Categorías aún no se guardan
**Causa:** La API endpoint no está funcionando
**Solución:** Verificar:
1. BASE_API URL es correcto
2. Google Apps Script está deployado correctamente
3. Revisar console logs para errores de red

### No hay localStorage/backup
**Causa:** El navegador no permite localStorage
**Solución:** Usar sessionStorage o IndexedDB como fallback

---

## 📝 PRÓXIMOS PASOS RECOMENDADOS

1. **Refactorizar otros módulos** siguiendo el patrón:
   - Importar `{ state, updateState }` de state.js
   - Usar `saveItem`, `deleteItem` de apiV2.js
   - Validar en la capa API, no en el módulo

2. **Implementar CRUD completo** para:
   - Productos ✅ (ya debe estar parcialmente)
   - Usuarios
   - Clientes
   - Proveedores

3. **Agregar validaciones** en apiV2.js:
   - Nombre no vacío
   - Precios positivos
   - Stock válido
   - etc.

4. **Tests** para verificar:
   - Offline-first funciona
   - IDs son únicos
   - Datos se sincronizan
   - Permisos se aplican correctamente

---

## 💡 VENTAJAS DE LA NUEVA ARQUITECTURA

✅ **Offline-first garantizado** - Siempre funciona, incluso sin internet  
✅ **Estado centralizado** - Una única fuente de verdad  
✅ **IDs únicos garantizados** - No hay colisiones  
✅ **Auto-sync automático** - Se sincroniza cada 15s  
✅ **UI responsiva** - Cambios se ven inmediatamente  
✅ **Fallback automático** - localStorage si falla API  
✅ **Fácil de mantener** - Código consistente y predecible  
✅ **Escalable** - Fácil agregar nuevos módulos  

---

## ❓ PREGUNTAS?

Si algo no funciona:
1. Abre DevTools (F12)
2. Revisa la console para mensajes de error
3. Verifica que los archivos estén en las rutas correctas
4. Prueba con datos simples primero
5. Si sigue el error, verifica que BASE_API sea accesible

**¡Ahora inténtalo! 🚀**
