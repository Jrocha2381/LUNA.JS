document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const idVenta = params.get("id");
    const tabla = document.getElementById("lista-productos");

    if (!idVenta) {
        if (tabla) {
            tabla.innerHTML = `<tr><td colspan="2" style="text-align:center; padding: 20px; color: red;"><strong>Error:</strong> No se especificó un ID de factura.</td></tr>`;
        }
        console.error("No se proveyó un ID de venta en la URL.");
        return;
    }

    let venta = null;

    // Intentar obtener de la API primero
    try {
        if (window.Backend && window.Backend.isEnabled()) {
            venta = await window.Backend.get(`ventas/${idVenta}`);
            console.log("Venta obtenida de la API:", venta);
        }
    } catch (err) {
        console.warn("No se pudo obtener la venta de la API, intentando localStorage:", err);
    }

    // Si no se obtiene de la API, intentar de localStorage (compatibilidad)
    if (!venta) {
        const ventas = JSON.parse(localStorage.getItem("ventas")) || [];
        venta = ventas.find(v => v && v.id == idVenta);
    }

    if (!venta) {
        console.error("Venta no encontrada:", idVenta);
        if (tabla) {
            tabla.innerHTML = `<tr><td colspan="2" style="text-align:center; padding: 20px; color: red;"><strong>Error:</strong> Factura con ID #${idVenta} no encontrada.</td></tr>`;
        }
        return;
    }

    // Obtener detalles de venta de la API si existen
    let detallesVenta = [];
    try {
        if (venta.id && window.Backend && window.Backend.isEnabled()) {
            // Obtener todos los detalles y filtrar por ventaId
            const todosDetalles = await window.Backend.get('detalle_ventas');
            detallesVenta = Array.isArray(todosDetalles) ? todosDetalles.filter(d => d.ventaId == venta.id) : [];
        }
    } catch (err) {
        console.warn("No se pudieron obtener los detalles de venta:", err);
    }

    // ================================
    // CABECERA
    // ================================
    const infoVenta = document.getElementById("info-venta");

    if (infoVenta) {
        const fecha = new Date(venta.fecha).toLocaleString('es-CO');
        infoVenta.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <span><strong>Fecha:</strong> ${fecha}</span>
                <span><strong>Ticket:</strong> #${venta.id.toString().slice(-6)}</span>
            </div>
            <div><strong>Método de pago:</strong> ${venta.metodoPago || '-'}</div>
        `;
    }

    // ================================
    // PRODUCTOS
    // ================================
    if (tabla) {
        tabla.innerHTML = "";

        // Usar detalles de la API si existen, sino usar items del JSON
        const productos = detallesVenta.length > 0 ? detallesVenta : (venta.items || []);

        productos.forEach(prod => {

            const nombre =
                prod.nombre ||
                prod.titulo ||
                prod.producto?.nombre ||
                "Producto";

            const descripcion = prod.descripcion || "";

            const precio =
                prod.precioUnitario ||
                prod.precio ||
                prod.precioVenta ||
                prod.producto?.precioVenta ||
                0;

            const cantidad = prod.cantidad || 1;

            const subtotal = prod.subtotal || (precio * cantidad);

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td style="padding:5px 0;">
                    <strong>${nombre}</strong><br>
                    <small style="color:#555;">${cantidad} x $${precio.toLocaleString('es-CO')}</small>
                </td>
                <td style="text-align:right; vertical-align:top;">
                    <strong>$${subtotal.toLocaleString('es-CO')}</strong>
                </td>
            `;

            tabla.appendChild(fila);
        });
    }

    // ================================
    // TOTALES
    // ================================
    const totalesVenta = document.getElementById("totales-venta");

    if (totalesVenta) {

        totalesVenta.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-top:10px; border-top:1px dashed #000;">
                <strong>TOTAL:</strong>
                <strong>$${Number(venta.total).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>

            ${venta.metodoPago === "Efectivo" && venta.valorRecibido ? `
                <div style="display:flex; justify-content:space-between;">
                    <span>Recibido:</span>
                    <span>$${Number(venta.valorRecibido).toLocaleString('es-CO')}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span>Cambio:</span>
                    <span>$${Number(venta.cambio || 0).toLocaleString('es-CO')}</span>
                </div>
            ` : ""}
        `;
    }

});