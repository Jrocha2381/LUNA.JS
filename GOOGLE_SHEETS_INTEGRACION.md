# 📊 Integración Google Sheets - Papel y Luna MVP2

## Estructura de Datos Sincronizada

Tu aplicación está configurada para leer y escribir datos desde/hacia Google Sheets. Aquí está la estructura exacta que debe coincidir:

---

## 📋 SHEET 1: productos

**Columnas en Google Sheets:**

- `A: id` (Número)
- `B: nombre` (Texto)
- `C: categoria` (Texto - puede estar vacío)
- `D: precio` (Número)
- `E: costo` (Número)
- `F: stock` (Número)
- `G: seguimientoInventario` (TRUE/FALSE)

**Cómo se procesa en JavaScript:**

```javascript
// En data.js se normaliza así:
{
  id: 1,
  nombre: "Cuaderno Profesional",
  categoria: "Escolar",
  precioVenta: 14000,    // Viene como 'precio'
  precio: 14000,
  costo: 7000,
  stock: 12,
  seguimientoInventario: true,  // Se convierte TRUE/FALSE
  imagen: "",
  descripcion: "",
  activo: true
}
```

**Rutas API:**

- `GET /productos` - Obtiene lista de productos
- `POST /productos` - Crear/actualizar/eliminar producto (acción en body)

---

## 👥 SHEET 2: clientes

**Columnas en Google Sheets:**

- `A: id` (Texto - formato: `GEN-17763826`)
- `B: nombre` (Texto)
- `C: telefono` (Texto)
- `D: correo` (Texto)

**Cómo se procesa en JavaScript:**

```javascript
// En entidades.js
{
  id: "GEN-17763826",
  nombre: "Prueba API",
  telefono: "1234",
  correo: ""
}
```

**Campos en formulario (carritopage/clientes.html):**

- `#cli-nombre` → nombre
- `#cli-telefono` → telefono
- `#cli-correo` → correo

**Rutas API:**

- `GET /clientes` - Obtiene lista de clientes
- `POST /clientes` - CRUD (action: create/update/delete)

---

## 🏭 SHEET 3: proveedores

**Columnas en Google Sheets:**

- `A: id` (Texto)
- `B: nombre` (Texto)
- `C: telefono` (Texto)
- `D: correo` (Texto)

**Cómo se procesa en JavaScript:**

```javascript
// Estructura idéntica a clientes
{
  id: "GEN-17763826",
  nombre: "Ibra",
  telefono: "312124610",
  correo: "juanseb@gmail.com"
}
```

**Campos en formulario (carritopage/proveedores.html):**

- `#prov-nombre` → nombre
- `#prov-telefono` → telefono
- `#prov-correo` → correo

**Rutas API:**

- `GET /proveedores` - Obtiene lista
- `POST /proveedores` - CRUD

---

## 📂 SHEET 4: categorias

**Columnas en Google Sheets:**

- `A: id` (Texto)
- `B: nombre` (Texto)

**Cómo se procesa en JavaScript:**

```javascript
{
  id: "GEN-17763854",
  nombre: "Categoria API"
}
```

**Campos en formulario (carritopage/categorias-crud.html):**

- `#cat-nombre` → nombre

**Rutas API:**

- `GET /categorias` - Obtiene lista
- `POST /categorias` - CRUD

---

## 💰 SHEET 5: ventas

**Columnas en Google Sheets:**

- `A: id` (Texto - formato: `ID-1764388...`)
- `B: fecha` (Texto/Fecha)
- `C: clienteId` (Texto - referencia a clientes)
- `D: metodoPago` (Texto - "Efectivo", "Tarjeta", etc)
- `E: total` (Número)
- `F: itemsJson` (Texto - JSON string)

**Estructura itemsJson (JSON string):**

```json
[
  {
    "id": 1,
    "nombre": "Pegastick",
    "precio": 3000,
    "costo": 1200,
    "cantidad": 1
  },
  {
    "id": 3,
    "nombre": "Marcador Permanente",
    "precio": 4000,
    "costo": 1800,
    "cantidad": 1
  }
]
```

**Cómo se guarda desde JavaScript (js/ventas.js):**

```javascript
const nuevaVenta = {
  id: `ID-${Date.now()}${Math.random().toString(36).substring(2, 5)}`,
  fecha: new Date().toLocaleString("es-CO"),
  clienteId: clienteId || "",
  metodoPago: metodoPago || "Efectivo",
  total: Number(total) || 0,
  itemsJson: JSON.stringify(
    carrito.map((item) => ({
      id: item.id,
      nombre: item.nombre,
      precio: item.precioVenta || item.precio || 0,
      costo: item.costo || 0,
      cantidad: Number(item.cantidad) || 1,
    })),
  ),
};
```

**Rutas API:**

- `POST /ventas` - Registra nueva venta

---

## 📦 SHEET 6: compras

**Columnas en Google Sheets:**

- `A: id` (Texto - formato: `COMPRA-1764288...`)
- `B: fecha` (Texto/Fecha)
- `C: proveedor` (Texto - ID del proveedor)
- `D: total` (Número)
- `E: itemsJson` (Texto - JSON string)

**Estructura itemsJson (JSON string):**

```json
[
  {
    "id": 1,
    "nombre": "Cuaderno Profesional",
    "cantidad": 5,
    "costo": 7000,
    "subtotal": 35000
  }
]
```

**Cómo se guarda desde JavaScript (js/compras.js):**

```javascript
const nuevaCompra = {
  id: `COMPRA-${Date.now()}${Math.random().toString(36).substring(2, 5)}`,
  fecha: new Date().toLocaleString("es-CO"),
  proveedor: proveedorId || "",
  total: totalCompra,
  itemsJson: JSON.stringify(itemsProcesados),
};
```

**Rutas API:**

- `POST /compras` - Registra nueva compra

---

## 🔄 Sincronización Automática

### Al cargar la aplicación:

```javascript
// En data.js - Se ejecuta automáticamente
sincronizarProductosAPI(); // GET /productos

// En entidades.js - Cuando se inicializa
Entidades.sincronizar("clientes"); // GET /clientes
Entidades.sincronizar("proveedores"); // GET /proveedores
Entidades.sincronizar("categorias"); // GET /categorias
```

### Manual (botón en CRUDs):

```javascript
btnSync.onclick = async () => {
  await Entidades.sincronizar("categorias"); // GET /categorias
  render();
};
```

---

## 📡 Endpoints API (Google Apps Script)

Tu `api.js` debe tener configurada una URL de Google Apps Script que maneje estas rutas:

```javascript
const API_URL = "https://script.googleusercontent.com/...";

// GET: Obtiene datos
await window.API.get('productos');   // Retorna Array
await window.API.get('clientes');    // Retorna Array
await window.API.get('proveedores'); // Retorna Array
await window.API.get('categorias');  // Retorna Array

// POST: Envía/actualiza datos
await window.API.post('ventas', nuevaVenta);
await window.API.post('compras', nuevaCompra);
await window.API.post('categorias', { action: 'create', data: {...} });
await window.API.post('clientes', { action: 'update', id: '...', data: {...} });
await window.API.post('proveedores', { action: 'delete', id: '...' });
```

---

## ✅ Checklist de Sincronización

- [ ] Google Sheet está publicado públicamente
- [ ] Google Apps Script está configurado para leer/escribir
- [ ] URL de API en `api.js` es correcta
- [ ] Nombres de columnas coinciden exactamente en Google Sheets
- [ ] Nombres de rutas coinciden (productos, clientes, ventas, compras, etc)
- [ ] Datos de prueba en cada sheet
- [ ] Botones "🔄 Sincronizar Nube" funcionan en CRUDs
- [ ] Console muestra logs de sincronización (F12)

---

## 🐛 Troubleshooting

### Si no sincroniza:

1. Abre DevTools (F12)
2. Ve a Console
3. Busca logs como: `🔄 Sincronizando productos...`
4. Si hay error de CORS o 404, revisa la URL en `api.js`

### Si los IDs se ven diferentes:

- IDs numéricos (productos) → OK
- IDs con prefijo texto (GEN-, COMPRA-, ID-) → OK
- La app los maneja automáticamente

### Si falta una columna:

- No agregues columnas nuevas sin actualizar el código
- Avisa antes de cambiar nombres de columnas
- La estructura es más importante que la cantidad de datos

---

**Última actualización**: Abril 2026  
**Versión**: MVP 2.0 - Sincronización completa
