// carritopage/carrito.js
// Usar funciones globales definidas en ../js/data.js y ../js/ventas.js

let adminListenersActivos = false;
let productoEnEdicionId = null;

function crearContenedorToast() {
  if (!document.getElementById("toast-container")) {
    const container = document.createElement("div");
    container.id = "toast-container";
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 360px;
    `;
    document.body.appendChild(container);
  }
  return document.getElementById("toast-container");
}

const TOAST_ICONS = {
  success: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  warning: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  error: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
  info: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
};

const TOAST_STYLES = {
  success: { bg: "#f0fdf0", border: "#86efac", iconBg: "#dcfce7", iconColor: "#16a34a", titleColor: "#15803d" },
  warning: { bg: "#fefce8", border: "#fde047", iconBg: "#fef9c3", iconColor: "#ca8a04", titleColor: "#a16207" },
  error: { bg: "#fff1f2", border: "#fca5a5", iconBg: "#fee2e2", iconColor: "#dc2626", titleColor: "#b91c1c" },
  info: { bg: "#eff6ff", border: "#93c5fd", iconBg: "#dbeafe", iconColor: "#2563eb", titleColor: "#1d4ed8" }
};

function mostrarToast(tipo, titulo, mensaje, duracion = 3500) {
  const container = crearContenedorToast();
  const s = TOAST_STYLES[tipo] || TOAST_STYLES.info;
  const icono = TOAST_ICONS[tipo] || TOAST_ICONS.info;

  const toast = document.createElement("div");
  toast.style.cssText = `
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: ${s.bg};
    border: 1.5px solid ${s.border};
    border-radius: 12px;
    padding: 14px 16px;
    box-shadow: 0 4px 18px rgba(0,0,0,0.10);
    font-family: 'Segoe UI', Arial, sans-serif;
    animation: toast-in 0.3s ease;
    position: relative;
    min-width: 260px;
  `;

  toast.innerHTML = `
    <style>
      @keyframes toast-in  { from { opacity:0; transform: translateX(40px); } to { opacity:1; transform: translateX(0); } }
      @keyframes toast-out { from { opacity:1; transform: translateX(0);    } to { opacity:0; transform: translateX(40px); } }
    </style>
    <div style="
      background:${s.iconBg};
      color:${s.iconColor};
      border-radius:50%;
      width:40px; height:40px;
      display:flex; align-items:center; justify-content:center;
      flex-shrink:0;
    ">${icono}</div>
    <div style="flex:1; padding-top:2px;">
      <div style="font-weight:700; color:${s.titleColor}; font-size:14px; margin-bottom:2px;">${titulo}</div>
      <div style="color:#4b5563; font-size:13px; line-height:1.4;">${mensaje}</div>
    </div>
    <button onclick="this.parentElement.remove()" style="
      background:none; border:none; cursor:pointer;
      color:#9ca3af; font-size:18px; line-height:1;
      padding:0 0 0 6px; flex-shrink:0;
    ">&#x2715;</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = "toast-out 0.3s ease forwards";
    setTimeout(() => toast.remove(), 300);
  }, duracion);
}

// Exponer globalmente para otros módulos
window.mostrarToast = mostrarToast;

function mostrarConfirmacion(mensaje, onAceptar) {
  const container = crearContenedorToast();
  const s = TOAST_STYLES.warning;
  const icono = TOAST_ICONS.warning;

  const toast = document.createElement("div");
  toast.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: ${s.bg};
    border: 1.5px solid ${s.border};
    border-radius: 12px;
    padding: 14px 16px;
    box-shadow: 0 4px 18px rgba(0,0,0,0.10);
    font-family: 'Segoe UI', Arial, sans-serif;
    animation: toast-in 0.3s ease;
    min-width: 280px;
  `;

  toast.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <div style="
        background:${s.iconBg}; color:${s.iconColor};
        border-radius:50%; width:38px; height:38px;
        display:flex; align-items:center; justify-content:center; flex-shrink:0;
      ">${icono}</div>
      <div style="font-weight:700; color:${s.titleColor}; font-size:14px;">Confirmar accion</div>
    </div>
    <div style="color:#4b5563; font-size:13px; padding-left:4px;">${mensaje}</div>
    <div style="display:flex; gap:8px; justify-content:flex-end;">
      <button id="toast-cancelar" style="
        padding:6px 14px; border-radius:8px;
        border:1.5px solid #d1d5db; background:#fff;
        color:#374151; font-size:13px; cursor:pointer; font-weight:600;
      ">Cancelar</button>
      <button id="toast-aceptar" style="
        padding:6px 14px; border-radius:8px; border:none;
        background:${s.iconColor}; color:#fff;
        font-size:13px; cursor:pointer; font-weight:600;
      ">Confirmar</button>
    </div>
  `;

  container.appendChild(toast);

  toast.querySelector("#toast-cancelar").onclick = () => toast.remove();
  toast.querySelector("#toast-aceptar").onclick = () => {
    toast.remove();
    onAceptar();
  };
}

// Exponer globalmente para otros módulos
window.mostrarConfirmacion = mostrarConfirmacion;

function obtenerCarrito() {
  return JSON.parse(localStorage.getItem("carrito")) || [];
}

function persistirCarrito(nuevoCarrito) {
  localStorage.setItem("carrito", JSON.stringify(nuevoCarrito));
  try {
    updateCartBadge();
  } catch (e) {
    // noop
  }
}

function guardarCarrito(nuevoCarrito) {
  localStorage.setItem("carrito", JSON.stringify(nuevoCarrito));
  renderCarrito();
  // Actualizar el badge del header si existe
  try {
    updateCartBadge();
  } catch (e) {
    // noop
  }
}

function updateCartBadge() {
  const carrito = obtenerCarrito();
  const badge = document.getElementById("badge-carrito");
  if (!badge) return;
  const cantidad = carrito.reduce((s, it) => s + (Number(it.cantidad) || 0), 0);
  if (cantidad > 0) {
    badge.textContent = String(cantidad);
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }
}

function getProductoActual(idProducto) {
  return obtenerProductos().find((p) => Number(p.id) === Number(idProducto));
}

function precioProducto(producto) {
  return Number(producto?.precioVenta ?? producto?.precio ?? 0);
}

function precioUnitarioItemCarrito(item, productoActual) {
  const manual = Number(item?.precioUnitario ?? item?.precioVenta ?? item?.precio);
  if (Number.isFinite(manual) && manual >= 0) return manual;
  if (productoActual) return precioProducto(productoActual);
  return 0;
}

function stockDisponible(producto) {
  if (!producto) return 0;
  if (!producto.seguimientoInventario) return Number.POSITIVE_INFINITY;
  return Number(producto.stock || 0);
}

function formatearMoneda(valor) {
  return `$${Number(valor).toLocaleString()}`;
}

function resolverRutaImagenCarrito(ruta) {
  const valor = String(ruta || "").trim();
  if (!valor) return "";
  if (/^(data:|https?:|blob:|file:)/i.test(valor)) return valor;

  if (valor.startsWith("../../")) {
    return valor.replace(/^(\.\.\/){2}/, "../");
  }
  if (valor.startsWith("images/") || valor.startsWith("img/")) {
    return `../${valor}`;
  }
  return valor;
}

function agregarAlCarrito(producto) {
  let carrito = obtenerCarrito();
  const existe = carrito.find((item) => Number(item.id) === Number(producto.id));

  const productoOriginal = getProductoActual(producto.id);
  if (!productoOriginal || productoOriginal.activo === false) {
    mostrarToast("error", "Producto inactivo", "Este producto ya no esta disponible para venta.");
    return;
  }

  const precio = precioProducto(productoOriginal);
  const disponible = stockDisponible(productoOriginal);

  if (existe) {
    if (existe.cantidad < disponible) {
      existe.cantidad += 1;
      if (existe.precioUnitario == null) {
        existe.precioUnitario = precio;
        existe.precio = precio;
        existe.precioVenta = precio;
      }
      mostrarToast("success", "Producto anadido", `${productoOriginal.nombre} anadido. (Total: ${existe.cantidad})`);
    } else {
      mostrarToast("error", "Limite alcanzado", `Solo hay ${disponible} unidades disponibles.`);
      return;
    }
  } else {
    if (disponible > 0 || disponible === Number.POSITIVE_INFINITY) {
      carrito.push({ ...productoOriginal, precioUnitario: precio, precio, precioVenta: precio, cantidad: 1 });
      mostrarToast("success", "Anadido al carrito", `${productoOriginal.nombre} anadido al carrito.`);
    } else {
      mostrarToast("error", "Producto agotado", "Este producto no tiene stock disponible.");
      return;
    }
  }

  guardarCarrito(carrito);
}

function pausarVentaActual() {
  const carrito = obtenerCarrito();
  if (carrito.length === 0) return;

  const ventasAbiertas = JSON.parse(localStorage.getItem("ventas_abiertas") || "[]");
  const nuevaVentaAbierta = {
    id: Date.now(),
    nombre: `Venta ${new Date().toLocaleTimeString()}`,
    items: [...carrito],
    total: carrito.reduce((s, i) => s + (precioUnitarioItemCarrito(i, getProductoActual(i.id)) * Number(i.cantidad || 0)), 0)
  };

  ventasAbiertas.push(nuevaVentaAbierta);
  localStorage.setItem("ventas_abiertas", JSON.stringify(ventasAbiertas));
  guardarCarrito([]);
  mostrarToast("success", "Venta guardada", "La venta se movió a estado abierto.");
}

function activarEventosCarrito() {
  renderCarrito();
  renderAdminProductos();
  activarEventosAdmin();
}

function obtenerVentasAbiertas() {
  try {
    const ventas = JSON.parse(localStorage.getItem("ventas_abiertas") || "[]");
    return Array.isArray(ventas) ? ventas : [];
  } catch (e) {
    return [];
  }
}

function guardarVentasAbiertas(ventas) {
  localStorage.setItem("ventas_abiertas", JSON.stringify(Array.isArray(ventas) ? ventas : []));
}

function renderVentasAbiertasSection(ventasAbiertas) {
  if (!ventasAbiertas || ventasAbiertas.length === 0) return "";

  return `
    <div class="ventas-abiertas-seccion" style="margin-top:30px; border-top:2px dashed #eee; padding-top:20px; background: #f8f9fa; border-radius: 10px;">
      <h4 style="color:#8a9b2f; margin-bottom: 10px;">🔄 Ventas en pausa (${ventasAbiertas.length})</h4>
      <div style="display:grid; gap:10px; margin-top:10px;">
        ${ventasAbiertas.map(v => `
          <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; background:white; padding:10px; border-radius:8px; border:1px solid #eee; box-shadow:0 2px 8px #0001;">
            <span style="flex:1;">
              <b>${v.nombre || "Venta en pausa"}</b>
              <span style='color:#888'>(${formatearMoneda(Number(v.total) || 0)})</span>
            </span>
            <div style="display:flex; gap:8px; flex-shrink:0;">
              <button onclick="window.confirmarRetomarVenta(${v.id})" style="background:#8a9b2f; color:white; border:none; padding:5px 14px; border-radius:5px; cursor:pointer; font-weight:600;">Retomar</button>
              <button onclick="window.confirmarEliminarVentaAbierta(${v.id})" style="background:#fee2e2; color:#b91c1c; border:none; padding:5px 14px; border-radius:5px; cursor:pointer; font-weight:700;">Eliminar</button>
            </div>
          </div>
        `).join('')}
      </div>
      <p style="font-size:13px; color:#666; margin-top:10px;">Puedes retomar cualquier venta en pausa o eliminarla si ya no la necesitas.</p>
    </div>
  `;
}

function renderCarrito() {
  const contenedor = document.getElementById("carrito");
  if (!contenedor) return;

  const carrito = obtenerCarrito();
  const ventasAbiertas = obtenerVentasAbiertas();

  if (carrito.length === 0) {
    contenedor.innerHTML = `
      <div style="text-align:center; padding: 50px;">
        <p>Tu carrito esta vacio.</p>
        <br>
        <a href="../index.html" style="color: #8a9b2f; font-weight: bold;">Volver a la tienda</a>
      </div>
    `;
    // Importante: aun con el carrito vacio, mostrar ventas en pausa para poder retomarlas o eliminarlas.
    contenedor.innerHTML += renderVentasAbiertasSection(ventasAbiertas);
    return;
  }

  let html = "";
  let totalGeneral = 0;

  carrito.forEach((item, index) => {
    const productoActual = getProductoActual(item.id);
    const inactivo = !productoActual || productoActual.activo === false;
    const precioActual = precioUnitarioItemCarrito(item, productoActual);
    const subtotal = precioActual * Number(item.cantidad || 0);
    totalGeneral += subtotal;

    const imagen = resolverRutaImagenCarrito(item.imagen || productoActual?.imagen || "");
    html += `
      <div class="item-carrito ${inactivo ? "item-carrito-inactivo" : ""}">
        <img src="${imagen}" alt="${item.nombre}" class="img-carrito">
        <div class="info-carrito">
          <h4>${item.nombre}</h4>
          <p style="margin-bottom:6px;">Precio unitario:</p>
          <input type="number" min="0" step="0.01" class="input-precio input-precio-edit" data-index="${index}" value="${precioActual}" style="width:140px; padding:6px 8px; border:1px solid #ddd; border-radius:8px;" ${inactivo ? "disabled" : ""} />
          ${inactivo ? '<p class="estado-inactivo">Producto inactivo</p>' : ""}
          <div class="controles-cantidad">
            <button class="btn-qty" data-action="restar" data-index="${index}">-</button>
            <input type="number" min="1" value="${item.cantidad}" class="input-cantidad input-cantidad-edit" data-index="${index}" style="width:70px;" ${inactivo ? "disabled" : ""}>
            <button class="btn-qty" data-action="sumar" data-index="${index}" ${inactivo ? "disabled" : ""}>+</button>
          </div>
        </div>
        <div class="controles-item">
          <p><strong>Subtotal: <span class="subtotal-valor" data-index="${index}">${formatearMoneda(subtotal)}</span></strong></p>
          <div style="display:flex; gap:5px;">
            <button class="btn-eliminar" data-index="${index}">Eliminar</button>
          </div>
        </div>
      </div>
    `;
  });

  html += `
    <div class="carrito-total" style="margin-bottom: 2.5rem;">
      <hr>
      <h3>Total a pagar: <span id="total-general">${formatearMoneda(totalGeneral)}</span></h3>
      <div class="botones-finales">
        <button id="vaciar-carrito" class="btn-vaciar">Vaciar Carrito</button>
        <button id="pausar-venta" class="btn-secundario" style="background:#6c757d; color:white; border:none; padding:10px; border-radius:5px; cursor:pointer;">Guardar venta</button>
        <button id="finalizar-compra" class="btn-finalizar">Cerrar venta</button>
      </div>
    </div>
  `;

  html += renderVentasAbiertasSection(ventasAbiertas);

  contenedor.innerHTML = html;
  asignarEventosBotones();
}

function validarCarritoParaCompra(carrito) {
  for (const item of carrito) {
    const producto = getProductoActual(item.id);
    if (!producto || producto.activo === false) {
      return `El producto ${item.nombre} ya no esta disponible.`;
    }
    if (producto.seguimientoInventario && Number(item.cantidad) > Number(producto.stock)) {
      return `No hay stock suficiente para ${item.nombre}. Disponible: ${producto.stock}.`;
    }
  }
  return "";
}


window.confirmarRetomarVenta = (id) => {
  mostrarConfirmacion("¿Deseas retomar esta venta en pausa?", () => window.retomarVenta(id));
};

window.retomarVenta = (id) => {
  const ventasAbiertas = obtenerVentasAbiertas();
  const index = ventasAbiertas.findIndex(v => String(v.id) === String(id));
  if (index === -1) return;

  const venta = ventasAbiertas.splice(index, 1)[0];
  guardarVentasAbiertas(ventasAbiertas);
  guardarCarrito(venta.items);
  mostrarToast("success", "Venta retomada", "Puedes continuar con la edición.");
};

window.confirmarEliminarVentaAbierta = (id) => {
  mostrarConfirmacion("¿Deseas eliminar esta venta en pausa? Esta acción no se puede deshacer.", () => window.eliminarVentaAbierta(id));
};

window.eliminarVentaAbierta = (id) => {
  const ventasAbiertas = obtenerVentasAbiertas();
  const nuevas = ventasAbiertas.filter(v => String(v.id) !== String(id));
  guardarVentasAbiertas(nuevas);
  renderCarrito();
  mostrarToast("success", "Venta eliminada", "La venta en pausa fue eliminada.");
};

function asignarEventosBotones() {
  const carrito = obtenerCarrito();

  const recalcularTotalEnVista = () => {
    const total = carrito.reduce((sum, item) => {
      const productoActual = getProductoActual(item.id);
      const precio = precioUnitarioItemCarrito(item, productoActual);
      return sum + (precio * Number(item.cantidad || 0));
    }, 0);
    const el = document.getElementById("total-general");
    if (el) el.textContent = formatearMoneda(total);
  };

  const actualizarSubtotalEnVista = (index) => {
    const item = carrito[index];
    if (!item) return;
    const productoActual = getProductoActual(item.id);
    const precio = precioUnitarioItemCarrito(item, productoActual);
    const subtotal = precio * Number(item.cantidad || 0);
    const el = document.querySelector(`.subtotal-valor[data-index="${index}"]`);
    if (el) el.textContent = formatearMoneda(subtotal);
  };

  document.querySelectorAll(".btn-qty").forEach((btn) => {
    btn.onclick = (e) => {
      const index = Number(e.target.dataset.index);
      const accion = e.target.dataset.action;
      const item = carrito[index];
      if (!item) return;

      const original = getProductoActual(item.id);
      if (!original || original.activo === false) {
        mostrarToast("warning", "Producto inactivo", "No puedes modificar este producto en el carrito.");
        return;
      }

      if (accion === "sumar") {
        const disponible = stockDisponible(original);
        if (item.cantidad < disponible) {
          item.cantidad += 1;
        } else {
          mostrarToast("warning", "Stock maximo", `No puedes agregar mas. El stock maximo es ${disponible}.`);
        }
      } else if (accion === "restar" && item.cantidad > 1) {
        item.cantidad -= 1;
      }

      const inputCantidad = document.querySelector(`.input-cantidad-edit[data-index="${index}"]`);
      if (inputCantidad) inputCantidad.value = String(item.cantidad);
      persistirCarrito(carrito);
      actualizarSubtotalEnVista(index);
      recalcularTotalEnVista();
    };
  });

  document.querySelectorAll(".input-cantidad-edit").forEach((input) => {
    input.oninput = (e) => {
      const index = Number(e.target.dataset.index);
      const item = carrito[index];
      if (!item) return;

      const original = getProductoActual(item.id);
      if (!original || original.activo === false) return;

      const disponible = stockDisponible(original);
      let n = Number(e.target.value);
      if (!Number.isFinite(n)) return;
      n = Math.max(1, Math.floor(n));
      if (Number.isFinite(disponible) && n > disponible) {
        n = disponible;
        mostrarToast("warning", "Stock maximo", `No puedes agregar mas. El stock maximo es ${disponible}.`);
      }
      e.target.value = String(n);
      item.cantidad = n;
      persistirCarrito(carrito);
      actualizarSubtotalEnVista(index);
      recalcularTotalEnVista();
    };
  });

  document.querySelectorAll(".input-precio-edit").forEach((input) => {
    input.oninput = (e) => {
      const index = Number(e.target.dataset.index);
      const item = carrito[index];
      if (!item) return;

      const original = getProductoActual(item.id);
      if (!original || original.activo === false) return;

      let p = Number(e.target.value);
      if (!Number.isFinite(p)) return;
      p = Math.max(0, p);
      item.precioUnitario = p;
      item.precioVenta = p;
      item.precio = p;
      persistirCarrito(carrito);
      actualizarSubtotalEnVista(index);
      recalcularTotalEnVista();
    };
  });

  document.querySelectorAll(".btn-eliminar").forEach((btn) => {
    btn.onclick = (e) => {
      const index = Number(e.target.dataset.index);
      carrito.splice(index, 1);
      guardarCarrito(carrito);
    };
  });

  const btnVaciar = document.getElementById("vaciar-carrito");
  if (btnVaciar) {
    btnVaciar.onclick = () => {
      mostrarConfirmacion("Quieres vaciar el carrito?", () => {
        guardarCarrito([]);
      });
    };
  }

  const btnPausar = document.getElementById("pausar-venta");
  if (btnPausar) {
    btnPausar.onclick = () => pausarVentaActual();
  }

  const btnFinalizar = document.getElementById("finalizar-compra");
  if (btnFinalizar) {
    btnFinalizar.onclick = () => {
      const carritoActual = obtenerCarrito();
      if (carritoActual.length === 0) return;

      const errorValidacion = validarCarritoParaCompra(carritoActual);
      if (errorValidacion) {
        mostrarToast("error", "No se pudo finalizar", errorValidacion);
        return;
      }

      // Abrir modal de pago
      mostrarModalPago(carritoActual);
    };
  }
}

// Exponer en global para uso sin módulos
window.agregarAlCarrito = agregarAlCarrito;
window.activarEventosCarrito = activarEventosCarrito;
window.renderCarrito = renderCarrito;
window.asignarEventosBotones = asignarEventosBotones;
window.updateCartBadge = updateCartBadge;
window.renderAdminProductos = renderAdminProductos;
window.activarEventosAdmin = activarEventosAdmin;

// === Proveedores (para el select del CRUD de productos) ===
function obtenerListaProveedores() {
  // Preferir Entidades si existe
  try {
    if (window.Entidades && typeof window.Entidades.obtener === "function") {
      return window.Entidades.obtener("proveedores") || [];
    }
  } catch (e) {}

  // Fallback localStorage (por si no está Entidades)
  try {
    const raw = localStorage.getItem("luna_proveedores");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {}

  return [];
}

function populateProveedorSelect() {
  const select = document.getElementById("producto-proveedor");
  if (!select) return;

  const proveedores = obtenerListaProveedores();
  select.innerHTML = "";

  const frag = document.createDocumentFragment();

  const optDefault = document.createElement("option");
  optDefault.value = "";
  optDefault.textContent = "Seleccionar proveedor...";
  frag.appendChild(optDefault);

  proveedores.forEach((p) => {
    const option = document.createElement("option");
    option.value = String(p.id);
    option.textContent = p.nombre || p.empresa || p.contacto || p.correo || "Proveedor";
    frag.appendChild(option);
  });

  select.appendChild(frag);
}

// Escuchar cuando se agregue/edite/elimine un proveedor
window.addEventListener("proveedoresActualizados", () => {
  if (document.getElementById("producto-proveedor")) {
    populateProveedorSelect();
  }
});

// === CATEGORÍAS (select del CRUD de productos) ===
function obtenerListaCategorias() {
  try {
    if (window.Entidades && typeof window.Entidades.obtener === "function") {
      return window.Entidades.obtener("categorias") || [];
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem("luna_categorias");
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {}

  return [];
}

function populateCategoriaSelect() {
  const select = document.getElementById("producto-categoria");
  if (!select) return;

  const categorias = obtenerListaCategorias();

  select.innerHTML = "";

  const frag = document.createDocumentFragment();

  const optDefault = document.createElement("option");
  optDefault.value = "";
  optDefault.textContent = "Seleccionar categoría...";
  frag.appendChild(optDefault);

  categorias.forEach((c) => {
    const option = document.createElement("option");
    // IMPORTANTE: tu producto guarda `categoria` como texto (ver leerPayloadFormulario)
    // Por eso el select debe guardar el nombre, no el id.
    option.value = String(c.id || "");
    option.textContent = c.nombre || "Categoría";
    frag.appendChild(option);
  });

  select.appendChild(frag);
}

window.addEventListener("categoriasActualizadas", () => {
  if (document.getElementById("producto-categoria")) {
    populateCategoriaSelect();
  }
});

// Si estamos en admin.html, poblar al cargar
document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("producto-proveedor")) {
    populateProveedorSelect();
  }
  if (document.getElementById("producto-categoria")) {
    populateCategoriaSelect();
  }
});


document.addEventListener("DOMContentLoaded", () => {
  try { updateCartBadge(); } catch (e) { }
});

function mostrarModalPago(carrito) {
  // Calcular total
  const totalGeneral = carrito.reduce((sum, item) => {
    const producto = getProductoActual(item.id);
    const precio = precioUnitarioItemCarrito(item, producto);
    return sum + (precio * (item.cantidad || 1));
  }, 0);

  const modalHTML = `
    <div id="modal-pago-overlay" style="${getModalPagoStyles()}">
      <div id="modal-pago-contenido" style="${getModalPagoContenidoStyles()}">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
          <h2 style="margin:0; color:#333;">💳 Método de Pago</h2>
          <button onclick="document.getElementById('modal-pago-overlay').remove()" style="background:none; border:none; font-size:24px; cursor:pointer;">✕</button>
        </div>

        <div style="background:#f5f5f5; padding:15px; border-radius:8px; margin-bottom:20px; text-align:center;">
          <p style="margin:0 0 5px 0; color:#666; font-size:14px;">Total a pagar:</p>
          <p style="margin:0; font-size:28px; font-weight:bold; color:#8a9b2f;">${formatearMoneda(totalGeneral)}</p>
        </div>

        <div style="display:grid; gap:10px; margin-bottom:20px;">
          <button class="btn-metodo-pago" data-metodo="Efectivo" style="${getBtnMetodoPagoStyles()}">
            💵 Efectivo
          </button>
          <button class="btn-metodo-pago" data-metodo="Tarjeta Credito" style="${getBtnMetodoPagoStyles()}">
            💳 Tarjeta de crédito
          </button>
          <button class="btn-metodo-pago" data-metodo="Tarjeta Debito" style="${getBtnMetodoPagoStyles()}">
            🏦 Tarjeta de débito
          </button>
          <button class="btn-metodo-pago" data-metodo="Transferencia" style="${getBtnMetodoPagoStyles()}">
            📱 Transferencia
          </button>
        </div>

        <div id="div-efectivo" style="display:none; margin-bottom:20px; padding:15px; background:#fff3cd; border-radius:8px;">
          <label style="display:block; margin-bottom:8px; font-weight:600;">Valor recibido:</label>
          <input type="number" id="valor-recibido" placeholder="Ingresa el valor" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:8px; font-size:14px;">
          <p id="cambio-calculado" style="margin:10px 0 0 0; font-size:13px; color:#666;"></p>
        </div>

        <div style="display:flex; gap:10px;">
          <button id="btn-cancelar-pago" style="flex:1; padding:12px; border:1px solid #ddd; background:white; border-radius:8px; cursor:pointer; font-weight:600;">Cancelar</button>
          <button id="btn-confirmar-pago" style="flex:1; padding:12px; background:#8a9b2f; color:white; border:none; border-radius:8px; cursor:pointer; font-weight:600;">Confirmar Pago</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const overlay = document.getElementById("modal-pago-overlay");
  const btnCancelar = document.getElementById("btn-cancelar-pago");
  const btnConfirmar = document.getElementById("btn-confirmar-pago");
  const btnMetodosPago = document.querySelectorAll(".btn-metodo-pago");
  const divEfectivo = document.getElementById("div-efectivo");
  const inputValorRecibido = document.getElementById("valor-recibido");

  let metodoPagoSeleccionado = null;

  // Cerrar modal al hacer clic en overlay
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      overlay.remove();
    }
  });

  // Cerrar modal con botón cancelar
  if (btnCancelar) {
    btnCancelar.onclick = () => overlay.remove();
  }

  // Seleccionar método de pago
  btnMetodosPago.forEach(btn => {
    btn.onclick = () => {
      btnMetodosPago.forEach(b => b.style.background = "white");
      btn.style.background = "#e8f5e9";
      metodoPagoSeleccionado = btn.dataset.metodo;

      if (metodoPagoSeleccionado === "Efectivo") {
        divEfectivo.style.display = "block";
      } else {
        divEfectivo.style.display = "none";
      }
    };
  });

  // Calcular cambio
  if (inputValorRecibido) {
    inputValorRecibido.addEventListener("input", (e) => {
      const valorRecibido = Number(e.target.value) || 0;
      const cambio = valorRecibido - totalGeneral;
      const cambioP = document.getElementById("cambio-calculado");
      if (cambio >= 0) {
        cambioP.textContent = `Cambio: ${formatearMoneda(cambio)}`;
        cambioP.style.color = "#28a745";
      } else {
        cambioP.textContent = `Falta: ${formatearMoneda(Math.abs(cambio))}`;
        cambioP.style.color = "#dc3545";
      }
    });
  }

  // Confirmar pago
  if (btnConfirmar) {
    btnConfirmar.onclick = async () => {
      if (!metodoPagoSeleccionado) {
        mostrarToast("error", "Selecciona metodo", "Por favor selecciona un método de pago");
        return;
      }

      const valorRecibido = metodoPagoSeleccionado === "Efectivo" ? (Number(inputValorRecibido.value) || 0) : totalGeneral;

      if (metodoPagoSeleccionado === "Efectivo" && valorRecibido < totalGeneral) {
        mostrarToast("error", "Monto insuficiente", "El monto recibido es menor al total");
        return;
      }

      // Bloquear botón para evitar doble clic
      btnConfirmar.disabled = true;
      btnConfirmar.textContent = "Procesando...";

      // Registrar venta y actualizar inventario en la base de datos
      const venta = await window.registrarVenta(carrito, totalGeneral, metodoPagoSeleccionado, valorRecibido);

      // Limpiar carrito y cerrar modal
      overlay.remove();
      guardarCarrito([]);
      renderAdminProductos();

      mostrarToast("success", "Compra exitosa", "Redirigiendo a factura...", 2000);

      setTimeout(() => {
        window.location.href = `factura.html?id=${venta.id}`;
      }, 2000);
    };
  }
}

function getModalPagoStyles() {
  return `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
}

function getModalPagoContenidoStyles() {
  return `
    background: white;
    border-radius: 12px;
    padding: 25px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  `;
}

function getBtnMetodoPagoStyles() {
  return `
    padding: 15px;
    border: 2px solid #ddd;
    background: white;
    border-radius: 8px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 500;
    transition: all 0.3s ease;
  `;
}

function obtenerVentasPasadas() {
  const ventas = JSON.parse(localStorage.getItem("ventas") || "[]");
  const historial = JSON.parse(localStorage.getItem("historialVentas") || "[]");
  return [...ventas, ...historial];
}

function productoApareceEnVentas(idProducto) {
  const coleccion = obtenerVentasPasadas();
  return coleccion.some((venta) => {
    if (!venta || !Array.isArray(venta.items)) return false;
    return venta.items.some((item) => Number(item.id) === Number(idProducto));
  });
}

function archivoADataUrl(archivo) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("No se pudo leer el archivo de imagen."));
    reader.readAsDataURL(archivo);
  });
}

async function leerPayloadFormulario(formulario) {
  return {
    nombre: formulario.nombre.value.trim(),
    categoriaId: formulario.categoriaId.value.trim(),
    precio: formulario.precio.value,
    costo: formulario.costo.value,
    seguimientoInventario: formulario.seguimientoInventario.checked,
    stock: formulario.stock.value
  };
}

function limpiarFormularioAdmin() {
  const form = document.getElementById("producto-form");
  if (!form) return;

  form.reset();

  // Checkbox por defecto
  if (form.seguimientoInventario) form.seguimientoInventario.checked = true;

  // Stock habilitado por defecto
  if (form.stock) {
    form.stock.disabled = false;
    form.stock.value = form.stock.value || "0";
  }

  productoEnEdicionId = null;

  const titulo = document.getElementById("producto-form-title");
  const btnGuardar = document.getElementById("producto-submit");
  if (titulo) titulo.textContent = "Crear producto";
  if (btnGuardar) btnGuardar.textContent = "Guardar producto";
}

function cargarProductoEnFormulario(idProducto) {
  const producto = getProductoActual(idProducto);
  const form = document.getElementById("producto-form");
  if (!producto || !form) return;

  form.nombre.value = producto.nombre;
  form.categoriaId.value = String(producto.categoriaId ?? "");
  form.precio.value = producto.precio;
  form.costo.value = producto.costo;
  form.seguimientoInventario.checked = producto.seguimientoInventario;
  form.stock.value = producto.stock;
  form.stock.disabled = !producto.seguimientoInventario;

  productoEnEdicionId = Number(producto.id);
  const titulo = document.getElementById("producto-form-title");
  const btnGuardar = document.getElementById("producto-submit");
  if (titulo) titulo.textContent = `Editar producto #${producto.id}`;
  if (btnGuardar) btnGuardar.textContent = "Guardar cambios";
}

function renderAdminProductos() {
  const tabla = document.getElementById("admin-productos-body");
  if (!tabla) return;

  const lista = obtenerProductos();
  if (!lista.length) {
    tabla.innerHTML = `<tr><td colspan="8">No hay productos registrados.</td></tr>`;
    return;
  }

  const categorias = (window.Entidades && window.Entidades.obtener) ? window.Entidades.obtener("categorias") : [];
  const categoriaNombrePorId = new Map(
    categorias.map((c) => [String(c.id), c.nombre || "CategorÃ­a"])
  );

  tabla.innerHTML = lista
    .map((producto) => {
      const stock = producto.seguimientoInventario ? producto.stock : "N/A";
      const categoriaNombre = categoriaNombrePorId.get(String(producto.categoriaId)) || producto.categoria || "-";

      return `
        <tr>
          <td>${producto.id}</td>
          <td>${producto.nombre}</td>
          <td>${categoriaNombre}</td>
          <td>${formatearMoneda(producto.precio)}</td>
          <td>${formatearMoneda(producto.costo)}</td>
          <td>${stock}</td>
          <td>${producto.seguimientoInventario ? "Si" : "No"}</td>
          <td>
            <button class="btn-admin btn-editar" data-id="${producto.id}">Editar</button>
            <button class="btn-admin btn-eliminar-admin" data-id="${producto.id}">Eliminar</button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function activarEventosAdmin() {
  if (adminListenersActivos) return;

  const formulario = document.getElementById("producto-form");
  const tabla = document.getElementById("admin-productos-body");
  const btnCancelar = document.getElementById("producto-cancelar");

  if (!formulario || !tabla) return;

  formulario.addEventListener("submit", async (event) => {
    event.preventDefault();
    let payload;
    try {
      payload = await leerPayloadFormulario(formulario);
    } catch (error) {
      mostrarToast("error", "Imagen invalida", "No se pudo procesar la imagen seleccionada.");
      return;
    }

    const respuesta = await (productoEnEdicionId
      ? actualizarProducto(productoEnEdicionId, payload)
      : crearProducto(payload));

    if (!respuesta.ok) {
      mostrarToast("error", "Validacion", respuesta.errores.join(" "));
      return;
    }

    mostrarToast(
      "success",
      productoEnEdicionId ? "Producto actualizado" : "Producto creado",
      "Los cambios se guardaron en SQLite."
    );

    limpiarFormularioAdmin();
    renderAdminProductos();
    renderCarrito();
  });

  formulario.seguimientoInventario.addEventListener("change", (event) => {
    formulario.stock.disabled = !event.target.checked;
    if (!event.target.checked) {
      formulario.stock.value = "0";
    }
  });

  tabla.addEventListener("click", (event) => {
    const target = event.target;
    const id = Number(target.dataset.id);
    if (!id) return;

    if (target.classList.contains("btn-editar")) {
      cargarProductoEnFormulario(id);
      return;
    }

    if (target.classList.contains("btn-eliminar-admin")) {
      mostrarConfirmacion("Deseas eliminar este producto?", async () => {
        const resultado = await eliminarProducto(id);

        if (!resultado.ok) {
          mostrarToast("error", "Error", resultado.errores.join(" "));
          return;
        }

        mostrarToast("success", "Producto eliminado", "El producto fue eliminado de la base de datos.");

        if (productoEnEdicionId === id) {
          limpiarFormularioAdmin();
        }

        renderAdminProductos();
        renderCarrito();
      });
    }
  });

  if (btnCancelar) {
    btnCancelar.addEventListener("click", () => {
      limpiarFormularioAdmin();
    });
  }

  adminListenersActivos = true;
}
