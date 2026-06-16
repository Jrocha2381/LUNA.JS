// js/ventas.js

function backendDisponibleVentas() {
  return Boolean(window.Backend && window.Backend.isEnabled && window.Backend.isEnabled());
}

function normalizarVenta(venta) {
  const items = Array.isArray(venta.items)
    ? venta.items
    : Array.isArray(venta.itemsJson)
      ? venta.itemsJson
      : typeof venta.items === "string"
        ? JSON.parse(venta.items || "[]")
        : typeof venta.itemsJson === "string"
          ? JSON.parse(venta.itemsJson || "[]")
          : [];

  return {
    ...venta,
    id: venta.id,
    fecha: venta.fecha,
    clienteId: venta.clienteId || "",
    metodoPago: venta.metodoPago || "",
    total: Number(venta.total || 0),
    items
  };
}

function obtenerVentasLocales() {
  try {
    const ventas = JSON.parse(localStorage.getItem("ventas") || "[]");
    return Array.isArray(ventas) ? ventas.map(normalizarVenta) : [];
  } catch (_error) {
    return [];
  }
}

async function obtenerVentas() {
  if (backendDisponibleVentas()) {
    const ventas = await window.Backend.get("ventas");
    const normalizadas = Array.isArray(ventas) ? ventas.map(normalizarVenta) : [];
    localStorage.setItem("ventas", JSON.stringify(normalizadas));
    return normalizadas;
  }
  return obtenerVentasLocales();
}

async function registrarVenta(carrito, total, metodoPago, clienteId = null, valorRecibido = 0) {
  const productosActuales = window.obtenerProductos ? window.obtenerProductos() : [];
  const items = carrito.map((item) => ({
    id: Number(item.id),
    nombre: item.nombre,
    precio: Number(item.precioVenta ?? item.precio ?? 0),
    costo: Number(item.costo ?? 0),
    cantidad: Number(item.cantidad) || 1
  }));

  const nuevaVenta = {
    fecha: new Date().toISOString(),
    clienteId: clienteId || null,
    metodoPago: metodoPago || "Efectivo",
    total: Number(total) || 0,
    items
  };

  let creada = { ...nuevaVenta, valorRecibido, cambio: metodoPago === "Efectivo" ? valorRecibido - total : 0 };

  if (backendDisponibleVentas()) {
    creada = normalizarVenta(await window.Backend.post("ventas", nuevaVenta));
    for (const item of items) {
      const producto = productosActuales.find((p) => Number(p.id) === Number(item.id));
      if (!producto) continue;
      await window.Backend.put(`productos/${producto.id}`, {
        nombre: producto.nombre,
        categoriaId: producto.categoriaId,
        precio: producto.precio,
        costo: producto.costo,
        stock: Math.max(0, Number(producto.stock || 0) - Number(item.cantidad || 0)),
        seguimientoInventario: producto.seguimientoInventario
      });
    }
    if (window.sincronizarProductosBackend) {
      await window.sincronizarProductosBackend();
    }
  } else {
    const ventas = obtenerVentasLocales();
    creada.id = Date.now();
    ventas.push(creada);
    localStorage.setItem("ventas", JSON.stringify(ventas));

    const nuevosProductos = productosActuales.map((producto) => {
      const item = items.find((row) => Number(row.id) === Number(producto.id));
      if (!item) return producto;
      return {
        ...producto,
        stock: Math.max(0, Number(producto.stock || 0) - Number(item.cantidad || 0))
      };
    });
    if (window.guardarProductos) {
      window.guardarProductos(nuevosProductos);
    }
  }

  return creada;
}

window.obtenerVentas = obtenerVentas;
window.registrarVenta = registrarVenta;
