// carritopage/integracion-ventas-abiertas.js
// Integra el sistema nuevo de ventas abiertas con la funcionalidad del carrito
// Este archivo extiende el carrito.js sin romper compatibilidad

/**
 * Compatibilidad: transforma venta abierta nueva a formato de carrito
 */
function cargarVentaAbriertaNueva(ventaId) {
    const venta = window.obtenerVentaAbierta?.(ventaId);
    if (!venta) {
        alert("❌ Venta no encontrada");
        return false;
    }

    // Convertir items de venta abierta a formato de carrito
    const carritoFormato = venta.items.map(item => ({
        id: item.id,
        nombre: item.nombre,
        precioVenta: item.precioVenta,
        precio: item.precioVenta,
        precioUnitario: item.precioVenta,
        cantidad: item.cantidad,
        costo: item.costo || 0
    }));

    // Guardar en carrito local
    localStorage.setItem("carrito", JSON.stringify(carritoFormato));
    
    // Guardar ID de venta en sesión para cerrarla después
    sessionStorage.setItem("ventaEnEdicionId", ventaId);
    
    return true;
}

/**
 * Al finalizar la venta, guarda en historial usando la nueva función
 */
function finalizarVentaAbiertaNueva() {
    const ventaId = sessionStorage.getItem("ventaEnEdicionId");
    if (!ventaId) return false;

    const carrito = window.obtenerCarrito?.() || [];
    if (carrito.length === 0) {
        alert("❌ El carrito está vacío");
        return false;
    }

    const total = carrito.reduce((sum, item) => {
        const precio = Number(item.precioUnitario ?? item.precioVenta ?? 0);
        return sum + (precio * Number(item.cantidad || 0));
    }, 0);

    try {
        // Cerrar venta abierta (la mueve a historial)
        const ventaCerrada = window.cerrarVentaAbierta?.(ventaId, total);
        
        // Guardar también en historial de ventas (por compatibilidad)
        const ventasHistorial = JSON.parse(localStorage.getItem("ventas") || "[]");
        ventasHistorial.push(ventaCerrada);
        localStorage.setItem("ventas", JSON.stringify(ventasHistorial));

        sessionStorage.removeItem("ventaEnEdicionId");
        localStorage.removeItem("carrito");

        return true;
    } catch (error) {
        console.error("Error finalizando venta:", error);
        alert("❌ Error: " + error.message);
        return false;
    }
}

/**
 * Crea una nueva venta abierta desde el carrito actual
 */
function crearVentaAbriertaDesdeCarrito() {
    const carrito = window.obtenerCarrito?.() || [];
    if (carrito.length === 0) {
        alert("⚠️ El carrito está vacío");
        return null;
    }

    try {
        const venta = window.crearVentaAbierta?.();
        
        // Agregar cada item del carrito a la venta
        carrito.forEach(item => {
            const producto = window.obtenerProductos?.().find(p => p.id == item.id);
            if (producto) {
                window.agregarItemVentaAbierta?.(venta.id, producto, item.cantidad);
            }
        });

        localStorage.removeItem("carrito");
        sessionStorage.setItem("ventaEnEdicionId", venta.id);

        return venta;
    } catch (error) {
        console.error("Error creando venta:", error);
        alert("❌ Error: " + error.message);
        return null;
    }
}

/**
 * Actualiza cantidad de item en la venta abierta en tiempo real
 */
function actualizarCantidadVentaEnEdicion(productoId, cantidad) {
    const ventaId = sessionStorage.getItem("ventaEnEdicionId");
    if (!ventaId) return false;

    try {
        window.actualizarItemVentaAbierta?.(ventaId, productoId, cantidad);
        return true;
    } catch (error) {
        console.error("Error actualizando cantidad:", error);
        return false;
    }
}

/**
 * Edita precio de item en la venta abierta en tiempo real
 * NOTA: Esto requiere extender agregarItemVentaAbierta para permitir precios personalizados
 */
function editarPrecioVentaEnEdicion(productoId, nuevoPrecio) {
    const ventaId = sessionStorage.getItem("ventaEnEdicionId");
    if (!ventaId) return false;

    const venta = window.obtenerVentaAbierta?.(ventaId);
    if (!venta) return false;

    const item = venta.items.find(it => it.id == productoId);
    if (!item) return false;

    // Actualizar el precio en el item
    item.precioVenta = Math.max(0, Number(nuevoPrecio));
    
    // Persistir cambios
    window.guardarVentasAbiertas?.(window.obtenerVentasAbiertas?.());
    
    return true;
}

/**
 * Sincroniza el carrito UI con la venta abierta en progreso
 */
function sincronizarCarritoConVentaAbierta() {
    const ventaId = sessionStorage.getItem("ventaEnEdicionId");
    if (!ventaId) return;

    const venta = window.obtenerVentaAbierta?.(ventaId);
    if (!venta) return;

    // Actualizar carrito en UI con datos de venta abierta
    const carritoFormato = venta.items.map(item => ({
        id: item.id,
        nombre: item.nombre,
        precioVenta: item.precioVenta,
        precio: item.precioVenta,
        precioUnitario: item.precioVenta,
        cantidad: item.cantidad,
        costo: item.costo || 0
    }));

    localStorage.setItem("carrito", JSON.stringify(carritoFormato));
}

/**
 * Exponer funciones globalmente
 */
window.cargarVentaAbriertaNueva = cargarVentaAbriertaNueva;
window.finalizarVentaAbiertaNueva = finalizarVentaAbiertaNueva;
window.crearVentaAbriertaDesdeCarrito = crearVentaAbriertaDesdeCarrito;
window.actualizarCantidadVentaEnEdicion = actualizarCantidadVentaEnEdicion;
window.editarPrecioVentaEnEdicion = editarPrecioVentaEnEdicion;
window.sincronizarCarritoConVentaAbierta = sincronizarCarritoConVentaAbierta;

console.log("✅ Integración de ventas abiertas cargada");
