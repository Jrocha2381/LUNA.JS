// js/ventas.js

function obtenerVentas() {
    return JSON.parse(localStorage.getItem("ventas")) || [];
}

/**
 * Registra una venta cerrada en el sistema
 * Estructura: { id, fecha, clienteId, metodoPago, total, itemsJson }
 */
async function registrarVenta(carrito, total, metodoPago, clienteId = null, valorRecibido = 0) {
    const ventas = obtenerVentas();

    // Calcular el cambio si es efectivo
    const cambio = metodoPago === "Efectivo" ? valorRecibido - total : 0;

    // Crear el objeto de la venta (Snapshot)
    // Formato que coincide con Google Sheets
    const nuevaVenta = {
        id: `ID-${Date.now()}${Math.random().toString(36).substring(2, 5)}`,
        fecha: new Date().toLocaleString('es-CO'),
        clienteId: clienteId || "",
        metodoPago: metodoPago || "Efectivo",
        total: Number(total) || 0,
        itemsJson: JSON.stringify(carrito.map(item => ({
            id: item.id,
            nombre: item.nombre,
            precio: item.precioVenta || item.precio || 0,
            costo: item.costo || 0,
            cantidad: Number(item.cantidad) || 1
        })))
    };

    // Guardar en el historial local
    ventas.push(nuevaVenta);
    localStorage.setItem("ventas", JSON.stringify(ventas));

    // Sincronización futura con backend (si está habilitado)
    try {
        if (window.Backend && window.Backend.isEnabled && window.Backend.isEnabled()) {
            await window.Backend.post('ventas', nuevaVenta);
            console.log("✅ Venta sincronizada con backend:", nuevaVenta.id);
        }
    } catch (error) {
        console.warn("⚠️ Venta guardada localmente, pero falló la sincronización con backend:", error);
    }

    return nuevaVenta; // Devolvemos la venta para mostrar la factura
}

// Exponer globalmente
window.obtenerVentas = obtenerVentas;
window.registrarVenta = registrarVenta;
