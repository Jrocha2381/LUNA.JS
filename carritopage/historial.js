// carritopage/historial.js

let ventasActuales = [];
let ordenAscendente = false;
let ventaAEliminar = null;

function obtenerFechaVenta(venta) {
  const fecha = new Date(venta?.fecha);
  return Number.isNaN(fecha.getTime()) ? new Date(0) : fecha;
}

function inicioDelDia(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function formatearMoneda(valor) {
  return `$${Number(valor).toLocaleString()}`;
}

function obtenerNombreProducto(item) {
  return item.nombre || item.titulo || item.producto?.nombre || "Producto";
}

async function cargarVentas() {
  const ventas = await window.obtenerVentas();
  ventasActuales = Array.isArray(ventas) ? ventas.map((venta) => ({
    ...venta,
    items: Array.isArray(venta.items) ? venta.items : []
  })) : [];
}

function crearTarjetaVenta(venta) {
  const ticket = String(venta.id).slice(-6);
  const totalItems = venta.items.reduce((sum, item) => sum + (item.cantidad || 1), 0);
  const resumenProductos = venta.items.slice(0, 3).map((item) => `${item.cantidad}x ${obtenerNombreProducto(item)}`).join(", ");
  const productosExtra = venta.items.length > 3 ? `... +${venta.items.length - 3} mas` : "";

  const tarjeta = document.createElement("div");
  tarjeta.className = "tarjeta-venta";
  tarjeta.innerHTML = `
    <div class="tarjeta-encabezado">
      <div class="info-ticket">
        <h3>#${ticket}</h3>
        <p class="fecha">${new Date(venta.fecha).toLocaleString()}</p>
      </div>
      <div class="info-total">
        <p class="total">Total: ${formatearMoneda(venta.total)}</p>
        <p class="metodo-pago">${venta.metodoPago || "-"}</p>
      </div>
    </div>
    <div class="tarjeta-cuerpo">
      <p class="items-info">
        <strong>${totalItems} articulos:</strong><br>
        <span class="resumen">${resumenProductos}${productosExtra}</span>
      </p>
    </div>
    <div class="tarjeta-acciones">
      <button class="btn-ver-detalle" data-id="${venta.id}">Ver detalle</button>
      <button class="btn-eliminar-venta" data-id="${venta.id}">Eliminar</button>
    </div>
  `;
  return tarjeta;
}

function renderizarHistorial(ventas) {
  const contenedor = document.getElementById("lista-ventas");
  const sinVentas = document.getElementById("sin-ventas");

  if (!ventas || ventas.length === 0) {
    contenedor.innerHTML = "";
    sinVentas.style.display = "flex";
    return;
  }

  sinVentas.style.display = "none";
  contenedor.innerHTML = "";
  ventas.forEach((venta) => contenedor.appendChild(crearTarjetaVenta(venta)));
  asignarEventosTarjetas();
}

function asignarEventosTarjetas() {
  document.querySelectorAll(".btn-ver-detalle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const venta = ventasActuales.find((v) => String(v.id) === e.target.dataset.id);
      if (venta) mostrarModalDetalle(venta);
    });
  });

  document.querySelectorAll(".btn-eliminar-venta").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      ventaAEliminar = e.target.dataset.id;
      document.getElementById("modal-confirmar").style.display = "flex";
    });
  });
}

function mostrarModalDetalle(venta) {
  const detalles = venta.items.map((item, idx) => {
    const cantidad = item.cantidad || 1;
    const precio = item.precio || 0;
    const subtotal = precio * cantidad;
    return `
      <tr>
        <td>${idx + 1}</td>
        <td>${obtenerNombreProducto(item)}</td>
        <td>${cantidad}</td>
        <td>${formatearMoneda(precio)}</td>
        <td>${formatearMoneda(subtotal)}</td>
      </tr>
    `;
  }).join("");

  const contenidoModal = `
    <div class="modal-overlay" id="modal-detalle-overlay">
      <div class="modal-detalle">
        <div class="modal-header">
          <h2>Detalle de Venta #${String(venta.id).slice(-6)}</h2>
          <button class="btn-cerrar-modal" onclick="document.getElementById('modal-detalle-overlay').remove()">X</button>
        </div>
        <div class="modal-body">
          <div class="detalle-info">
            <p><strong>Fecha:</strong> ${new Date(venta.fecha).toLocaleString()}</p>
            <p><strong>Metodo de pago:</strong> ${venta.metodoPago || "-"}</p>
          </div>
          <table class="tabla-detalle">
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>${detalles}</tbody>
          </table>
          <div style="text-align: right; margin-top: 20px; border-top: 2px solid #eee; padding-top: 15px;">
            <h3 style="color: #8a9b2f;">Total: ${formatearMoneda(venta.total)}</h3>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secundario" onclick="document.getElementById('modal-detalle-overlay').remove()">Cerrar</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", contenidoModal);
  document.getElementById("modal-detalle-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-detalle-overlay") e.target.remove();
  });
}

function filtrarVentas(terminoBusqueda) {
  const termino = terminoBusqueda.toLowerCase();
  return ventasActuales.filter((venta) => {
    const ticket = String(venta.id).slice(-6);
    const fecha = String(venta.fecha || "").toLowerCase();
    return ticket.includes(termino) || fecha.includes(termino);
  });
}

function ordenarVentas(ventas) {
  return [...ventas].sort((a, b) => ordenAscendente ? obtenerFechaVenta(a) - obtenerFechaVenta(b) : obtenerFechaVenta(b) - obtenerFechaVenta(a));
}

async function eliminarVenta(idVenta) {
  await window.Backend.delete(`ventas/${idVenta}`);
  await cargarVentas();
  renderizarHistorial(ordenarVentas(ventasActuales));
  mostrarNotificacion("success", "Venta eliminada", "El registro ha sido eliminado correctamente.");
}

function mostrarNotificacion(tipo, titulo, mensaje) {
  const notification = document.createElement("div");
  notification.className = `notification notification-${tipo}`;
  notification.innerHTML = `<strong>${titulo}:</strong> ${mensaje}`;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${tipo === "success" ? "#d4edda" : "#f8d7da"};
    border: 1px solid ${tipo === "success" ? "#c3e6cb" : "#f5c6cb"};
    color: ${tipo === "success" ? "#155724" : "#721c24"};
    padding: 15px 20px;
    border-radius: 8px;
    z-index: 9999;
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function descargarReporte() {
  if (ventasActuales.length === 0) {
    mostrarNotificacion("error", "Sin datos", "No hay ventas para descargar");
    return;
  }

  let contenido = "REPORTE DE VENTAS - PAPEL Y LUNA\n";
  contenido += "=================================\n\n";
  contenido += `Generado: ${new Date().toLocaleString()}\n`;
  contenido += `Total de ventas: ${ventasActuales.length}\n`;
  contenido += `Venta total: ${formatearMoneda(ventasActuales.reduce((sum, v) => sum + v.total, 0))}\n\n`;

  ventasActuales.forEach((venta) => {
    contenido += `Ticket: #${String(venta.id).slice(-6)}\n`;
    contenido += `Fecha: ${new Date(venta.fecha).toLocaleString()}\n`;
    contenido += `Metodo de pago: ${venta.metodoPago}\n`;
    venta.items.forEach((item) => {
      contenido += `  - ${obtenerNombreProducto(item)}: ${item.cantidad}x ${formatearMoneda(item.precio)}\n`;
    });
    contenido += `Total: ${formatearMoneda(venta.total)}\n\n`;
  });

  const elemento = document.createElement("a");
  elemento.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(contenido));
  elemento.setAttribute("download", `reporte-ventas-${Date.now()}.txt`);
  elemento.style.display = "none";
  document.body.appendChild(elemento);
  elemento.click();
  document.body.removeChild(elemento);
}

function obtenerFiltros() {
  return {
    fechaDesde: document.getElementById("fecha-desde").value,
    fechaHasta: document.getElementById("fecha-hasta").value,
    montoMinimo: Number(document.getElementById("monto-minimo").value) || 0,
    montoMaximo: Number(document.getElementById("monto-maximo").value) || Infinity,
    metodoPago: document.getElementById("metodo-pago-filtro").value,
    itemsMinimo: Number(document.getElementById("items-minimo").value) || 1
  };
}

function aplicarFiltrosAvanzados(ventas, filtros) {
  return ventas.filter((venta) => {
    if (filtros.fechaDesde || filtros.fechaHasta) {
      const fechaVenta = inicioDelDia(obtenerFechaVenta(venta));
      if (filtros.fechaDesde && fechaVenta < inicioDelDia(new Date(`${filtros.fechaDesde}T00:00:00`))) return false;
      if (filtros.fechaHasta && fechaVenta > inicioDelDia(new Date(`${filtros.fechaHasta}T00:00:00`))) return false;
    }

    if (venta.total < filtros.montoMinimo || venta.total > filtros.montoMaximo) return false;
    if (filtros.metodoPago && venta.metodoPago !== filtros.metodoPago) return false;

    const totalItems = venta.items.reduce((sum, item) => sum + (item.cantidad || 1), 0);
    return totalItems >= filtros.itemsMinimo;
  });
}

function mostrarFiltrosActivos(filtros) {
  const contenedor = document.getElementById("filtros-activos");
  const activos = [];
  if (filtros.fechaDesde) activos.push(`Desde: ${filtros.fechaDesde}`);
  if (filtros.fechaHasta) activos.push(`Hasta: ${filtros.fechaHasta}`);
  if (filtros.montoMinimo > 0) activos.push(`Min: ${formatearMoneda(filtros.montoMinimo)}`);
  if (filtros.montoMaximo < Infinity) activos.push(`Max: ${formatearMoneda(filtros.montoMaximo)}`);
  if (filtros.metodoPago) activos.push(filtros.metodoPago);
  if (filtros.itemsMinimo > 1) activos.push(`${filtros.itemsMinimo}+ items`);
  contenedor.innerHTML = activos.length ? `<div class="filtros-tag-container">${activos.map((f) => `<span class="filtro-tag">${f}</span>`).join("")}</div>` : "";
}

async function inicializarHistorial() {
  await cargarVentas();
  ventasActuales = ordenarVentas(ventasActuales);
  renderizarHistorial(ventasActuales);

  const inputBusqueda = document.getElementById("buscar-venta");
  const btnLimpiar = document.getElementById("limpiar-busqueda");
  const btnOrdenar = document.getElementById("ordenar-ventas");
  const btnDescargar = document.getElementById("descargar-reporte");
  const toggleFiltros = document.getElementById("toggle-filtros");
  const filtrosAvanzados = document.getElementById("filtros-avanzados");
  const btnAplicarFiltros = document.getElementById("aplicar-filtros");
  const btnLimpiarFiltros = document.getElementById("limpiar-filtros");
  const modalConfirmar = document.getElementById("modal-confirmar");
  const btnCancelarEliminar = document.getElementById("cancelar-eliminar");
  const btnConfirmarEliminar = document.getElementById("confirmar-eliminar");

  inputBusqueda?.addEventListener("input", (e) => renderizarHistorial(ordenarVentas(filtrarVentas(e.target.value))));
  btnLimpiar?.addEventListener("click", () => {
    if (inputBusqueda) inputBusqueda.value = "";
    renderizarHistorial(ventasActuales);
  });
  btnOrdenar?.addEventListener("click", () => {
    ordenAscendente = !ordenAscendente;
    btnOrdenar.textContent = ordenAscendente ? "Mas antiguos" : "Mas recientes";
    ventasActuales = ordenarVentas(ventasActuales);
    renderizarHistorial(ventasActuales);
  });
  btnDescargar?.addEventListener("click", descargarReporte);

  toggleFiltros?.addEventListener("click", () => {
    const visible = filtrosAvanzados.style.display !== "none";
    filtrosAvanzados.style.display = visible ? "none" : "flex";
  });

  btnAplicarFiltros?.addEventListener("click", () => {
    const filtros = obtenerFiltros();
    let resultado = aplicarFiltrosAvanzados(ventasActuales, filtros);
    if (inputBusqueda?.value) resultado = aplicarFiltrosAvanzados(filtrarVentas(inputBusqueda.value), filtros);
    renderizarHistorial(ordenarVentas(resultado));
    mostrarFiltrosActivos(filtros);
  });

  btnLimpiarFiltros?.addEventListener("click", async () => {
    document.getElementById("fecha-desde").value = "";
    document.getElementById("fecha-hasta").value = "";
    document.getElementById("monto-minimo").value = "";
    document.getElementById("monto-maximo").value = "";
    document.getElementById("metodo-pago-filtro").value = "";
    document.getElementById("items-minimo").value = "";
    if (inputBusqueda) inputBusqueda.value = "";
    await cargarVentas();
    ventasActuales = ordenarVentas(ventasActuales);
    renderizarHistorial(ventasActuales);
    mostrarFiltrosActivos(obtenerFiltros());
  });

  btnCancelarEliminar?.addEventListener("click", () => {
    modalConfirmar.style.display = "none";
    ventaAEliminar = null;
  });

  btnConfirmarEliminar?.addEventListener("click", async () => {
    if (ventaAEliminar) await eliminarVenta(ventaAEliminar);
    modalConfirmar.style.display = "none";
    ventaAEliminar = null;
  });

  modalConfirmar?.addEventListener("click", (e) => {
    if (e.target === modalConfirmar) {
      modalConfirmar.style.display = "none";
      ventaAEliminar = null;
    }
  });
}

window.inicializarHistorial = inicializarHistorial;
