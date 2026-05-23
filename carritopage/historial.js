// carritopage/historial.js

let movimientosActuales = [];
let ordenAscendente = false;
let movimientoAEliminar = null;

function toNumber(valor, fallback = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : fallback;
}

function round2(valor) {
  return Math.round(toNumber(valor) * 100) / 100;
}

function formatearMoneda(valor) {
  return `$${toNumber(valor).toLocaleString("es-CO")}`;
}

function formatearFecha(valor) {
  const fecha = new Date(valor || Date.now());
  if (Number.isNaN(fecha.getTime())) return String(valor || "");
  return fecha.toLocaleString("es-CO", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function parseItems(items) {
  if (typeof items === "string") {
    try {
      return JSON.parse(items || "[]");
    } catch (_error) {
      return [];
    }
  }
  return Array.isArray(items) ? items : [];
}

function normalizarArticulo(item, tipo) {
  const producto = item.producto || {};
  const cantidad = toNumber(item.cantidad, 1);
  const precio = tipo === "compra"
    ? toNumber(item.costoUnitario ?? item.costo ?? item.precio ?? producto.costo, 0)
    : toNumber(item.precioUnitario ?? item.precio ?? item.precioVenta ?? producto.precio, 0);

  return {
    productoId: Number(item.productoId ?? item.productId ?? item.idProducto ?? producto.id ?? item.id),
    nombre: item.nombre || item.titulo || item.productoNombre || producto.nombre || "Producto",
    cantidad,
    precio,
    subtotal: toNumber(item.subtotal, cantidad * precio)
  };
}

function articulosDesdeDetalles(registro, tipo) {
  const detalles = Array.isArray(registro.detalles) ? registro.detalles : [];
  if (detalles.length > 0) {
    return detalles.map((detalle) => normalizarArticulo(detalle, tipo));
  }

  return parseItems(registro.items).map((item) => normalizarArticulo(item, tipo));
}

function agruparArticulosPorProducto(articulos) {
  const agrupados = new Map();
  articulos.forEach((item) => {
    const key = Number(item.productoId) || item.nombre;
    const actual = agrupados.get(key) || { ...item, cantidad: 0, subtotal: 0 };
    actual.cantidad += toNumber(item.cantidad);
    actual.subtotal += toNumber(item.subtotal);
    actual.precio = actual.cantidad > 0 ? actual.subtotal / actual.cantidad : toNumber(item.precio);
    agrupados.set(key, actual);
  });
  return [...agrupados.values()];
}

function normalizarMovimiento(registro, tipo) {
  const articulos = agruparArticulosPorProducto(articulosDesdeDetalles(registro, tipo));
  const totalCalculado = articulos.reduce((sum, item) => sum + item.subtotal, 0);
  const tercero = tipo === "compra"
    ? registro.proveedor?.nombre || "Proveedor no especificado"
    : registro.cliente?.nombre || "Cliente no registrado";

  return {
    id: registro.id,
    uid: `${tipo}-${registro.id}`,
    tipo,
    fecha: registro.fecha || registro.createdAt || registro.created_at || new Date().toISOString(),
    tercero,
    metodoPago: registro.metodoPago || registro.metodo || "",
    estado: registro.estado || "activa",
    articulos,
    reembolsos: parseItems(registro.reembolsos),
    totalReembolsado: toNumber(registro.totalReembolsado, 0),
    total: Number.isFinite(Number(registro.total)) ? Number(registro.total) : totalCalculado
  };
}

async function cargarMovimientos() {
  if (!window.Backend || !window.Backend.isEnabled || !window.Backend.isEnabled()) {
    movimientosActuales = [];
    return;
  }

  const [ventas, compras] = await Promise.all([
    window.Backend.get("ventas").catch((error) => {
      console.error("Error cargando ventas:", error);
      return [];
    }),
    window.Backend.get("compras").catch((error) => {
      console.error("Error cargando compras:", error);
      return [];
    })
  ]);

  const ventasNormalizadas = (Array.isArray(ventas) ? ventas : [])
    .map((venta) => normalizarMovimiento(venta, "venta"));

  const comprasNormalizadas = (Array.isArray(compras) ? compras : [])
    .map((compra) => normalizarMovimiento(compra, "compra"));

  movimientosActuales = [...ventasNormalizadas, ...comprasNormalizadas];
}

function obtenerItemsTotales(movimiento) {
  return movimiento.articulos.reduce((sum, item) => sum + toNumber(item.cantidad), 0);
}

function obtenerCantidadReembolsada(movimiento, productoId) {
  return (movimiento.reembolsos || []).reduce((sum, reembolso) => {
    const items = Array.isArray(reembolso.items) ? reembolso.items : [];
    return sum + items
      .filter((item) => Number(item.productoId) === Number(productoId))
      .reduce((itemSum, item) => {
        const porcentaje = Math.max(0, Math.min(100, toNumber(item.porcentajeReembolso, 100)));
        return itemSum + (toNumber(item.cantidad) * porcentaje / 100);
      }, 0);
  }, 0);
}

function subtotalArticulos(movimiento) {
  return movimiento.articulos.reduce((sum, item) => sum + toNumber(item.subtotal), 0);
}

function factorReembolso(movimiento) {
  const subtotal = subtotalArticulos(movimiento);
  return subtotal > 0 ? Math.min(1, Math.max(0, toNumber(movimiento.total) / subtotal)) : 1;
}

function crearTarjetaMovimiento(movimiento) {
  const ticket = String(movimiento.id).slice(-6);
  const totalItems = obtenerItemsTotales(movimiento);
  const resumen = movimiento.articulos
    .slice(0, 3)
    .map((item) => `${item.cantidad}x ${item.nombre}`)
    .join(", ");
  const extra = movimiento.articulos.length > 3 ? `... +${movimiento.articulos.length - 3} mas` : "";
  const etiquetaTipo = movimiento.tipo === "compra" ? "Compra" : "Venta";
  const claseTipo = movimiento.tipo === "compra" ? "tipo-compra" : "tipo-venta";
  const tieneReembolsos = movimiento.tipo === "venta" && movimiento.totalReembolsado > 0;
  const puedeReembolsar = movimiento.tipo === "venta" && movimiento.estado !== "papelera" && movimiento.estado !== "reembolsada_total";
  const etiquetaEstado = movimiento.estado === "reembolsada_total"
    ? "Reembolsada total"
    : movimiento.estado === "reembolsada_parcial"
      ? "Reembolsada parcial"
      : "";

  const tarjeta = document.createElement("div");
  tarjeta.className = `tarjeta-venta ${claseTipo}`;
  tarjeta.dataset.uid = movimiento.uid;
  tarjeta.innerHTML = `
    <div class="tarjeta-encabezado">
      <div class="info-ticket">
        <h3>${etiquetaTipo} #${ticket}</h3>
        <p class="fecha">${formatearFecha(movimiento.fecha)}</p>
      </div>
      <div class="info-total">
        <p class="total">Total: ${formatearMoneda(movimiento.total)}</p>
        <p class="metodo-pago">${movimiento.tercero}</p>
      </div>
    </div>

    <div class="tarjeta-cuerpo">
      <p class="items-info">
        <strong>${totalItems} articulos:</strong><br>
        <span class="resumen">${resumen}${extra}</span>
      </p>
      ${etiquetaEstado ? `<span class="estado-reembolso">${etiquetaEstado}</span>` : ""}
      ${tieneReembolsos ? `<p class="reembolso-info">Reembolsado: ${formatearMoneda(movimiento.totalReembolsado)}</p>` : ""}
    </div>

    <div class="tarjeta-acciones">
      <button class="btn-ver-detalle" data-uid="${movimiento.uid}">Ver detalle</button>
      ${movimiento.tipo === "venta" ? `<button class="btn-ver-factura" data-id="${movimiento.id}">Ver factura</button>` : ""}
      ${puedeReembolsar ? `<button class="btn-reembolsar" data-uid="${movimiento.uid}">Reembolsar</button>` : ""}
      ${movimiento.tipo === "venta" ? `<button class="btn-eliminar-venta" data-id="${movimiento.id}">Eliminar</button>` : ""}
    </div>
  `;

  return tarjeta;
}

function renderizarHistorial(movimientos = movimientosActuales) {
  const contenedor = document.getElementById("lista-ventas");
  const sinVentas = document.getElementById("sin-ventas");

  if (!contenedor || !sinVentas) return;

  if (!movimientos || movimientos.length === 0) {
    contenedor.innerHTML = "";
    sinVentas.style.display = "flex";
    return;
  }

  sinVentas.style.display = "none";
  contenedor.innerHTML = "";
  movimientos.forEach((movimiento) => contenedor.appendChild(crearTarjetaMovimiento(movimiento)));
  asignarEventosTarjetas();
}

function renderizarPapelera() {
  const registrosPapelera = movimientosActuales.filter((movimiento) => movimiento.tipo === "venta" && movimiento.estado === "papelera");
  renderizarHistorial(registrosPapelera);
}

function movimientosActivos() {
  return movimientosActuales.filter((movimiento) => movimiento.estado !== "papelera");
}

function buscarMovimientoPorUid(uid) {
  return movimientosActuales.find((movimiento) => movimiento.uid === uid);
}

function asignarEventosTarjetas() {
  document.querySelectorAll(".btn-ver-detalle").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const movimiento = buscarMovimientoPorUid(e.currentTarget.dataset.uid);
      if (movimiento) mostrarModalDetalle(movimiento);
    });
  });

  document.querySelectorAll(".btn-ver-factura").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      window.location.href = `factura.html?id=${e.currentTarget.dataset.id}`;
    });
  });

  document.querySelectorAll(".btn-reembolsar").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const movimiento = buscarMovimientoPorUid(e.currentTarget.dataset.uid);
      if (movimiento) mostrarModalReembolso(movimiento);
    });
  });

  document.querySelectorAll(".btn-eliminar-venta").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      movimientoAEliminar = e.currentTarget.dataset.id;
      document.getElementById("modal-confirmar").style.display = "flex";
    });
  });
}

function mostrarModalDetalle(movimiento) {
  const titulo = movimiento.tipo === "compra" ? "Detalle de Compra" : "Detalle de Venta";
  const encabezadoPrecio = movimiento.tipo === "compra" ? "Costo Unit." : "Precio";
  const detalles = movimiento.articulos.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${item.nombre}</td>
      <td>${item.cantidad}</td>
      <td>${formatearMoneda(item.precio)}</td>
      <td>${formatearMoneda(item.subtotal)}</td>
    </tr>
  `).join("");
  const historialReembolsos = (movimiento.reembolsos || []).length
    ? `
      <div class="historial-reembolsos">
        <h3>Reembolsos</h3>
        ${(movimiento.reembolsos || []).map((reembolso) => `
          <div class="reembolso-resumen">
            <strong>${formatearFecha(reembolso.fecha)}</strong>
            <span>${formatearMoneda(reembolso.valorTotal)}</span>
            <small>${(reembolso.items || []).map((item) => `${item.cantidad}x ${item.nombre} (${toNumber(item.porcentajeReembolso, 100)}%)`).join(", ")}</small>
          </div>
        `).join("")}
      </div>
    `
    : "";

  const contenidoModal = `
    <div class="modal-overlay" id="modal-detalle-overlay">
      <div class="modal-detalle">
        <div class="modal-header">
          <h2>${titulo} #${String(movimiento.id).slice(-6)}</h2>
          <button class="btn-cerrar-modal" onclick="document.getElementById('modal-detalle-overlay').remove()">X</button>
        </div>

        <div class="modal-body">
          <div class="detalle-info">
            <p><strong>Fecha:</strong> ${formatearFecha(movimiento.fecha)}</p>
            <p><strong>${movimiento.tipo === "compra" ? "Proveedor" : "Cliente"}:</strong> ${movimiento.tercero}</p>
            ${movimiento.metodoPago ? `<p><strong>Metodo de pago:</strong> ${movimiento.metodoPago}</p>` : ""}
          </div>

          <table class="tabla-detalle">
            <thead>
              <tr>
                <th>#</th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>${encabezadoPrecio}</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>${detalles}</tbody>
          </table>

          <div style="text-align:right; margin-top:20px; border-top:2px solid #eee; padding-top:15px;">
            <h3 style="color:#8a9b2f;">Total: ${formatearMoneda(movimiento.total)}</h3>
            ${movimiento.totalReembolsado > 0 ? `<p><strong>Reembolsado:</strong> ${formatearMoneda(movimiento.totalReembolsado)}</p>` : ""}
          </div>

          ${historialReembolsos}
        </div>

        <div class="modal-footer">
          <button class="btn-secundario" onclick="document.getElementById('modal-detalle-overlay').remove()">Cerrar</button>
          ${movimiento.tipo === "venta" ? `<button class="btn-primario" onclick="window.location.href='factura.html?id=${movimiento.id}'">Ver factura</button>` : ""}
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", contenidoModal);
  document.getElementById("modal-detalle-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-detalle-overlay") e.target.remove();
  });
}

function mostrarModalReembolso(movimiento) {
  const factor = factorReembolso(movimiento);
  const filas = movimiento.articulos.map((item, index) => {
    const reembolsada = obtenerCantidadReembolsada(movimiento, item.productoId);
    const disponible = Math.max(0, toNumber(item.cantidad) - reembolsada);
    const cantidadBase = disponible >= 1 ? 1 : toNumber(item.cantidad);
    const porcentajeInicial = disponible >= 1 ? 100 : Math.max(1, Math.min(100, round2(disponible * 100 / Math.max(1, cantidadBase))));
    const disabled = disponible <= 0 ? "disabled" : "";
    return `
      <tr data-factor="${factor}" data-precio="${item.precio}" data-producto-id="${item.productoId}" data-disponible="${disponible}">
        <td><input type="checkbox" class="refund-select" ${disabled}></td>
        <td>
          <strong>${item.nombre}</strong>
          <small>Disponible: ${round2(disponible)} equivalente</small>
        </td>
        <td>
          <input type="number" class="refund-cantidad" value="${disponible > 0 ? cantidadBase : 0}" min="1" max="${item.cantidad}" ${disabled}>
        </td>
        <td>
          <input type="number" class="refund-porcentaje" value="${porcentajeInicial}" min="1" max="100" step="1" ${disabled}>
        </td>
        <td>${formatearMoneda(item.precio)}</td>
        <td><input type="checkbox" class="refund-stock" ${disabled} checked></td>
        <td class="refund-subtotal">${formatearMoneda(disponible > 0 ? item.precio * factor : 0)}</td>
      </tr>
    `;
  }).join("");

  const contenidoModal = `
    <div class="modal-overlay" id="modal-reembolso-overlay">
      <div class="modal-detalle modal-reembolso">
        <div class="modal-header">
          <h2>Reembolso venta #${String(movimiento.id).slice(-6)}</h2>
          <button class="btn-cerrar-modal" id="cerrar-reembolso">X</button>
        </div>

        <div class="modal-body">
          <div class="detalle-info">
            <p><strong>Cliente:</strong> ${movimiento.tercero}</p>
            <p><strong>Total venta:</strong> ${formatearMoneda(movimiento.total)}</p>
            <p><strong>Ya reembolsado:</strong> ${formatearMoneda(movimiento.totalReembolsado)}</p>
          </div>

          <table class="tabla-detalle tabla-reembolso">
            <thead>
              <tr>
                <th></th>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>%</th>
                <th>Precio</th>
                <th>Inventario</th>
                <th>Reembolso</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>

          <label class="motivo-reembolso">
            Motivo
            <textarea id="motivo-reembolso" maxlength="250" placeholder="Opcional"></textarea>
          </label>

          <div class="total-reembolso-box">
            <span>Total a reembolsar</span>
            <strong id="total-reembolso-calculado">${formatearMoneda(0)}</strong>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secundario" id="cancelar-reembolso">Cancelar</button>
          <button class="btn-primario" id="confirmar-reembolso">Confirmar reembolso</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", contenidoModal);

  const overlay = document.getElementById("modal-reembolso-overlay");
  const cerrar = () => overlay?.remove();

  function recalcular() {
    let total = 0;
    overlay.querySelectorAll("tbody tr").forEach((row) => {
      const selected = row.querySelector(".refund-select").checked;
      const cantidadInput = row.querySelector(".refund-cantidad");
      const cantidad = Math.max(0, Math.min(toNumber(cantidadInput.value), toNumber(cantidadInput.max)));
      const porcentajeInput = row.querySelector(".refund-porcentaje");
      const porcentaje = Math.max(0, Math.min(100, toNumber(porcentajeInput.value, 100)));
      const disponible = toNumber(row.dataset.disponible);
      const excedeDisponible = selected && (cantidad * porcentaje / 100) > disponible;
      const precio = toNumber(row.dataset.precio);
      const rowFactor = toNumber(row.dataset.factor, 1);
      const subtotal = selected ? cantidad * precio * rowFactor * (porcentaje / 100) : 0;
      row.classList.toggle("refund-row-error", excedeDisponible);
      row.querySelector(".refund-subtotal").textContent = formatearMoneda(subtotal);
      if (selected) total += subtotal;
    });
    document.getElementById("total-reembolso-calculado").textContent = formatearMoneda(total);
  }

  overlay.querySelectorAll(".refund-select, .refund-cantidad, .refund-porcentaje").forEach((input) => {
    input.addEventListener("input", recalcular);
    input.addEventListener("change", recalcular);
  });

  overlay.querySelector("#cerrar-reembolso").addEventListener("click", cerrar);
  overlay.querySelector("#cancelar-reembolso").addEventListener("click", cerrar);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) cerrar();
  });

  overlay.querySelector("#confirmar-reembolso").addEventListener("click", async () => {
    const items = [...overlay.querySelectorAll("tbody tr")]
      .filter((row) => row.querySelector(".refund-select").checked)
      .map((row) => ({
        productoId: Number(row.dataset.productoId),
        cantidad: Number(row.querySelector(".refund-cantidad").value),
        porcentajeReembolso: Number(row.querySelector(".refund-porcentaje").value),
        retornaInventario: row.querySelector(".refund-stock").checked,
        disponible: Number(row.dataset.disponible)
      }))
      .filter((item) => item.productoId && item.cantidad > 0);

    if (!items.length) {
      mostrarNotificacion("error", "Sin productos", "Selecciona al menos un producto para reembolsar.");
      return;
    }

    if (items.some((item) => (item.cantidad * item.porcentajeReembolso / 100) > item.disponible)) {
      mostrarNotificacion("error", "Valor excedido", "El porcentaje seleccionado supera lo disponible para reembolsar.");
      return;
    }

    try {
      await window.Backend.post(`ventas/${movimiento.id}/reembolsos`, {
        items: items.map(({ disponible, ...item }) => item),
        motivo: document.getElementById("motivo-reembolso").value
      });
      cerrar();
      await cargarMovimientos();
      movimientosActuales = ordenarMovimientos(movimientosActuales);
      renderizarHistorial(movimientosActivos());
      mostrarNotificacion("success", "Reembolso registrado", "La venta fue actualizada correctamente.");

      const unidadesDevueltas = items.reduce((sum, item) => sum + (item.retornaInventario ? item.cantidad : 0), 0);
      if (unidadesDevueltas > 0) {
        mostrarNotificacion(
          "success",
          "Inventario",
          unidadesDevueltas === 1
            ? "Se devolvió 1 unidad al inventario."
            : `Se devolvieron ${unidadesDevueltas} unidades al inventario.`
        );
      }
    } catch (error) {
      console.error("Error registrando reembolso:", error);
      mostrarNotificacion("error", "Error", error.payload?.error || "No se pudo registrar el reembolso.");
    }
  });

  recalcular();
}

function filtrarMovimientos(terminoBusqueda) {
  const termino = String(terminoBusqueda || "").toLowerCase();
  return movimientosActivos().filter((movimiento) => {
    const ticket = String(movimiento.id).slice(-6);
    const fecha = formatearFecha(movimiento.fecha).toLowerCase();
    const tipo = movimiento.tipo.toLowerCase();
    const tercero = movimiento.tercero.toLowerCase();
    return ticket.includes(termino) || fecha.includes(termino) || tipo.includes(termino) || tercero.includes(termino);
  });
}

function ordenarMovimientos(movimientos) {
  return [...movimientos].sort((a, b) => {
    const fechaA = new Date(a.fecha).getTime() || 0;
    const fechaB = new Date(b.fecha).getTime() || 0;
    return ordenAscendente ? fechaA - fechaB : fechaB - fechaA;
  });
}

async function eliminarVenta(idVenta) {
  try {
    if (window.Backend && window.Backend.isEnabled && window.Backend.isEnabled()) {
      await window.Backend.put(`ventas/${idVenta}`, { estado: "papelera" });
    }
    await cargarMovimientos();
    movimientosActuales = ordenarMovimientos(movimientosActuales);
    renderizarHistorial(movimientosActuales.filter((m) => m.estado !== "papelera"));
    mostrarNotificacion("success", "Venta eliminada", "El registro fue enviado a papelera.");
  } catch (error) {
    console.error("Error eliminando venta:", error);
    mostrarNotificacion("error", "Error", "No se pudo eliminar la venta.");
  }
}

function obtenerFiltros() {
  return {
    fechaDesde: document.getElementById("fecha-desde")?.value || "",
    fechaHasta: document.getElementById("fecha-hasta")?.value || "",
    montoMinimo: Number(document.getElementById("monto-minimo")?.value) || 0,
    montoMaximo: Number(document.getElementById("monto-maximo")?.value) || Infinity,
    metodoPago: document.getElementById("metodo-pago-filtro")?.value || "",
    itemsMinimo: Number(document.getElementById("items-minimo")?.value) || 1
  };
}

function aplicarFiltrosAvanzados(movimientos, filtros) {
  return movimientos.filter((movimiento) => {
    const fecha = new Date(movimiento.fecha);

    if (filtros.fechaDesde && fecha < new Date(filtros.fechaDesde)) return false;
    if (filtros.fechaHasta) {
      const hasta = new Date(filtros.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      if (fecha > hasta) return false;
    }

    if (movimiento.total < filtros.montoMinimo || movimiento.total > filtros.montoMaximo) return false;
    if (filtros.metodoPago && movimiento.metodoPago !== filtros.metodoPago) return false;
    if (obtenerItemsTotales(movimiento) < filtros.itemsMinimo) return false;

    return true;
  });
}

function mostrarFiltrosActivos(filtros) {
  const contenedor = document.getElementById("filtros-activos");
  if (!contenedor) return;

  const activos = [];
  if (filtros.fechaDesde) activos.push(`Desde: ${filtros.fechaDesde}`);
  if (filtros.fechaHasta) activos.push(`Hasta: ${filtros.fechaHasta}`);
  if (filtros.montoMinimo > 0) activos.push(`Min: ${formatearMoneda(filtros.montoMinimo)}`);
  if (filtros.montoMaximo < Infinity) activos.push(`Max: ${formatearMoneda(filtros.montoMaximo)}`);
  if (filtros.metodoPago) activos.push(filtros.metodoPago);
  if (filtros.itemsMinimo > 1) activos.push(`${filtros.itemsMinimo}+ items`);

  contenedor.innerHTML = activos.length
    ? `<div class="filtros-tag-container">${activos.map((filtro) => `<span class="filtro-tag">${filtro}</span>`).join("")}</div>`
    : "";
}

function obtenerContenedorNotificaciones() {
  let container = document.getElementById("notification-container");

  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    document.body.appendChild(container);
  }

  return container;
}

function mostrarNotificacion(tipo, titulo, mensaje) {
  const container = obtenerContenedorNotificaciones();
  const notification = document.createElement("div");
  notification.className = `notification notification-${tipo}`;
  notification.innerHTML = `<strong>${titulo}:</strong> ${mensaje}`;
  notification.style.cssText = `
    background: ${tipo === "success" ? "#d4edda" : "#f8d7da"};
    border: 1px solid ${tipo === "success" ? "#c3e6cb" : "#f5c6cb"};
    color: ${tipo === "success" ? "#155724" : "#721c24"};
  `;

  container.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function descargarReporte() {
  if (movimientosActuales.length === 0) {
    mostrarNotificacion("error", "Sin datos", "No hay registros para descargar");
    return;
  }

  let contenido = "REPORTE DE MOVIMIENTOS - PAPEL Y LUNA\n";
  contenido += "=====================================\n\n";
  contenido += `Generado: ${new Date().toLocaleString("es-CO")}\n`;
  contenido += `Total de registros: ${movimientosActuales.length}\n\n`;

  movimientosActuales.forEach((movimiento) => {
    contenido += `${movimiento.tipo.toUpperCase()} #${String(movimiento.id).slice(-6)}\n`;
    contenido += `Fecha: ${formatearFecha(movimiento.fecha)}\n`;
    contenido += `${movimiento.tipo === "compra" ? "Proveedor" : "Cliente"}: ${movimiento.tercero}\n`;
    movimiento.articulos.forEach((item) => {
      contenido += `  - ${item.nombre}: ${item.cantidad}x ${formatearMoneda(item.precio)}\n`;
    });
    contenido += `Total: ${formatearMoneda(movimiento.total)}\n`;
    contenido += "-------------------------------------\n\n";
  });

  const elemento = document.createElement("a");
  elemento.setAttribute("href", `data:text/plain;charset=utf-8,${encodeURIComponent(contenido)}`);
  elemento.setAttribute("download", `reporte-movimientos-${Date.now()}.txt`);
  elemento.style.display = "none";
  document.body.appendChild(elemento);
  elemento.click();
  document.body.removeChild(elemento);
}

async function inicializarHistorial() {
  await cargarMovimientos();
  movimientosActuales = ordenarMovimientos(movimientosActuales);
  renderizarHistorial(movimientosActivos());

  const inputBusqueda = document.getElementById("buscar-venta");
  const btnLimpiar = document.getElementById("limpiar-busqueda");
  const btnOrdenar = document.getElementById("ordenar-ventas");
  const btnDescargar = document.getElementById("descargar-reporte");
  const btnPapelera = document.getElementById("btn-papelera");
  const btnVolverHistorial = document.getElementById("btn-volver-historial");
  const toggleFiltros = document.getElementById("toggle-filtros");
  const filtrosAvanzados = document.getElementById("filtros-avanzados");
  const btnAplicarFiltros = document.getElementById("aplicar-filtros");
  const btnLimpiarFiltros = document.getElementById("limpiar-filtros");
  const modalConfirmar = document.getElementById("modal-confirmar");
  const btnCancelarEliminar = document.getElementById("cancelar-eliminar");
  const btnConfirmarEliminar = document.getElementById("confirmar-eliminar");

  inputBusqueda?.addEventListener("input", (e) => {
    renderizarHistorial(ordenarMovimientos(filtrarMovimientos(e.target.value)));
  });

  btnLimpiar?.addEventListener("click", () => {
    if (inputBusqueda) inputBusqueda.value = "";
    renderizarHistorial(movimientosActivos());
  });

  btnOrdenar?.addEventListener("click", () => {
    ordenAscendente = !ordenAscendente;
    btnOrdenar.textContent = ordenAscendente ? "Mas antiguos" : "Mas recientes";
    movimientosActuales = ordenarMovimientos(movimientosActuales);
    renderizarHistorial(movimientosActivos());
  });

  btnDescargar?.addEventListener("click", descargarReporte);

  btnPapelera?.addEventListener("click", () => {
    btnPapelera.style.display = "none";
    if (btnVolverHistorial) btnVolverHistorial.style.display = "inline-block";
    renderizarPapelera();
  });

  btnVolverHistorial?.addEventListener("click", () => {
    btnVolverHistorial.style.display = "none";
    if (btnPapelera) btnPapelera.style.display = "inline-block";
    renderizarHistorial(movimientosActivos());
  });

  toggleFiltros?.addEventListener("click", () => {
    const visible = filtrosAvanzados.style.display !== "none";
    filtrosAvanzados.style.display = visible ? "none" : "flex";
    toggleFiltros.textContent = visible ? "Filtros Avanzados" : "Ocultar Filtros";
  });

  btnAplicarFiltros?.addEventListener("click", () => {
    const filtros = obtenerFiltros();
    let resultado = aplicarFiltrosAvanzados(movimientosActivos(), filtros);
    if (inputBusqueda?.value) {
      resultado = aplicarFiltrosAvanzados(filtrarMovimientos(inputBusqueda.value), filtros);
    }
    resultado = ordenarMovimientos(resultado);
    mostrarFiltrosActivos(filtros);
    renderizarHistorial(resultado);
  });

  btnLimpiarFiltros?.addEventListener("click", () => {
    ["fecha-desde", "fecha-hasta", "monto-minimo", "monto-maximo", "metodo-pago-filtro", "items-minimo"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    if (inputBusqueda) inputBusqueda.value = "";
    mostrarFiltrosActivos(obtenerFiltros());
    renderizarHistorial(movimientosActivos());
  });

  btnCancelarEliminar?.addEventListener("click", () => {
    modalConfirmar.style.display = "none";
    movimientoAEliminar = null;
  });

  btnConfirmarEliminar?.addEventListener("click", async () => {
    if (movimientoAEliminar) await eliminarVenta(movimientoAEliminar);
    modalConfirmar.style.display = "none";
    movimientoAEliminar = null;
  });

  modalConfirmar?.addEventListener("click", (e) => {
    if (e.target === modalConfirmar) {
      modalConfirmar.style.display = "none";
      movimientoAEliminar = null;
    }
  });
}

window.inicializarHistorial = inicializarHistorial;
