// js/ventas.js
// Obtener ventas del localStorage o iniciar array vacío
export function obtenerVentas() {
    return JSON.parse(localStorage.getItem("ventas")) || [];
}

// Función principal para registrar la venta cerrada
export function registrarVenta(carrito, total, metodoPago, valorRecibido = 0) {
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
    
    return nuevaVenta; // Devolvemos la venta para mostrar la factura
}