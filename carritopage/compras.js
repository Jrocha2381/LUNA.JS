// carritopage/compras.js

document.addEventListener("DOMContentLoaded", () => {
    const selectProducto = document.getElementById("select-producto");
    const inputCantidad = document.getElementById("compra-cantidad");
    const inputCosto = document.getElementById("compra-costo");
    const btnAgregar = document.getElementById("btn-agregar-lista");
    const tablaCuerpo = document.getElementById("lista-items-compra");
    const textoTotal = document.getElementById("total-compra-texto");
    const btnFinalizar = document.getElementById("btn-finalizar-compra");

    let itemsParaComprar = [];

    function cargarProductos() {
        const productos = window.obtenerProductos();
        selectProducto.innerHTML = '<option value="">Seleccione...</option>' +
            productos.map(p => `<option value="${p.id}" data-costo="${p.costo}">${p.nombre}</option>`).join("");
    }

    selectProducto.addEventListener("change", () => {
        const option = selectProducto.selectedOptions[0];
        if (option && option.value) {
            inputCosto.value = option.dataset.costo || 0;
        }
    });

    function renderTabla() {
        tablaCuerpo.innerHTML = itemsParaComprar.map((item, index) => `
            <tr>
                <td>${item.nombre}</td>
                <td>${item.cantidad}</td>
                <td>$${Number(item.costo).toLocaleString()}</td>
                <td>$${(item.cantidad * item.costo).toLocaleString()}</td>
                <td><button onclick="eliminarItem(${index})" style="color:#dc3545; border:none; background:none; cursor:pointer; font-weight:bold;">✕</button></td>
            </tr>
        `).join("");

        const total = itemsParaComprar.reduce((sum, it) => sum + (it.cantidad * it.costo), 0);
        textoTotal.textContent = `$${total.toLocaleString()}`;
        btnFinalizar.disabled = itemsParaComprar.length === 0;
    }

    window.eliminarItem = (index) => {
        itemsParaComprar.splice(index, 1);
        renderTabla();
    };

    btnAgregar.addEventListener("click", () => {
        const id = selectProducto.value;
        const nombre = selectProducto.selectedOptions[0]?.text;
        const cantidad = parseInt(inputCantidad.value);
        const costo = parseFloat(inputCosto.value);

        if (!id || cantidad <= 0 || isNaN(costo)) return;

        itemsParaComprar.push({ id, nombre, cantidad, costo });
        renderTabla();
        inputCantidad.value = 1;
    });

    btnFinalizar.addEventListener("click", async () => {
        const mensaje = "¿Confirmar registro de compra y envío a servicio externo?";

        if (window.mostrarConfirmacion) {
            window.mostrarConfirmacion(mensaje, async () => {
                try {
                    btnFinalizar.disabled = true;
                    await window.registrarCompra(itemsParaComprar);
                    window.mostrarToast("success", "Compra Procesada", "El stock ha sido actualizado y los datos enviados.");
                    setTimeout(() => window.location.href = "acceso-admin.html", 2000);
                } catch (error) {
                    window.mostrarToast("error", "Error", error.message);
                    btnFinalizar.disabled = false;
                }
            });
        } else {
            if (confirm(mensaje)) {
                window.registrarCompra(itemsParaComprar);
                window.location.href = "acceso-admin.html";
            }
        }
    });

    cargarProductos();
});