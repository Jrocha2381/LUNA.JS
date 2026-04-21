# 📊 Resumen de Cambios - Google Sheets Integration

## Antes vs Ahora

### ❌ ANTES (Estructura deficiente)

```
Clientes:
- id (Date.now())
- nombre
- documento        ← NO EXISTE EN GOOGLE SHEETS ❌
- email           ← NO EXISTE EN GOOGLE SHEETS ❌
- telefono

Categorías:
- id
- nombre
- descripcion     ← NO EXISTE EN GOOGLE SHEETS ❌
```

### ✅ AHORA (Sincronizado con Google Sheets)

```
Clientes:
- id (GEN-17763261)       ← Con prefijo
- nombre
- telefono        ← Coincide exacto
- correo          ← Campo correcto (no "email")

Categorías:
- id (GEN-17763854)
- nombre
                  ← Descripción ELIMINADA ✓

Proveedores:
- id
- nombre
- telefono
- correo
```

---

## 🔄 Flujo de Sincronización

### Carga Inicial (Al abrir la aplicación):

```
┌─────────────────────────┐
│   Abre index.html       │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│  data.js se carga       │
└────────────┬────────────┘
             ↓
┌─────────────────────────────────┐
│ sincronizarProductosAPI()       │
│  GET /productos desde API       │
└────────────┬────────────────────┘
             ↓
┌─────────────────────────┐
│ Guarda en localStorage  │
└────────────┬────────────┘
             ↓
┌─────────────────────────┐
│ Renderiza catálogo      │
└─────────────────────────┘
```

### Sincronización Manual (CRUDs):

```
Botón "🔄 Sincronizar Nube" → Entidades.sincronizar(tipo)
                            ↓
                    GET /{tipo}
                            ↓
                  Actualiza localStorage
                            ↓
                      Renderiza tabla
```

### Guardar Datos (CREATE/UPDATE/DELETE):

```
Formulario → submit → Entidades.crear/actualizar/eliminar()
                            ↓
                    Guarda en localStorage
                            ↓
                  POST a Google Sheets
                            ↓
              Renderiza tabla actualizada
```

---

## 📋 Estructura de Datos - Comparativa

| Campo      | Productos | Clientes | Proveedores | Categorías | Ventas  | Compras     |
| ---------- | --------- | -------- | ----------- | ---------- | ------- | ----------- |
| id         | ✓         | ✓ (GEN-) | ✓           | ✓ (GEN-)   | ✓ (ID-) | ✓ (COMPRA-) |
| nombre     | ✓         | ✓        | ✓           | ✓          | -       | -           |
| categoria  | ✓         | -        | -           | -          | -       | -           |
| precio     | ✓         | -        | -           | -          | -       | -           |
| costo      | ✓         | -        | -           | -          | -       | -           |
| stock      | ✓         | -        | -           | -          | -       | -           |
| telefono   | -         | ✓        | ✓           | -          | -       | -           |
| correo     | -         | ✓        | ✓           | -          | -       | -           |
| fecha      | -         | -        | -           | -          | ✓       | ✓           |
| clienteId  | -         | -        | -           | -          | ✓       | -           |
| proveedor  | -         | -        | -           | -          | -       | ✓           |
| metodoPago | -         | -        | -           | -          | ✓       | -           |
| total      | -         | -        | -           | -          | ✓       | ✓           |
| itemsJson  | -         | -        | -           | -          | ✓       | ✓           |

---

## 🎯 Verificación Checklist

### Google Sheets

- [ ] Columnas en "productos": id, nombre, categoria, precio, costo, stock, seguimientoInventario
- [ ] Columnas en "clientes": id, nombre, telefono, correo
- [ ] Columnas en "proveedores": id, nombre, telefono, correo
- [ ] Columnas en "categorias": id, nombre
- [ ] Columnas en "ventas": id, fecha, clienteId, metodoPago, total, itemsJson
- [ ] Columnas en "compras": id, fecha, proveedor, total, itemsJson

### Código JavaScript

- [ ] `entidades.js` genera IDs con prefijo (GEN-, CLI-, PROV-, CAT-)
- [ ] `data.js` sincroniza automáticamente al cargar
- [ ] `ventas.js` guarda itemsJson como string
- [ ] `compras.js` guarda itemsJson como string
- [ ] `categorias-crud.html` solo tiene campo "nombre"
- [ ] `clientes.html` usa: nombre, telefono, correo
- [ ] `proveedores.html` usa: nombre, telefono, correo

### Sincronización

- [ ] F12 → Console muestra "✅ Productos sincronizados"
- [ ] Botón 🔄 en CRUDs funciona
- [ ] Los datos se guardan en Google Sheets
- [ ] Los datos se cargan desde Google Sheets

---

## 🚀 Próximos Pasos

1. **Verificar URL de API en api.js**
   - Asegúrate que la URL de Google Apps Script es correcta
   - Prueba con `curl` o Postman

2. **Probar sincronización**

   ```javascript
   // En DevTools console:
   window.API.get("productos"); // Debe retornar array
   window.API.get("clientes"); // Debe retornar array
   ```

3. **Verificar Google Apps Script**
   - Las rutas deben coincidir: productos, clientes, ventas, compras, categorias, proveedores
   - El Apps Script debe estar publicado

4. **Limpiar localStorage antiguo**
   ```javascript
   // En DevTools console:
   localStorage.clear();
   location.reload();
   ```

---

## 📝 Notas Importantes

⚠️ **Cambios críticos realizados:**

- Eliminado campo "documento" de clientes
- Eliminado campo "email" (ahora es "correo")
- Eliminado campo "descripcion" de categorías
- Eliminado campo "contacto" de proveedores

✅ **Lo que sigue igual:**

- Flujo de compra/venta
- Edición de productos en flujo
- Historial de transacciones
- Facturación

🔄 **Sincronización automática:**

- Productos: Al cargar la app
- Clientes/Proveedores/Categorías: Al abrir sus CRUDs + botón manual
- Ventas/Compras: Al finalizar transacción (POST)

---

**Importante:** Antes de comprometer a producción, prueba todo localmente primero.
