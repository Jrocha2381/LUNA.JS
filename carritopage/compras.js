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

  // === Sistema de Pausa y Reanudación de Compras ===
  function obtenerComprasAbiertas() {
    try {
      const compras = JSON.parse(localStorage.getItem("compras_abiertas_compra") || "[]");
      return Array.isArray(compras) ? compras : [];
    } catch (e) {
      return [];
    }
  }

  function guardarComprasAbiertas(compras) {
    localStorage.setItem("compras_abiertas_compra", JSON.stringify(Array.isArray(compras) ? compras : []));
  }

  function formatearMonedaCompras(valor) {
    return `$${Number(valor).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  function pausarCompraActual() {
    if (itemsParaComprar.length === 0) {
      window.mostrarToast("warning", "Carrito vacío", "No hay items para pausar.");
      return;
    }

    const comprasAbiertas = obtenerComprasAbiertas();
    const proveedorId = selectProveedor.value;
    const proveedorNombre = selectProveedor.selectedOptions[0]?.text || "Proveedor No Especificado";
    const total = itemsParaComprar.reduce((s, i) => s + (Number(i.cantidad) * Number(i.costo)), 0);

    const nuevaCompraAbierta = {
      id: Date.now(),
      nombre: `Compra ${new Date().toLocaleTimeString()}`,
      proveedorId,
      proveedorNombre,
      items: [...itemsParaComprar],
      total
    };

    comprasAbiertas.push(nuevaCompraAbierta);
    guardarComprasAbiertas(comprasAbiertas);
    itemsParaComprar = [];
    selectProveedor.value = "";
    renderTabla();
    actualizarSeccionComprasAbiertas();

    window.mostrarToast("success", "Compra pausada", "La compra se movió a estado de pausa.");
  }

  function retomarCompra(id) {
    const comprasAbiertas = obtenerComprasAbiertas();
    const index = comprasAbiertas.findIndex(c => String(c.id) === String(id));
    if (index === -1) return;

    const compra = comprasAbiertas.splice(index, 1)[0];
    guardarComprasAbiertas(comprasAbiertas);
    itemsParaComprar = compra.items;
    selectProveedor.value = compra.proveedorId || "";
    renderTabla();
    actualizarSeccionComprasAbiertas();

    window.mostrarToast("success", "Compra retomada", "Puedes continuar con la edición.");
  }

  function confirmarEliminarCompraAbierta(id) {
    if (window.mostrarConfirmacion) {
      window.mostrarConfirmacion("¿Deseas eliminar esta compra en pausa? Esta acción no se puede deshacer.", () => eliminarCompraAbierta(id));
    } else if (confirm("¿Deseas eliminar esta compra en pausa? Esta acción no se puede deshacer.")) {
      eliminarCompraAbierta(id);
    }
  }

  function eliminarCompraAbierta(id) {
    const comprasAbiertas = obtenerComprasAbiertas();
    const nuevas = comprasAbiertas.filter(c => String(c.id) !== String(id));
    guardarComprasAbiertas(nuevas);
    actualizarSeccionComprasAbiertas();

    window.mostrarToast("success", "Compra eliminada", "La compra en pausa fue eliminada.");
  }

  function renderSeccionComprasAbiertas() {
    const comprasAbiertas = obtenerComprasAbiertas();
    if (!comprasAbiertas || comprasAbiertas.length === 0) return "";

    return `
      <div class="compras-abiertas-seccion" style="margin-top:30px; border-top:2px dashed #eee; padding-top:20px; background: #f8f9fa; border-radius: 10px;">
        <h4 style="color:#8a9b2f; margin-bottom: 10px;">🔄 Compras en pausa (${comprasAbiertas.length})</h4>
        <div style="display:grid; gap:10px; margin-top:10px;">
          ${comprasAbiertas.map(c => `
            <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; background:white; padding:10px; border-radius:8px; border:1px solid #eee; box-shadow:0 2px 8px #0001;">
              <span style="flex:1;">
                <b>${c.nombre || "Compra en pausa"}</b>
                <span style='color:#888'>(${c.proveedorNombre} - ${formatearMonedaCompras(Number(c.total) || 0)})</span>
              </span>
              <div style="display:flex; gap:8px; flex-shrink:0;">
                <button onclick="window.retomarCompra(${c.id})" style="background:#8a9b2f; color:white; border:none; padding:5px 14px; border-radius:5px; cursor:pointer; font-weight:600;">Retomar</button>
                <button onclick="window.confirmarEliminarCompraAbierta(${c.id})" style="background:#fee2e2; color:#b91c1c; border:none; padding:5px 14px; border-radius:5px; cursor:pointer; font-weight:700;">Eliminar</button>
              </div>
            </div>
          `).join('')}
        </div>
        <p style="font-size:13px; color:#666; margin-top:10px;">Puedes retomar cualquier compra en pausa o eliminarla si ya no la necesitas.</p>
      </div>
    `;
  }

  function actualizarSeccionComprasAbiertas() {
    const footerCompra = document.querySelector('.footer-compra');
    if (footerCompra) {
      const seccionExistente = footerCompra.parentElement.querySelector('.compras-abiertas-seccion');
      if (seccionExistente) seccionExistente.remove();
      const nuevaSeccion = renderSeccionComprasAbiertas();
      if (nuevaSeccion) {
        footerCompra.parentElement.insertAdjacentHTML('beforeend', nuevaSeccion);
      }
    }
  }

  const notifyError = (mensaje) => {
    window.mostrarToast("error", "Validación", mensaje);
  };

  const notifySuccess = (titulo, mensaje) => {
    window.mostrarToast("success", titulo, mensaje);
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
    const proveedorActual = selectProveedor.value;
    const productoActual = selectProducto.value;

    if (window.Entidades && window.Entidades.sincronizar) {
      await window.Entidades.sincronizar("proveedores");
    }
    if (window.sincronizarProductosBackend) {
      await window.sincronizarProductosBackend();
    }

    const proveedores = window.Entidades ? window.Entidades.obtener("proveedores") : [];
    selectProveedor.innerHTML = '<option value="">Seleccione...</option>' +
      proveedores.map((p) => `<option value="${p.id}">${p.nombre}</option>`).join("");
    selectProveedor.value = proveedores.some((p) => String(p.id) === String(proveedorActual)) ? proveedorActual : "";

    const productos = window.obtenerProductos();
    selectProducto.innerHTML = '<option value="">Seleccione...</option>' +
      productos.map((p) => `<option value="${p.id}" data-costo="${p.costo}">${p.nombre}</option>`).join("");
    selectProducto.value = productos.some((p) => String(p.id) === String(productoActual)) ? productoActual : "";
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

    // Actualizar sección de compras pausadas
    actualizarSeccionComprasAbiertas();
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

  // Botón para pausar compra
  const btnPausarCompra = document.createElement('button');
  btnPausarCompra.textContent = 'Guardar compra';
  btnPausarCompra.style.cssText = 'background:#6c757d; color:white; border:none; padding:1rem 2.5rem; border-radius:8px; cursor:pointer; font-size:1.1rem; font-weight:700; transition:0.3s; margin-right:10px;';
  btnPausarCompra.onclick = pausarCompraActual;

  const footerCompra = document.querySelector('.footer-compra');
  if (footerCompra) {
    footerCompra.insertBefore(btnPausarCompra, btnFinalizar);
  }

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
  actualizarSeccionComprasAbiertas();

  // Exponer funciones globales
  window.pausarCompraActual = pausarCompraActual;
  window.retomarCompra = retomarCompra;
  window.confirmarEliminarCompraAbierta = confirmarEliminarCompraAbierta;
  window.eliminarCompraAbierta = eliminarCompraAbierta;
});
