// js/ventas.js
// Obtener ventas del localStorage o iniciar array vacío
function obtenerVentas() {
    return JSON.parse(localStorage.getItem("ventas")) || [];
}

// Función principal para registrar la venta cerrada
async function registrarVenta(carrito, total, metodoPago, valorRecibido = 0) {
    const ventas = obtenerVentas();

    // Calcular el cambio si es efectivo
    const cambio = metodoPago === "Efectivo" ? valorRecibido - total : 0;

    // Crear el objeto de la venta (Snapshot)
    const nuevaVenta = {
        id: Date.now(), // ID único basado en tiempo
        fecha: new Date().toLocaleString(),
        items: [...carrito], // Copia de los productos comprados
        total: total,
        metodoPago: metodoPago,
        valorRecibido: valorRecibido,
        cambio: cambio
    };

    // Guardar en el historial
    ventas.push(nuevaVenta);
    localStorage.setItem("ventas", JSON.stringify(ventas));

    // Sincronización con Google Sheets
    try {
        if (window.API) {
            await window.API.post('ventas', nuevaVenta);
        }
    } catch (error) {
        console.warn("Venta guardada localmente, pero falló la sincronización API.");
    }

    return nuevaVenta; // Devolvemos la venta para mostrar la factura
}

// Exponer globalmente
window.obtenerVentas = obtenerVentas;
window.registrarVenta = registrarVenta;