document.addEventListener("DOMContentLoaded", () => {
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

    const ventas = JSON.parse(localStorage.getItem("ventas")) || [];

    // Se usa '==' para comparar el string de la URL con el número del ID sin problemas de tipo.
    // Se añade 'v &&' para evitar errores si hay entradas nulas en el array de ventas.
    const venta = ventas.find(v => v && v.id == idVenta);

    if (!venta) {
        console.error("Venta no encontrada:", idVenta);
        if (tabla) {
            tabla.innerHTML = `<tr><td colspan="2" style="text-align:center; padding: 20px; color: red;"><strong>Error:</strong> Factura con ID #${idVenta} no encontrada.</td></tr>`;
        }
        return;
    }

    // ================================
    // CABECERA
    // ================================
    const infoVenta = document.getElementById("info-venta");

    if (infoVenta) {
        infoVenta.innerHTML = `
            <div style="display:flex; justify-content:space-between;">
                <span><strong>Fecha:</strong> ${venta.fecha}</span>
                <span><strong>Ticket:</strong> #${venta.id.toString().slice(-6)}</span>
            </div>
            <div><strong>Método de pago:</strong> ${venta.metodoPago}</div>
        `;
    }

    // ================================
    // PRODUCTOS
    // ================================
    if (tabla) {
        tabla.innerHTML = "";

        venta.items.forEach(prod => {

            const nombre =
                prod.nombre ||
                prod.titulo ||
                prod.producto?.nombre ||
                "Producto";

            const descripcion = prod.descripcion || "";

            const precio =
                prod.precio ||
                prod.precioVenta ||
                prod.producto?.precioVenta ||
                0;

            const cantidad = prod.cantidad || 1;

            const subtotal = precio * cantidad;

            const fila = document.createElement("tr");

            fila.innerHTML = `
                <td style="padding:5px 0;">
                    <strong>${nombre}</strong><br>
                    <small style="color:#555;">${cantidad} x $${precio.toLocaleString()}</small>
                </td>
                <td style="text-align:right; vertical-align:top;">
                    <strong>$${subtotal.toLocaleString()}</strong>
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
                <strong>$${venta.total.toLocaleString()}</strong>
            </div>

            ${venta.metodoPago === "Efectivo" ? `
                <div style="display:flex; justify-content:space-between;">
                    <span>Recibido:</span>
                    <span>$${venta.valorRecibido.toLocaleString()}</span>
                </div>
                <div style="display:flex; justify-content:space-between;">
                    <span>Cambio:</span>
                    <span>$${venta.cambio.toLocaleString()}</span>
                </div>
            ` : ""}
        `;
    }

});