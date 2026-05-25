# 🔌 API REFERENCE - ESPECIFICACIÓN COMPLETA

Para integrar con un backend real, asegúrate de implementar estos endpoints exactamente como se especifica.

---

## ENDPOINT: PRODUCTOS

### GET /api/productos
Obtener lista completa de productos

**Parámetros:** Ninguno

**Respuesta (200):**
```json
[
  {
    "id": "1",
    "name": "Cuaderno A4",
    "price": 2.50,
    "stock": 50,
    "categoryId": "esc",
    "description": "Cuaderno profesional",
    "createdAt": "2026-05-06T10:30:00Z",
    "updatedAt": "2026-05-06T10:30:00Z"
  },
  {
    "id": "2",
    "name": "Bolígrafo Azul",
    "price": 0.75,
    "stock": 200,
    "categoryId": "esc",
    "description": "Bolígrafo azul tinta",
    "createdAt": "2026-05-06T10:30:00Z"
  }
]
```

---

### GET /api/productos/:id
Obtener producto específico

**Parámetros:**
- `id` (path): ID del producto

**Respuesta (200):**
```json
{
  "id": "1",
  "name": "Cuaderno A4",
  "price": 2.50,
  "stock": 50,
  "categoryId": "esc",
  "description": "Cuaderno profesional"
}
```

**Errores:**
- `404 Not Found`: Si el producto no existe

---

### POST /api/productos
Crear nuevo producto

**Body:**
```json
{
  "name": "Marcadores x12",
  "price": 5.99,
  "stock": 30,
  "categoryId": "art",
  "description": "Set de marcadores de colores"
}
```

**Respuesta (201):**
```json
{
  "id": "3",
  "name": "Marcadores x12",
  "price": 5.99,
  "stock": 30,
  "categoryId": "art",
  "description": "Set de marcadores de colores",
  "createdAt": "2026-05-06T11:00:00Z"
}
```

**Errores:**
- `400 Bad Request`: Si faltan campos requeridos
- `409 Conflict`: Si el producto ya existe

---

### PUT /api/productos/:id
Actualizar producto existente

**Body:**
```json
{
  "name": "Cuaderno A4 Premium",
  "price": 3.50,
  "stock": 100
}
```

**Respuesta (200):**
```json
{
  "id": "1",
  "name": "Cuaderno A4 Premium",
  "price": 3.50,
  "stock": 100,
  "categoryId": "esc",
  "updatedAt": "2026-05-06T12:00:00Z"
}
```

---

### DELETE /api/productos/:id
Eliminar producto

**Respuesta (204 No Content)**

**Errores:**
- `404 Not Found`: Si el producto no existe
- `409 Conflict`: Si hay ventas asociadas (validar lógica)

---

## ENDPOINT: CATEGORÍAS

### GET /api/categorias
**Respuesta:**
```json
[
  { "id": "esc", "name": "Escolar", "description": "Productos escolares" },
  { "id": "ofic", "name": "Oficina", "description": "Artículos de oficina" },
  { "id": "art", "name": "Arte", "description": "Materiales artísticos" }
]
```

### POST /api/categorias
**Body:**
```json
{
  "name": "Electrónica",
  "description": "Productos electrónicos"
}
```

### PUT /api/categorias/:id
**Body:**
```json
{
  "name": "Electrónica Actualizada",
  "description": "Descripción nueva"
}
```

### DELETE /api/categorias/:id
Elimina la categoría

---

## ENDPOINT: PROVEEDORES

### GET /api/proveedores
**Respuesta:**
```json
[
  {
    "id": "sup1",
    "name": "Distribuidora Central",
    "contact": "Juan García",
    "phone": "+34 912345678",
    "email": "juan@distribuidor.com",
    "createdAt": "2026-05-06T10:30:00Z"
  }
]
```

### POST /api/proveedores
**Body:**
```json
{
  "name": "Papel Industrias SA",
  "contact": "María López",
  "phone": "+34 987654321",
  "email": "maria@papel.com"
}
```

### PUT /api/proveedores/:id
**Body:**
```json
{
  "name": "Papel Industrias SA Actualizado",
  "contact": "Carlos Pérez",
  "phone": "+34 111111111"
}
```

### DELETE /api/proveedores/:id
Elimina el proveedor

---

## ENDPOINT: CLIENTES

### GET /api/clientes
**Respuesta:**
```json
[
  {
    "id": "cli1",
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "phone": "+34 912345678",
    "address": "Calle Principal 123",
    "createdAt": "2026-05-06T10:30:00Z"
  }
]
```

### POST /api/clientes
**Body:**
```json
{
  "name": "María García",
  "email": "maria@example.com",
  "phone": "+34 987654321",
  "address": "Avenida Central 456"
}
```

### PUT /api/clientes/:id
**Body:**
```json
{
  "name": "María García López",
  "email": "maria.garcia@example.com"
}
```

### DELETE /api/clientes/:id
Elimina el cliente

---

## ENDPOINT: VENTAS (CRÍTICO)

### GET /api/ventas
Obtener historial de ventas completadas

**Query params (opcionales):**
- `startDate`: ISO8601 date
- `endDate`: ISO8601 date
- `clientId`: Filtrar por cliente
- `paymentMethod`: "efectivo" | "tarjeta" | "transferencia" | "cheque"

**Respuesta (200):**
```json
[
  {
    "id": "1620316200000",
    "items": [
      {
        "productId": "1",
        "productName": "Cuaderno A4",
        "price": 2.50,
        "quantity": 2,
        "subtotal": 5.00
      },
      {
        "productId": "2",
        "productName": "Bolígrafo Azul",
        "price": 0.75,
        "quantity": 3,
        "subtotal": 2.25
      }
    ],
    "clientId": "cli1",
    "clientName": "Juan Pérez",
    "total": 7.25,
    "paymentMethod": "efectivo",
    "discount": 0,
    "status": "completed",
    "createdAt": "2026-05-06T10:30:00Z",
    "completedAt": "2026-05-06T10:35:30Z"
  }
]
```

---

### POST /api/ventas
Registrar una venta completada

**IMPORTANTE:** Endpoint crítico - Validar integridad antes de guardar

**Body:**
```json
{
  "items": [
    {
      "productId": "1",
      "productName": "Cuaderno A4",
      "price": 2.50,
      "quantity": 2,
      "subtotal": 5.00
    }
  ],
  "clientId": "cli1",
  "clientName": "Juan Pérez",
  "paymentMethod": "efectivo",
  "discount": 0,
  "total": 5.00,
  "completedAt": "2026-05-06T10:35:30Z"
}
```

**Validaciones en servidor (OBLIGATORIO):**
```
1. ✅ Verificar items no vacío
   if (items.length === 0) return 400;

2. ✅ Verificar cantidades positivas
   items.forEach(item => {
     if (item.quantity <= 0) return 400;
   });

3. ✅ Verificar total correcto
   let calculated_total = items.reduce((sum, item) => 
     sum + (item.quantity * item.price), 0);
   if (Math.abs(calculated_total - body.total) > 0.01) return 400;

4. ✅ Verificar descuento válido
   if (body.discount > body.total) return 400;

5. ✅ Deducir stock de productos
   items.forEach(item => {
     Product.findByIdAndUpdate(item.productId, {
       $inc: { stock: -item.quantity }
     });
   });

6. ✅ Crear transacción atómica en BD
   const session = await db.startSession();
   await session.withTransaction(async () => {
     await Sale.create([completedSale], { session });
     await Product.updateMany(..., { session });
   });
```

**Respuesta (201):**
```json
{
  "id": "1620316200000",
  "items": [...],
  "total": 5.00,
  "status": "completed",
  "message": "Venta registrada exitosamente"
}
```

**Errores:**
- `400 Bad Request`: Validación fallida
- `409 Conflict`: Stock insuficiente
- `500 Internal Server Error`: Error en transacción

---

### PUT /api/ventas/:id
Actualizar carrito abierto (venta sin completar)

**Body:**
```json
{
  "items": [...],
  "clientId": "cli1"
}
```

**Respuesta (200):** Venta actualizada

---

### POST /api/ventas/:id/completar
Finalizar venta abierta

**Body:**
```json
{
  "paymentMethod": "efectivo",
  "discount": 0
}
```

---

## ENDPOINT: COMPRAS

### GET /api/compras
Obtener historial de compras

**Query params (opcionales):**
- `supplierId`: Filtrar por proveedor
- `status`: "pending" | "completed"
- `startDate`, `endDate`: Rango de fechas

**Respuesta:**
```json
[
  {
    "id": "1620316800000",
    "supplierId": "sup1",
    "supplierName": "Distribuidora Central",
    "items": [
      {
        "productId": "1",
        "productName": "Cuaderno A4",
        "quantity": 100,
        "costPrice": 1.50,
        "subtotal": 150.00
      }
    ],
    "totalCost": 150.00,
    "notes": "Compra mensual de septiembre",
    "status": "pending",
    "createdAt": "2026-05-06T11:00:00Z"
  }
]
```

---

### POST /api/compras
Registrar nueva compra

**Body:**
```json
{
  "supplierId": "sup1",
  "supplierName": "Distribuidora Central",
  "items": [
    {
      "productId": "1",
      "productName": "Cuaderno A4",
      "quantity": 100,
      "costPrice": 1.50,
      "subtotal": 150.00
    }
  ],
  "totalCost": 150.00,
  "notes": "Compra mensual"
}
```

**Validaciones en servidor:**
```
1. ✅ Verificar proveedor existe
2. ✅ Verificar items no vacío
3. ✅ Verificar totalCost = sum(items subtotals)
4. ✅ NO deducir stock (aún es "pending")
```

**Respuesta (201):**
```json
{
  "id": "1620316800000",
  "supplierId": "sup1",
  "totalCost": 150.00,
  "status": "pending",
  "message": "Compra registrada"
}
```

---

### POST /api/compras/:id/completar
Marcar compra como recibida (sumar stock)

**Body:**
```json
{
  "status": "completed"
}
```

**Validaciones:**
```
1. ✅ Verificar compra existe y está "pending"
2. ✅ SUMAR stock a cada producto
   items.forEach(item => {
     Product.findByIdAndUpdate(item.productId, {
       $inc: { stock: item.quantity }
     });
   });
3. ✅ Usar transacción atómica
```

---

## ERRORES ESTÁNDAR

Todos los endpoints deben devolver estos formatos de error:

### 400 Bad Request
```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Descripción del error",
  "details": {
    "field": "name",
    "issue": "Campo requerido"
  }
}
```

### 401 Unauthorized
```json
{
  "status": 401,
  "error": "Unauthorized",
  "message": "Token inválido o expirado"
}
```

### 404 Not Found
```json
{
  "status": 404,
  "error": "Not Found",
  "message": "Producto no encontrado con ID: 999"
}
```

### 500 Internal Server Error
```json
{
  "status": 500,
  "error": "Internal Server Error",
  "message": "Error en el servidor",
  "requestId": "req-123456"
}
```

---

## HEADERS REQUERIDOS

Todas las peticiones deben tener:

```
Content-Type: application/json
Authorization: Bearer <token>  (requerido para rutas protegidas; público solo /api/login, /api/authors y /api/health)
X-Request-ID: <uuid>          (para trazabilidad)
```

Todas las respuestas deben tener:

```
Content-Type: application/json
X-Response-Time: <ms>
X-API-Version: 1.0.0
```

---

## IMPLEMENTACIÓN EN EXPRESS.JS (EJEMPLO)

```javascript
const express = require('express');
const router = express.Router();

// GET /api/productos
router.get('/productos', async (req, res) => {
  try {
    const productos = await Product.find().sort({ createdAt: -1 });
    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ventas (CRÍTICO)
router.post('/ventas', async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, paymentMethod, discount, total } = req.body;

    // Validar
    if (!items || items.length === 0) {
      throw new Error("Items requeridos");
    }

    // Calcular y validar total
    const calculatedTotal = items.reduce((sum, item) => 
      sum + (item.quantity * item.price), 0);
    if (Math.abs(calculatedTotal - total) > 0.01) {
      throw new Error("Total incorrecto");
    }

    // Deducir stock
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuficiente: ${product.name}`);
      }
      product.stock -= item.quantity;
      await product.save({ session });
    }

    // Crear venta
    const sale = new Sale({
      items,
      paymentMethod,
      discount,
      total,
      completedAt: new Date()
    });
    await sale.save({ session });

    await session.commitTransaction();
    res.status(201).json(sale);

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});

module.exports = router;
```

---

## NOTAS IMPORTANTES

1. **Transacciones:** Ventas y Compras DEBEN ser atómicas
2. **Stock:** Deducir en venta, sumar en compra completada
3. **Timestamps:** SIEMPRE guardar createdAt y updatedAt
4. **Validación:** Server-side es obligatorio, client-side es bonus
5. **CORS:** Permitir requests desde localhost durante desarrollo
6. **Rate Limiting:** Proteger endpoints contra abuso
7. **Logging:** Registrar todas las operaciones financieras

---

*Especificación API v1.0*
*Última actualización: Mayo 6, 2026*
