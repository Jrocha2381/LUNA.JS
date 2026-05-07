// carritopage/compras.js

document.addEventListener("DOMContentLoaded", async () => {
  const selectProveedor = document.getElementById("select-proveedor");
  const selectProducto = document.getElementById("select-producto");
  const inputCantidad = document.getElementById("compra-cantidad");
  const inputCosto = document.getElementById("compra-costo");
  const btnAgregar = document.getElementById("btn-agregar-lista");
  const tablaCuerpo = document.getElementById("lista-items-compra");
  const textoTotal = document.getElementById("total-compra-texto");
  const btnFinalizar = document.getElementById("btn-finalizar-compra");

  let itemsParaComprar = [];

  const notifyError = (mensaje) => {
    if (window.mostrarToast) window.mostrarToast("error", "Validacion", mensaje);
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

  async function cargarDatos() {
    if (window.Entidades && window.Entidades.sincronizar) {
      await window.Entidades.sincronizar("proveedores");
    }
    if (window.sincronizarProductosBackend) {
      await window.sincronizarProductosBackend();
    }

    const proveedores = window.Entidades ? window.Entidades.obtener("proveedores") : [];
    selectProveedor.innerHTML = '<option value="">Seleccione...</option>' +
      proveedores.map((p) => `<option value="${p.id}">${p.nombre}</option>`).join("");

    const productos = window.obtenerProductos();
    selectProducto.innerHTML = '<option value="">Seleccione...</option>' +
      productos.map((p) => `<option value="${p.id}" data-costo="${p.costo}">${p.nombre}</option>`).join("");
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
          <button class="btn-eliminar-item" data-index="${index}" style="color:#dc3545; border:none; background:none; cursor:pointer; font-weight:bold;">X</button>
        </td>
      </tr>
    `).join("");

    textoTotal.textContent = `$${totalCompra().toLocaleString()}`;
    btnFinalizar.disabled = itemsParaComprar.length === 0;
  }

  tablaCuerpo.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-eliminar-item");
    if (!btn) return;
    itemsParaComprar.splice(Number(btn.dataset.index), 1);
    renderTabla();
  });

  tablaCuerpo.addEventListener("input", (e) => {
    const input = e.target.closest(".compra-cantidad-edit, .compra-costo-edit");
    if (!input) return;
    const index = Number(input.dataset.index);
    const item = itemsParaComprar[index];
    if (!item) return;

    if (input.classList.contains("compra-cantidad-edit")) {
      const cantidad = parseCantidad(input.value);
      if (cantidad == null) return;
      item.cantidad = cantidad;
      input.value = String(cantidad);
    } else {
      const costo = parseCosto(input.value);
      if (costo == null) return;
      item.costo = costo;
      input.value = String(costo);
    }

    renderTabla();
  });

  function agregarItem() {
    const id = selectProducto.value;
    const nombre = selectProducto.selectedOptions[0]?.text;
    const cantidad = parseCantidad(inputCantidad.value);
    const costo = parseCosto(inputCosto.value);

    if (!id) return notifyError("Selecciona un producto.");
    if (cantidad == null) return notifyError("La cantidad debe ser valida.");
    if (costo == null) return notifyError("El costo unitario debe ser valido.");

    const existente = itemsParaComprar.find((it) => String(it.id) === String(id));
    if (existente) {
      existente.cantidad += cantidad;
      existente.costo = costo;
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
    const proveedorId = selectProveedor.value;
    if (!proveedorId) return notifyError("Selecciona un proveedor.");
    if (itemsParaComprar.length === 0) return notifyError("Agrega al menos un producto a la compra.");

    const mensaje = "Confirmar registro de compra en la base de datos?";

    if (window.mostrarConfirmacion) {
      window.mostrarConfirmacion(mensaje, async () => {
        try {
          btnFinalizar.disabled = true;
          await window.registrarCompra(itemsParaComprar, proveedorId);
          notifySuccess("Compra registrada", "La compra fue guardada en SQLite y el stock fue actualizado.");
          setTimeout(() => window.location.href = "acceso-admin.html", 1500);
        } catch (error) {
          notifyError(error.message || "No se pudo registrar la compra.");
          btnFinalizar.disabled = false;
        }
      });
    } else if (confirm(mensaje)) {
      await window.registrarCompra(itemsParaComprar, proveedorId);
      window.location.href = "acceso-admin.html";
    }
  });

  await cargarDatos();
  renderTabla();
});
