// js/compras.js

function backendDisponibleCompras() {
  return Boolean(window.Backend && window.Backend.isEnabled && window.Backend.isEnabled());
}

async function registrarCompra(items, proveedorId = null) {
  if (!items || items.length === 0) {
    throw new Error("La compra debe tener al menos un producto.");
  }

  const productosBase = window.obtenerProductos();
  const itemsProcesados = items.map((it) => {
    const producto = productosBase.find((p) => Number(p.id) === Number(it.id));
    const cantidad = Math.max(1, Math.floor(Number(it.cantidad)));
    const costo = Math.max(0, Number(it.costo));

    if (!producto) {
      throw new Error(`No se encontro el producto con id ${it.id}.`);
    }

    return {
      id: Number(it.id),
      nombre: producto.nombre,
      cantidad,
      costo,
      subtotal: cantidad * costo
    };
  });

  const totalCompra = itemsProcesados.reduce((sum, it) => sum + it.subtotal, 0);
  const payload = {
    fecha: new Date().toISOString(),
    proveedorId: proveedorId ? Number(proveedorId) : null,
    total: totalCompra,
    items: itemsProcesados
  };

  let compraCreada = payload;

  if (backendDisponibleCompras()) {
    compraCreada = await window.Backend.post("compras", payload);
  } else {
    const comprasPrevias = JSON.parse(localStorage.getItem("compras") || "[]");
    compraCreada.id = Date.now();
    comprasPrevias.push(compraCreada);
    localStorage.setItem("compras", JSON.stringify(comprasPrevias));
  }

  const actualizaciones = [];
  for (const item of itemsProcesados) {
    const producto = productosBase.find((p) => Number(p.id) === Number(item.id));
    if (!producto) continue;

    const actualizado = {
      nombre: producto.nombre,
      categoriaId: producto.categoriaId,
      precio: producto.precio,
      costo: item.costo,
      stock: Number(producto.stock || 0) + item.cantidad,
      seguimientoInventario: producto.seguimientoInventario
    };

    if (backendDisponibleCompras()) {
      await window.Backend.put(`productos/${producto.id}`, actualizado);
      actualizaciones.push({ ...producto, ...actualizado });
    } else {
      actualizaciones.push({
        ...producto,
        costo: item.costo,
        stock: Number(producto.stock || 0) + item.cantidad
      });
    }
  }

  if (backendDisponibleCompras()) {
    await window.sincronizarProductosBackend();
  } else if (actualizaciones.length) {
    const nuevosProductos = productosBase.map((producto) => {
      const cambio = actualizaciones.find((item) => Number(item.id) === Number(producto.id));
      return cambio || producto;
    });
    window.guardarProductos(nuevosProductos);
  }

  return compraCreada;
}

window.registrarCompra = registrarCompra;
