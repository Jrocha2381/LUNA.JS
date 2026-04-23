// js/compras.js

/**
 * Registra una compra en el sistema, actualiza el inventario y envía los datos
 * a un backend (futuro).
 * 
 * Estructura: { id, fecha, proveedor, total, itemsJson }
 * 
 * @param {Array} items - Lista de objetos { id, cantidad, costo }
 * @param {string} proveedorId - ID del proveedor (opcional)
 * @returns {Object} La compra registrada
 */
async function registrarCompra(items, proveedorId = "") {
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
        id: `COMPRA-${Date.now()}${Math.random().toString(36).substring(2, 5)}`,
        fecha: new Date().toLocaleString('es-CO'),
        proveedor: proveedorId || "",
        total: totalCompra,
        itemsJson: JSON.stringify(itemsProcesados)
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
    console.log("✅ Stock actualizado para", itemsProcesados.length, "productos");

    // 3. Envío a servicio externo (backend futuro)
    try {
        await enviarCompraAServicioExterno(nuevaCompra);
    } catch (error) {
        console.error("❌ Error al sincronizar compra con API:", error);
        console.warn("⚠️ Compra guardada localmente pero no sincronizada");
    }

    return nuevaCompra;
}

/**
 * Envía una compra a backend (si está habilitado)
 */
async function enviarCompraAServicioExterno(compra) {
    if (window.Backend && window.Backend.isEnabled && window.Backend.isEnabled()) {
        const resultado = await window.Backend.post('compras', compra);
        console.log("✅ Compra enviada:", resultado);
        return resultado;
    }
    return { success: false, message: "Backend no disponible" };
}

window.registrarCompra = registrarCompra;
