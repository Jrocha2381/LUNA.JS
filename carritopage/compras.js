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

    const notifyError = (mensaje) => {
        if (window.mostrarToast) window.mostrarToast("error", "Validación", mensaje);
        else alert(mensaje);
    };

    const notifySuccess = (titulo, mensaje) => {
        if (window.mostrarToast) window.mostrarToast("success", titulo, mensaje);
        else alert(mensaje);
    };

    const parseCantidad = (valor) => {
        const n = Number(valor);
        if (!Number.isFinite(n)) return null;
        return Math.max(1, Math.floor(n));
    };

    const parseCosto = (valor) => {
        const n = Number(valor);
        if (!Number.isFinite(n)) return null;
        return Math.max(0, n);
    };

    function cargarProductos() {
        const productos = window.obtenerProductos();
        selectProducto.innerHTML = '<option value="">Seleccione...</option>' +
            productos.map(p => `<option value="${p.id}" data-costo="${p.costo}">${p.nombre}</option>`).join("");
    }

    selectProducto.addEventListener("change", () => {
        const option = selectProducto.selectedOptions[0];
        if (option && option.value) {
            inputCosto.value = option.dataset.costo || 0;
            inputCantidad.focus();
        }
    });

    function totalCompra() {
        return itemsParaComprar.reduce((sum, it) => sum + (Number(it.cantidad) * Number(it.costo)), 0);
    }

    function renderTabla() {
        tablaCuerpo.innerHTML = itemsParaComprar.map((item, index) => `
            <tr>
                <td>${item.nombre}</td>
                <td>
                    <input class="compra-cantidad-edit" data-index="${index}" type="number" min="1" step="1" value="${item.cantidad}" style="width:90px; padding:6px 8px; border:1px solid #ddd; border-radius:8px;">
                </td>
                <td>
                    <input class="compra-costo-edit" data-index="${index}" type="number" min="0" step="0.01" value="${item.costo}" style="width:130px; padding:6px 8px; border:1px solid #ddd; border-radius:8px;">
                </td>
                <td class="compra-subtotal" data-index="${index}">$${(Number(item.cantidad) * Number(item.costo)).toLocaleString()}</td>
                <td>
                    <button class="btn-eliminar-item" data-index="${index}" style="color:#dc3545; border:none; background:none; cursor:pointer; font-weight:bold;">✕</button>
                </td>
            </tr>
        `).join("");

        textoTotal.textContent = `$${totalCompra().toLocaleString()}`;
        btnFinalizar.disabled = itemsParaComprar.length === 0;
    }

    function eliminarItem(index) {
        itemsParaComprar.splice(index, 1);
        renderTabla();
    }

    tablaCuerpo.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-eliminar-item");
        if (!btn) return;
        const index = Number(btn.dataset.index);
        if (!Number.isFinite(index)) return;
        eliminarItem(index);
    });

    tablaCuerpo.addEventListener("input", (e) => {
        const cantidadInput = e.target.closest(".compra-cantidad-edit");
        const costoInput = e.target.closest(".compra-costo-edit");
        const input = cantidadInput || costoInput;
        if (!input) return;

        const index = Number(input.dataset.index);
        const item = itemsParaComprar[index];
        if (!item) return;

        if (cantidadInput) {
            const cantidad = parseCantidad(cantidadInput.value);
            if (cantidad == null) return;
            cantidadInput.value = String(cantidad);
            item.cantidad = cantidad;
        }

        if (costoInput) {
            const costo = parseCosto(costoInput.value);
            if (costo == null) return;
            costoInput.value = String(costo);
            item.costo = costo;
        }

        const subtotalEl = tablaCuerpo.querySelector(`.compra-subtotal[data-index="${index}"]`);
        if (subtotalEl) {
            subtotalEl.textContent = `$${(Number(item.cantidad) * Number(item.costo)).toLocaleString()}`;
        }
        textoTotal.textContent = `$${totalCompra().toLocaleString()}`;
    });

    function agregarItem() {
        const id = selectProducto.value;
        const nombre = selectProducto.selectedOptions[0]?.text;
        const cantidad = parseCantidad(inputCantidad.value);
        const costo = parseCosto(inputCosto.value);

        if (!id) return notifyError("Selecciona un producto.");
        if (cantidad == null || cantidad <= 0) return notifyError("La cantidad debe ser un número mayor o igual a 1.");
        if (costo == null) return notifyError("El costo unitario debe ser un número válido (>= 0).");

        const existente = itemsParaComprar.find((it) => String(it.id) === String(id));
        if (existente) {
            existente.cantidad = Number(existente.cantidad) + Number(cantidad);
            existente.costo = Number(costo);
        } else {
            itemsParaComprar.push({ id, nombre, cantidad, costo });
        }
        renderTabla();
        inputCantidad.value = 1;
        inputCantidad.focus();
    }

    btnAgregar.addEventListener("click", agregarItem);

    [selectProducto, inputCantidad, inputCosto].forEach((el) => {
        el.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                agregarItem();
            }
        });
    });

    btnFinalizar.addEventListener("click", async () => {
        if (itemsParaComprar.length === 0) {
            notifyError("Agrega al menos un producto a la compra.");
            return;
        }

        const mensaje = (window.Backend && window.Backend.isEnabled && window.Backend.isEnabled())
            ? "¿Confirmar registro y envío de compra al backend?"
            : "¿Confirmar registro de compra? (Backend no configurado: se guardará solo localmente)";

        if (window.mostrarConfirmacion) {
            window.mostrarConfirmacion(mensaje, async () => {
                try {
                    btnFinalizar.disabled = true;
                    const resultado = await window.registrarCompra(itemsParaComprar);

                    if (resultado && resultado.sync && resultado.sync.success === false) {
                        notifySuccess("Compra registrada", "Stock actualizado. No se envió al backend (no disponible).");
                    } else {
                        notifySuccess("Compra enviada", "Stock actualizado y compra enviada al backend.");
                    }
                    setTimeout(() => window.location.href = "acceso-admin.html", 2000);
                } catch (error) {
                    notifyError(error.message || "No se pudo registrar la compra.");
                    btnFinalizar.disabled = false;
                }
            });
        } else {
            if (confirm(mensaje)) {
                await window.registrarCompra(itemsParaComprar);
                window.location.href = "acceso-admin.html";
            }
        }
    });

    cargarProductos();
    renderTabla();
});
