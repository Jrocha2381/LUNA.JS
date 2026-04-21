# 🧪 Guía de Testing - Google Sheets Integration

## ⚡ Testing Rápido (5 minutos)

### 1. Abre la aplicación

```
1. Abre: http://localhost:8000/ (o tu servidor local)
2. Abre DevTools (F12)
3. Ve a "Console"
```

### 2. Verifica sincronización de productos

```javascript
// En la Console, escribe:
window.API.get('productos')

// Debe retornar:
Promise → Array con todos los productos de Google Sheets
// Si ves error: revisa URL en api.js
```

### 3. Verifica sincronización de clientes

```javascript
window.API.get('clientes')

// Debe retornar:
Promise → Array con: id, nombre, telefono, correo
// Verifica que NO tenga campos: documento, email
```

### 4. Crea un nuevo cliente

1. Ve a: `carritopage/acceso-admin.html`
2. Click en "Gestión de Clientes"
3. Llena:
   - Nombre: Test Cliente
   - Teléfono: 3001234567
   - Correo: test@example.com
4. Click "Guardar Cliente"
5. **Verifica**:
   - Aparece en la tabla
   - En Google Sheets también aparece (puede tomar 2-3 seg)

### 5. Edita la categoría

1. Ve a: "Gestión de Categorías"
2. Click en "Editar" de una categoría
3. Cambia el nombre
4. Click "Actualizar Cambios"
5. **Verifica**:
   - Se actualiza en la tabla
   - En Google Sheets también se actualiza

### 6. Prueba una compra

1. Ve a: "Registro de Compras"
2. Selecciona un producto
3. Ingresa cantidad: 5
4. Ingresa costo: 1000
5. Click "Añadir"
6. Click "Finalizar Compra"
7. **Verifica**:
   - Stock se actualiza en productos
   - En Google Sheet "compras" se registra

### 7. Verifica logs en Console

Deberías ver mensajes como:

```
🔄 Sincronizando productos...
✅ Productos sincronizados desde API: 8 registros
✅ cliente creado: {id: "GEN-...", nombre: "..."}
📤 Enviando compra a Google Sheets...
✅ Compra sincronizada con Google Sheets: COMPRA-...
```

---

## 🔍 Testing Detallado por Módulo

### ✅ Módulo: Productos

**Ubicación**: `js/data.js`

**Test 1 - Sincronización automática**

```javascript
// En Console:
window.obtenerProductos();
// Debe retornar array con todos los productos
```

**Test 2 - Estructura correcta**

```javascript
const prods = window.obtenerProductos();
console.log(prods[0]);
// Debe tener: id, nombre, categoria, precio, costo, stock, imagen, descripcion, activo
// NO debe tener: documento, email, descripción (sin tilde)
```

**Test 3 - Categorías especiales**

```javascript
const artículos = prods.filter((p) => p.categoria === "Arte");
console.log(artículos);
// Debe filtrar correctamente
```

---

### ✅ Módulo: Clientes

**Ubicación**: `carritopage/clientes.html` + `js/entidades.js`

**Test 1 - Lectura desde Google Sheets**

```javascript
// Abre DevTools en clientes.html
window.API.get("clientes");
// Retorna: [{id: "GEN-...", nombre: "...", telefono: "...", correo: "..."}]
```

**Test 2 - Crear cliente**

- Forma en HTML: nombre (required), telefono, correo
- Verifica que NO hay campos: documento, email
- Al crear, debe generar ID tipo: `GEN-17763261`

**Test 3 - Editar cliente**

- Abre un cliente para editar
- Campos deben ser: nombre, telefono, correo
- Al guardar, debe llamar a `Entidades.actualizar('clientes', id, data)`

**Test 4 - Sincronizar manual**

- Click "🔄 Sincronizar Nube"
- Debe ejecutar: `Entidades.sincronizar('clientes')`
- Debe recargar datos desde Google Sheets

---

### ✅ Módulo: Categorías

**Ubicación**: `carritopage/categorias-crud.html`

**Test 1 - Estructura simplificada**

- Solo 2 campos en formulario: nombre (requerido)
- NO debe haber: descripción, otros campos

**Test 2 - Crear categoría**

```javascript
// Forma: nombre = "Arte Moderno"
// Genera ID: GEN-17763854
// En Google Sheets aparece en sheet "categorias"
```

**Test 3 - Verificar eliminación de campo descripción**

```javascript
const cats = Entidades.obtener("categorias");
console.log(cats[0]);
// Debe ser: {id: "...", nombre: "..."}
// NO debe tener: descripcion, otros campos
```

---

### ✅ Módulo: Ventas

**Ubicación**: `carritopage/carrito.html` + `js/ventas.js`

**Test 1 - Finalizar compra**

1. Agrega productos al carrito
2. Finaliza compra
3. En Console:
   ```javascript
   window.obtenerVentas();
   // Retorna: [{id: "ID-...", fecha: "...", clienteId: "...", metodoPago: "...", total: ..., itemsJson: "..."}]
   ```

**Test 2 - Estructura correcta de itemsJson**

```javascript
const ventas = window.obtenerVentas();
const items = JSON.parse(ventas[0].itemsJson);
console.log(items);
// Cada item debe tener: id, nombre, precio, costo, cantidad
```

**Test 3 - Sincronización con Google Sheets**

- En Console:
  ```javascript
  window.API.post("ventas", {
    id: "ID-test",
    fecha: "2026-04-21",
    clienteId: "",
    metodoPago: "Efectivo",
    total: 7000,
    itemsJson: JSON.stringify([
      { id: 1, nombre: "Test", precio: 7000, costo: 3500, cantidad: 1 },
    ]),
  });
  ```
- Debe aparecer en Google Sheet "ventas"

---

### ✅ Módulo: Compras

**Ubicación**: `carritopage/compras.html` + `js/compras.js`

**Test 1 - Registrar compra**

1. Ve a "Registro de Compras"
2. Agrega producto: cantidad 3, costo 5000
3. Finaliza
4. En Console:
   ```javascript
   window.obtenerProductos()[0].stock;
   // Stock debe aumentar en 3
   ```

**Test 2 - Sincronización de compra**

```javascript
const compras = JSON.parse(localStorage.getItem("compras"));
console.log(compras[0]);
// Debe tener: id: "COMPRA-...", fecha, proveedor, total, itemsJson
```

---

## 🐛 Errores Comunes y Soluciones

### Error 1: "API.get is not a function"

```
❌ Problema: api.js no se cargó
✅ Solución: Verifica que index.html carga: <script src="api.js"></script>
```

### Error 2: "Unexpected character in JSON at line 1"

```
❌ Problema: itemsJson está mal formado
✅ Solución: Verifica que JSON.stringify() se ejecutó correctamente
```

### Error 3: "undefined is not an object (evaluating 'Entidades.obtener')"

```
❌ Problema: entidades.js no se importó
✅ Solución: Verifica que HTML usa: import { Entidades } from '../js/entidades.js'
```

### Error 4: "Failed to fetch - CORS error"

```
❌ Problema: URL de Google Apps Script está mal
✅ Solución:
  1. Abre api.js
  2. Verifica que const API_URL es válida
  3. Prueba la URL en navegador (debe retornar JSON)
```

---

## 📊 Verificación Visual

### En navegador:

**Página de Clientes:**

```
┌─────────────────────────────────────┐
│ Gestión de Clientes                 │
├─────────────────────────────────────┤
│ Nombre: [ texto ]                   │
│ Teléfono: [ texto ]                 │
│ Correo: [ email ]                   │
│ Botón: [Guardar] [Cancelar]         │
├─────────────────────────────────────┤
│ ID          │ Nombre     │ Acciones  │
│ GEN-123456  │ Juan Pérez │ Edit Del  │
└─────────────────────────────────────┘
```

**Página de Categorías:**

```
┌─────────────────────────────────────┐
│ Gestión de Categorías               │
├─────────────────────────────────────┤
│ Nombre: [ texto ]           ← SOLO ESTE
│ Botón: [Guardar] [Cancelar] │
├─────────────────────────────────────┤
│ ID          │ Nombre  │ Acciones  │
│ GEN-17763854│ Escolar │ Edit Del  │
└─────────────────────────────────────┘
```

---

## ✅ Checklist Final

- [ ] Products sincroniza al cargar
- [ ] CRUDs abren correctamente
- [ ] Botón 🔄 funciona
- [ ] Se puede crear registro nuevo
- [ ] Se puede editar registro
- [ ] Se puede eliminar registro
- [ ] Datos aparecen en Google Sheets
- [ ] IDs tienen el prefijo correcto (GEN-, ID-, COMPRA-)
- [ ] Console muestra logs correctos
- [ ] No hay errores en Console

---

**¡Cuando todo funcione, estás listo para producción! 🚀**
