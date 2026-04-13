// js/compras.js

/**
 * Registra una compra en el sistema, actualiza el inventario y envía los datos
 * a un servicio externo.
 * 
 * @param {Array} items - Lista de objetos { id, cantidad, costo }
 * @returns {Object} La compra registrada
 */
async function registrarCompra(items) {
    if (!items || items.length === 0) {
        throw new Error("La compra debe tener al menos un producto.");
    }

    const productosBase = window.obtenerProductos();
    const itemsProcesados = items.map(item => {
        const prodOriginal = productosBase.find(p => p.id === Number(item.id));
        return {
            id: Number(item.id),
            nombre: prodOriginal ? prodOriginal.nombre : "Producto desconocido",
            cantidad: Number(item.cantidad),
            costo: Number(item.costo),
            subtotal: Number(item.cantidad) * Number(item.costo)
        };
    });

    const totalCompra = itemsProcesados.reduce((sum, it) => sum + it.subtotal, 0);

    const nuevaCompra = {
        id: Date.now(),
        fecha: new Date().toLocaleString(),
        items: itemsProcesados,
        total: totalCompra
    };

    // 1. Persistencia Local (Historial de Compras)
    const comprasPrevias = JSON.parse(localStorage.getItem("compras") || "[]");
    comprasPrevias.push(nuevaCompra);
    localStorage.setItem("compras", JSON.stringify(comprasPrevias));

    // 2. Actualización de Inventario (Stock y Costo)
    const nuevosProductos = productosBase.map(p => {
        const itemCompra = itemsProcesados.find(it => Number(it.id) === Number(p.id));
        if (itemCompra) {
            return {
                ...p,
                stock: (p.stock || 0) + itemCompra.cantidad,
                costo: itemCompra.costo // Actualizamos al último costo de compra
            };
        }
        return p;
    });
    window.guardarProductos(nuevosProductos);

    // 3. Envío a servicio externo
    try {
        await enviarCompraAServicioExterno(nuevaCompra);
    } catch (error) {
        console.error("Error al sincronizar con servicio externo:", error);
        // Opcional: Podrías lanzar el error o manejar un estado de "pendiente de sincronización"
    }

    return nuevaCompra;
}

/**
 * Simulación de envío a un servicio externo (API REST / Webhook)
 */
async function enviarCompraAServicioExterno(compra) {
    console.log("📤 Enviando compra al servicio externo...", compra);
    // Placeholder para integración real: fetch('https://api.externa.com/compras', { ... })
    return Promise.resolve({ ok: true });
}

window.registrarCompra = registrarCompra;