# 🎯 Referencia Rápida - MVP2 Google Sheets

## 📍 Ubicación de Archivos Clave

```
historia/LUNA.JS/
├── api.js ........................... 🔌 Conexión a Google Sheets
├── index.html ....................... 🏠 Inicio
│
├── js/
│   ├── data.js ...................... 📦 Gestión de productos
│   ├── entidades.js ................. 👥 CRUD entidades
│   ├── ventas.js .................... 💰 Registro de ventas
│   ├── compras.js ................... 📥 Registro de compras
│   └── catalogo.js .................. 🛍️ Renderizado dinámico
│
├── carritopage/
│   ├── carrito.html ................. 🛒 Carrito de compra
│   ├── categorias-crud.html ......... 📂 Gestión categorías
│   ├── clientes.html ................ 👤 Gestión clientes
│   ├── proveedores.html ............ 🏭 Gestión proveedores
│   ├── compras.html ................ 📋 Registro de compras
│   └── acceso-admin.html ........... 🔐 Panel admin
│
└── DOCUMENTACION/
    ├── GOOGLE_SHEETS_INTEGRACION.md . 📊 Estructura de datos
    ├── TESTING_GUIDE.md .............. 🧪 Guía de testing
    └── RESUMEN_CAMBIOS.md ........... 📝 Cambios realizados
```

---

## 🔑 Campos por Entidad

### Productos

```javascript
{
  id: 1,                          // Número
  nombre: "Cuaderno",             // Texto
  categoria: "Escolar",           // Vacío permitido
  precio: 14000,                  // Número
  costo: 7000,                    // Número
  stock: 12,                      // Número
  seguimientoInventario: true,    // Boolean (TRUE/FALSE en Sheets)
  imagen: "...",                  // URL
  descripcion: "",                // Texto
  activo: true                    // Boolean
}
```

### Clientes / Proveedores

```javascript
{
  id: "GEN-17763261",             // Texto con prefijo
  nombre: "Juan Pérez",           // Texto
  telefono: "3101234567",         // Texto
  correo: "juan@email.com"        // Texto
}
```

### Categorías

```javascript
{
  id: "GEN-17763854",             // Texto con prefijo
  nombre: "Arte"                  // Texto
}
```

### Ventas

```javascript
{
  id: "ID-1764388887abc",         // Texto con prefijo ID-
  fecha: "21/04/2026 10:30:45",   // Texto
  clienteId: "",                  // Opcional
  metodoPago: "Efectivo",         // Texto
  total: 7000,                    // Número
  itemsJson: "[...]"              // String con JSON
}
```

### Compras

```javascript
{
  id: "COMPRA-1764288xyz",        // Texto con prefijo COMPRA-
  fecha: "21/04/2026 09:15:30",   // Texto
  proveedor: "",                  // Opcional
  total: 35000,                   // Número
  itemsJson: "[...]"              // String con JSON
}
```

---

## 🔄 Rutas API

| Operación           | Ruta           | Método | Datos                                     |
| ------------------- | -------------- | ------ | ----------------------------------------- |
| Obtener productos   | `/productos`   | GET    | -                                         |
| Obtener clientes    | `/clientes`    | GET    | -                                         |
| Obtener proveedores | `/proveedores` | GET    | -                                         |
| Obtener categorías  | `/categorias`  | GET    | -                                         |
| Crear cliente       | `/clientes`    | POST   | `{action:'create', data:{...}}`           |
| Actualizar cliente  | `/clientes`    | POST   | `{action:'update', id:'...', data:{...}}` |
| Eliminar cliente    | `/clientes`    | POST   | `{action:'delete', id:'...'}`             |
| Registrar venta     | `/ventas`      | POST   | `{id, fecha, total, itemsJson, ...}`      |
| Registrar compra    | `/compras`     | POST   | `{id, fecha, total, itemsJson, ...}`      |

---

## 🧩 Flujo de Datos

### Al abrir la tienda:

```
index.html carga
  ↓
data.js se ejecuta
  ↓
sincronizarProductosAPI() → GET /productos
  ↓
Guarda en localStorage["productos"]
  ↓
Renderiza catálogo dinámicamente
```

### Al agregar producto al carrito:

```
Cliente hace click "Añadir"
  ↓
agregarAlCarrito(producto)
  ↓
Guarda en localStorage["carrito"]
  ↓
renderCarrito()
  ↓
Muestra carrito actualizado
```

### Al finalizar compra:

```
Cliente hace click "Finalizar Compra"
  ↓
registrarVenta(carrito, total, metodoPago)
  ↓
Crea objeto venta
  ↓
Guarda en localStorage["ventas"]
  ↓
POST /ventas a Google Sheets
  ↓
Muestra factura
```

---

## 🔌 Funciones Globales

```javascript
// Productos
window.obtenerProductos();
window.guardarProductos(array);
window.crearProducto(data);
window.actualizarProducto(id, cambios);

// Entidades (CRUD)
window.Entidades.obtener(tipo); // tipo: 'clientes', 'proveedores', 'categorias'
window.Entidades.crear(tipo, data);
window.Entidades.actualizar(tipo, id, cambios);
window.Entidades.eliminar(tipo, id);
window.Entidades.sincronizar(tipo);
window.Entidades.buscar(tipo, termino);

// Ventas
window.obtenerVentas();
window.registrarVenta(carrito, total, metodoPago);

// Compras
window.registrarCompra(items, proveedorId);

// Carrito
window.agregarAlCarrito(producto);
window.obtenerCarrito();
window.guardarCarrito(carrito);

// UI
window.mostrarToast(tipo, titulo, mensaje); // tipo: 'success', 'error', 'warning', 'info'
window.mostrarConfirmacion(mensaje, callback);
```

---

## 📲 Locales Storage Keys

```javascript
localStorage.getItem("productos"); // Array de productos
localStorage.getItem("carrito"); // Array de items en carrito
localStorage.getItem("ventas"); // Array de ventas finalizadas
localStorage.getItem("ventas_abiertas"); // Array de ventas pausadas
localStorage.getItem("pos_clientes"); // Array de clientes
localStorage.getItem("pos_proveedores"); // Array de proveedores
localStorage.getItem("pos_categorias"); // Array de categorías
localStorage.getItem("compras"); // Array de compras
```

---

## 🎯 Console Commands de Prueba

```javascript
// Verificar API
window.API.get("productos");
window.API.get("clientes");

// Verificar datos locales
window.obtenerProductos().length;
window.Entidades.obtener("clientes").length;
window.obtenerCarrito();
window.obtenerVentas();

// Crear de prueba
Entidades.crear("clientes", {
  nombre: "Test",
  telefono: "123",
  correo: "test@test.com",
});

// Buscar
Entidades.buscar("clientes", "Juan");

// Limpiar todo
localStorage.clear();
location.reload();
```

---

## 🚨 IDs Generados por el Sistema

| Entidad     | Formato                    | Ejemplo           |
| ----------- | -------------------------- | ----------------- |
| Productos   | Número                     | 1, 2, 3           |
| Clientes    | GEN-[timestamp][random]    | GEN-17763261abcd  |
| Proveedores | GEN-[timestamp][random]    | GEN-17763261xyz   |
| Categorías  | GEN-[timestamp][random]    | GEN-17763854pqr   |
| Ventas      | ID-[timestamp][random]     | ID-1764388887abc  |
| Compras     | COMPRA-[timestamp][random] | COMPRA-1764288xyz |

---

## ✅ Quick Checklist

- [ ] api.js con URL correcta
- [ ] Google Sheets con columnas correctas
- [ ] Google Apps Script publicado
- [ ] localStorage vacío (limpiado)
- [ ] Browser cache limpio (Ctrl+Shift+Del)
- [ ] DevTools abierto para ver logs
- [ ] Pruebas de sincronización

---

## 📞 Debugging Rápido

```javascript
// ¿Qué datos tengo localmente?
Object.keys(localStorage);

// ¿Qué datos tengo de la API?
await window.API.get("clientes");

// ¿Está cargado api.js?
console.log(window.API);

// ¿Está cargado entidades.js?
console.log(window.Entidades);

// ¿Cuál es el error?
// Abre DevTools → Console → busca errores rojos ❌
```

---

## 🎓 Recursos de Referencia

| Documento                    | Propósito                                |
| ---------------------------- | ---------------------------------------- |
| GOOGLE_SHEETS_INTEGRACION.md | Estructura completa de datos y endpoints |
| TESTING_GUIDE.md             | Pasos para probar cada módulo            |
| RESUMEN_CAMBIOS.md           | Cambios realizados vs versión anterior   |
| MVP2_IMPLEMENTACION.md       | Documentación general del proyecto       |

---

**Última actualización**: 21/04/2026  
**Versión**: MVP 2.0  
**Estado**: ✅ Listo para testing
