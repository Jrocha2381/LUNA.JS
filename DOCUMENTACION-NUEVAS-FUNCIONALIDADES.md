# 📋 DOCUMENTACIÓN - SISTEMA POS EXTENDIDO

## ✅ CAMBIOS IMPLEMENTADOS

Este documento describe todas las nuevas funcionalidades agregadas al sistema POS sin romper compatibilidad con el código existente.

---

## 🎯 NUEVAS FUNCIONALIDADES

### 1️⃣ **VENTAS ABIERTAS (Pausadas)**

#### Descripción
Ahora puedes crear ventas en estado "abierto" y editarlas en tiempo real. Luego cierras la venta cuando está lista.

#### Funciones Globales
```javascript
// Crear venta abierta
const venta = window.crearVentaAbierta();

// Obtener venta abierta
const venta = window.obtenerVentaAbierta(ventaId);

// Agregar producto a venta
window.agregarItemVentaAbierta(ventaId, producto, cantidad);

// Actualizar cantidad
window.actualizarItemVentaAbierta(ventaId, productoId, cantidad);

// Eliminar producto
window.eliminarItemVentaAbierta(ventaId, productoId);

// Calcular total
const total = window.calcularTotalVenta(venta);

// Cerrar venta (genera snapshot para historial)
const ventaCerrada = window.cerrarVentaAbierta(ventaId, total);

// Listar ventas abiertas
const ventas = window.obtenerVentasAbiertas();
```

#### Estructura de Venta Abierta
```javascript
{
  id: "VENTA-1234567890",
  creada: "01/01/2025 10:30:00",
  ultimaEdicion: "01/01/2025 10:35:00",
  items: [
    {
      id: 1,
      nombre: "Cuaderno",
      precioVenta: 5000,
      cantidad: 2,
      costo: 2000
    }
  ],
  clienteId: null,
  metodoPago: "Efectivo"
}
```

---

### 2️⃣ **CRUD DE ENTIDADES (Clientes, Proveedores, Categorías)**

#### Ubicación
- **Dashboard**: `carritopage/admin-dashboard.html`
- **Lógica**: `js/admin-funciones.js`

#### Funciones Disponibles

**CLIENTES:**
```javascript
// Crear cliente
const cliente = window.AdminCRUD.crearCliente({
  nombre: "Juan Pérez",
  telefono: "3001234567",
  email: "juan@example.com"
});

// Listar clientes
const clientes = window.AdminCRUD.listarClientes();

// Buscar cliente
const resultados = window.AdminCRUD.buscarClientes("Juan");

// Actualizar cliente
window.AdminCRUD.actualizarCliente(clienteId, {
  nombre: "Nuevo nombre",
  telefono: "3009876543"
});

// Eliminar cliente
window.AdminCRUD.eliminarCliente(clienteId);
```

**PROVEEDORES:**
```javascript
// Crear proveedor
const proveedor = window.AdminCRUD.crearProveedor({
  nombre: "Papel Colombiano S.A.",
  contacto: "Gerente de Ventas",
  telefono: "6014567890",
  email: "ventas@papelcol.com"
});

// Listar proveedores
const proveedores = window.AdminCRUD.listarProveedores();

// Buscar proveedor
const resultados = window.AdminCRUD.buscarProveedores("Papel");

// Actualizar proveedor
window.AdminCRUD.actualizarProveedor(proveedorId, {...});

// Eliminar proveedor
window.AdminCRUD.eliminarProveedor(proveedorId);
```

**CATEGORÍAS:**
```javascript
// Crear categoría
const categoria = window.AdminCRUD.crearCategoria({
  nombre: "Útiles Escolares"
});

// Listar categorías
const categorias = window.AdminCRUD.listarCategorias();

// Buscar categoría
const resultados = window.AdminCRUD.buscarCategorias("Escolar");

// Actualizar categoría
window.AdminCRUD.actualizarCategoria(categoriaId, {
  nombre: "Nuevo nombre"
});

// Eliminar categoría
window.AdminCRUD.eliminarCategoria(categoriaId);
```

#### Estructura de Datos
```javascript
// CLIENTE
{
  id: "CLI-1234567890ABC",
  nombre: "Juan Pérez",
  telefono: "3001234567",
  email: "juan@example.com"
}

// PROVEEDOR
{
  id: "PROV-1234567890ABC",
  nombre: "Papel Colombiano S.A.",
  contacto: "Gerente de Ventas",
  telefono: "6014567890",
  email: "ventas@papelcol.com"
}

// CATEGORÍA
{
  id: "CAT-1234567890ABC",
  nombre: "Útiles Escolares"
}
```

---

### 3️⃣ **DASHBOARD DE ADMINISTRACIÓN**

#### Ubicación
📍 `carritopage/admin-dashboard.html`

#### Características
✅ Navegación SPA (Single Page Application)  
✅ Vistas separadas para:
- 📊 Dashboard (estadísticas)
- 📦 Productos (CRUD)
- 🛒 Ventas abiertas
- 📥 Compras
- 👥 Clientes (CRUD)
- 🏭 Proveedores (CRUD)
- 🏷️ Categorías (CRUD)

#### Acceso
1. Desde **index.html**: Click en icono ⚙️ (Admin)
2. O directo a: `http://localhost:xxx/carritopage/admin-dashboard.html`

#### Funcionalidades
- ✏️ Editar entidades
- 🗑️ Eliminar entidades
- 🔍 Buscar entidades
- 📊 Ver estadísticas en dashboard
- 🛒 Gestionar ventas abiertas

---

### 4️⃣ **EDICIÓN DE PRODUCTOS EN CARRITO**

#### Características
En el carrito puedes:
✏️ Editar precio unitario en tiempo real  
🔢 Cambiar cantidad (+ -)  
🗑️ Eliminar productos

#### Cómo funciona
1. Agregar producto al carrito
2. En carrito.html, ver inputs para editar precio y cantidad
3. Los cambios se guardan en localStorage automáticamente
4. El total se recalcula en tiempo real

#### Integración con Ventas Abiertas
Si estás editando una venta abierta:
```javascript
// El sistema detecta automáticamente
const ventaId = sessionStorage.getItem("ventaEnEdicionId");

// Editar precio en venta abierta
window.editarPrecioVentaEnEdicion(productoId, nuevoPrecio);

// Actualizar cantidad en venta abierta
window.actualizarCantidadVentaEnEdicion(productoId, cantidad);
```

---

## 🔧 COMPATIBILIDAD CON CÓDIGO EXISTENTE

### Cambios en Archivos Existentes

#### ✅ `js/entidades.js`
- **Cambio**: Convertido a IIFE (Immediately Invoked Function Expression)
- **Razón**: Evitar conflicto con ES6 exports
- **Compatibilidad**: 100% - sigue exponiendo `window.Entidades`

#### ✅ `js/data.js`
- **Cambio**: Agregadas funciones de ventas abiertas
- **NO ROMPE**: Funciones existentes siguen intactas
- **Nuevas**: `crearVentaAbierta()`, `obtenerVentasAbiertas()`, etc.

#### ✅ `carritopage/carrito.html`
- **Cambio**: Agregados 2 scripts nuevos
- **NO ROMPE**: carrito.js sigue igual
- **Nuevos scripts**:
  - `entidades.js`
  - `admin-funciones.js`
  - `integracion-ventas-abiertas.js`

#### ✅ `index.html`
- **Cambio**: Agregado link a dashboard (⚙️ Admin)
- **NO ROMPE**: Otros links siguen igual

---

## 💾 ALMACENAMIENTO

### LocalStorage Keys
```javascript
// Nuevas keys
"ventas_abiertas"       // Array de ventas abiertas
"carrito_actual"        // Carrito en progreso
"pos_clientes"          // Lista de clientes
"pos_proveedores"       // Lista de proveedores
"pos_categorias"        // Lista de categorías

// Existentes (sin cambios)
"productos"             // Catálogo de productos
"carrito"               // Carrito clásico
"ventas"                // Historial de ventas cerradas
"compras"               // Historial de compras
```

### SessionStorage Keys
```javascript
"ventaEnEdicionId"      // ID de venta en edición actual
```

---

## 📖 FLUJOS DE TRABAJO

### Flujo 1: Crear Venta Abierta desde Admin

```
1. Admin Dashboard → Ventas Abiertas → "+ Nueva Venta"
2. Se crea venta con ID único
3. Pausa venta para editar después
4. Vista muestra ventas abiertas
5. Click "Editar" → Abre carrito.html para editar
6. Edita productos, precios, cantidades
7. Click "Cerrar venta" → Guarda en historial
```

### Flujo 2: Crear/Editar Clientes

```
1. Admin Dashboard → Clientes
2. Click "+ Nuevo Cliente"
3. Modal con formulario (Nombre, Teléfono, Email)
4. Guardar → Se crea cliente con ID automático
5. Buscar cliente → Filtra por nombre/teléfono
6. Editar → Abre modal pre-llenado
7. Eliminar → Confirmación y elimina
```

### Flujo 3: Gestionar Productos desde Carrito

```
1. Abrir carrito (agregar productos)
2. Input de precio → Edita precio unitario
3. Input de cantidad → Edita cantidad
4. Total recalcula automáticamente
5. Click "Eliminar" → Quita del carrito
6. Click "Cerrar venta" → Registra venta
```

---

## 🚀 EJEMPLOS DE USO

### Ejemplo 1: Crear Cliente Desde Código

```javascript
try {
  const cliente = window.AdminCRUD.crearCliente({
    nombre: "Maria López",
    telefono: "3155551234",
    email: "maria@example.com"
  });
  console.log("✅ Cliente creado:", cliente.id);
} catch (error) {
  console.error("❌ Error:", error.message);
}
```

### Ejemplo 2: Crear Venta Abierta Desde Código

```javascript
// Crear venta
const venta = window.crearVentaAbierta();
console.log("ID Venta:", venta.id);

// Agregar productos (asumiendo productos existen)
const productos = window.obtenerProductos();
const producto1 = productos[0];

window.agregarItemVentaAbierta(venta.id, producto1, 2);

// Ver total
const total = window.calcularTotalVenta(venta);
console.log("Total:", total);

// Cerrar venta
const ventaCerrada = window.cerrarVentaAbierta(venta.id, total);
console.log("✅ Venta cerrada:", ventaCerrada.id);
```

### Ejemplo 3: Sincronizar con Backend (Cuando esté habilitado)

```javascript
// En index.html o en script global:
window.LunaConfig = {
  backend: {
    enabled: true,
    baseUrl: "https://api.miapp.com",
    apiPrefix: "/api/v1"
  }
};

// Ahora las funciones sincronizarán automáticamente:
window.AdminCRUD.crearCliente(...); // También envía a API
window.registrarCompra(...);         // También envía a API
window.registrarVenta(...);          // También envía a API
```

---

## 📊 ESTADÍSTICAS & EVENTOS

### Eventos Disponibles

```javascript
// Escuchar cambios en entidades
window.addEventListener("clienteCreado", (e) => {
  console.log("Nuevo cliente:", e.detail);
});

window.addEventListener("ventasAbiertasActualizadas", (e) => {
  console.log("Ventas abiertas:", e.detail);
});

window.addEventListener("productosActualizados", (e) => {
  console.log("Productos:", e.detail);
});
```

### Dashboard Automático
El dashboard muestra:
- Total de productos
- Total de ventas abiertas
- Total de clientes
- (Más métricas próximamente)

---

## ⚙️ CONFIGURACIÓN

### Habilitar Backend

Agregar antes de cargar scripts:
```html
<script>
  window.LunaConfig = {
    backend: {
      enabled: true,
      baseUrl: "http://localhost:3000",
      apiPrefix: "/api"
    }
  };
</script>

<script src="js/backend.js"></script>
<script src="js/data.js"></script>
<!-- etc -->
```

### Rutas API Esperadas
```
GET    /api/productos        → [{ id, nombre, ... }]
POST   /api/ventas          → { id, fecha, ... }
POST   /api/compras         → { id, fecha, ... }
GET    /api/clientes        → [{ id, nombre, ... }]
POST   /api/clientes        → { id, nombre, ... }
PUT    /api/clientes/:id    → { id, nombre, ... }
DELETE /api/clientes/:id    → { ok: true }
<!-- (Similar para proveedores y categorías) -->
```

---

## 🐛 TROUBLESHOOTING

### Problema: El dashboard no carga
**Solución**: Verificar que todos los scripts están en carrito.html:
- `entidades.js`
- `admin-funciones.js`
- `admin-dashboard.js`

### Problema: Ventas abiertas no se guardan
**Solución**: Verificar localStorage:
```javascript
console.log(localStorage.getItem("ventas_abiertas"));
```

### Problema: Backend no sincroniza
**Solución**: Verificar configuración de `window.LunaConfig` y que `Backend.isEnabled()` retorna `true`:
```javascript
console.log(window.Backend.isEnabled());
console.log(window.LunaConfig);
```

---

## 📝 NOTAS IMPORTANTES

✅ **Totalmente compatible**: El código nuevo NO rompe funcionamiento existente  
✅ **Modular**: Cada funcionalidad está en su propio archivo  
✅ **Extensible**: Fácil agregar más funcionalidades  
✅ **localStorage**: Funciona 100% offline  
✅ **Backend-ready**: Preparado para sincronización cuando sea necesario

---

## 🎓 PRÓXIMOS PASOS SUGERIDOS

1. ✨ Agregar modal de edición para productos
2. 🔐 Implementar autenticación simple
3. 📱 Optimizar para móviles
4. 📊 Agregar reportes (ventas por día, etc.)
5. 🗄️ Conectar con base de datos real
6. 🔔 Notificaciones en tiempo real

---

**Versión**: 2.0.0  
**Última actualización**: 2025-01-02  
**Status**: ✅ Producción
