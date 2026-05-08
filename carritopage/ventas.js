// carritopage/ventas.js

let carritoVentas = []; // Array de {productoId, nombre, cantidad, precioUnitario, subtotal, stock, seguimientoInventario}
let productosDisponibles = [];
let clientesDisponibles = [];
let productoModalActual = null;
const VENTAS_SYNC_INTERVAL_MS = 8000;

// === Sistema de Pausa y Reanudación de Ventas ===
function obtenerVentasAbiertas() {
  try {
    const ventas = JSON.parse(localStorage.getItem("ventas_abiertas_venta") || "[]");
    return Array.isArray(ventas) ? ventas : [];
  } catch (e) {
    return [];
  }
}

function guardarVentasAbiertas(ventas) {
  localStorage.setItem("ventas_abiertas_venta", JSON.stringify(Array.isArray(ventas) ? ventas : []));
}

function formatearMonedaVentas(valor) {
  return `$${Number(valor).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function pausarVentaActual() {
  if (carritoVentas.length === 0) {
    window.mostrarToast("warning", "Carrito vacío", "No hay items para pausar.");
    return;
  }

  const ventasAbiertas = obtenerVentasAbiertas();
  const clienteSelect = document.getElementById('selector-cliente');
  const clienteId = clienteSelect.value === 'sin-cliente' ? null : parseInt(clienteSelect.value);
  const clienteNombre = clienteId ? 
    clientesDisponibles.find(c => c.id === clienteId)?.nombre || 'Cliente No Registrado' : 
    'Cliente No Registrado';

  const total = carritoVentas.reduce((s, i) => s + i.subtotal, 0);
  
  const nuevaVentaAbierta = {
    id: Date.now(),
    nombre: `Venta ${new Date().toLocaleTimeString()}`,
    clienteId,
    clienteNombre,
    items: [...carritoVentas],
    total,
    metodoPago: document.getElementById('selector-metodo-pago').value || 'No especificado'
  };

  ventasAbiertas.push(nuevaVentaAbierta);
  guardarVentasAbiertas(ventasAbiertas);
  carritoVentas = [];
  renderizarCarrito();
  calcularTotales();
  
  window.mostrarToast("success", "Venta pausada", "La venta se movió a estado de pausa.");
}

function retomarVenta(id) {
  const ventasAbiertas = obtenerVentasAbiertas();
  const index = ventasAbiertas.findIndex(v => String(v.id) === String(id));
  if (index === -1) return;

  const venta = ventasAbiertas.splice(index, 1)[0];
  guardarVentasAbiertas(ventasAbiertas);
  carritoVentas = venta.items;
  
  const clienteSelect = document.getElementById('selector-cliente');
  clienteSelect.value = venta.clienteId || 'sin-cliente';
  
  const metodoPagoSelect = document.getElementById('selector-metodo-pago');
  if (venta.metodoPago && venta.metodoPago !== 'No especificado') {
    metodoPagoSelect.value = venta.metodoPago;
  }
  
  renderizarCarrito();
  calcularTotales();
  
  window.mostrarToast("success", "Venta retomada", "Puedes continuar con la edición.");
}

function confirmarEliminarVentaAbierta(id) {
  if (window.mostrarConfirmacion) {
    window.mostrarConfirmacion("¿Deseas eliminar esta venta en pausa? Esta acción no se puede deshacer.", () => eliminarVentaAbierta(id));
  } else if (confirm("¿Deseas eliminar esta venta en pausa? Esta acción no se puede deshacer.")) {
    eliminarVentaAbierta(id);
  }
}

function eliminarVentaAbierta(id) {
  const ventasAbiertas = obtenerVentasAbiertas();
  const nuevas = ventasAbiertas.filter(v => String(v.id) !== String(id));
  guardarVentasAbiertas(nuevas);
  renderizarCarrito();
  
  window.mostrarToast("success", "Venta eliminada", "La venta en pausa fue eliminada.");
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
              <span style='color:#888'>(${v.clienteNombre} - ${formatearMonedaVentas(Number(v.total) || 0)})</span>
            </span>
            <div style="display:flex; gap:8px; flex-shrink:0;">
              <button onclick="window.retomarVenta(${v.id})" style="background:#8a9b2f; color:white; border:none; padding:5px 14px; border-radius:5px; cursor:pointer; font-weight:600;">Retomar</button>
              <button onclick="window.confirmarEliminarVentaAbierta(${v.id})" style="background:#fee2e2; color:#b91c1c; border:none; padding:5px 14px; border-radius:5px; cursor:pointer; font-weight:700;">Eliminar</button>
            </div>
          </div>
        `).join('')}
      </div>
      <p style="font-size:13px; color:#666; margin-top:10px;">Puedes retomar cualquier venta en pausa o eliminarla si ya no la necesitas.</p>
    </div>
  `;
}

// Formatear moneda
function formatearMoneda(valor) {
  return `$${Number(valor).toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// Extraer número de formato moneda
function extraerNumeroDeMoneda(texto) {
  return parseFloat(texto.replace(/[$\s.]/g, '').replace(',', '.'));
}

// Cargar productos desde la API
async function cargarProductos() {
  try {
    const productos = await window.Backend.get('productos');
    productosDisponibles = Array.isArray(productos) ? productos : [];
    const buscador = document.getElementById('buscar-producto');
    if (buscador && buscador.value.trim()) {
      filtrarProductos();
    } else {
      renderizarProductos(productosDisponibles);
    }
  } catch (error) {
    console.error('Error al cargar productos:', error);
    window.mostrarToast('error', 'Error', 'Error al cargar los productos');
  }
}

// Cargar clientes desde la API
async function cargarClientes() {
  try {
    const clientes = await window.Backend.get('clientes');
    clientesDisponibles = Array.isArray(clientes) ? clientes : [];
    poblarSelectorClientes();
  } catch (error) {
    console.error('Error al cargar clientes:', error);
  }
}

// Poblar selector de clientes
function poblarSelectorClientes() {
  const selector = document.getElementById('selector-cliente');
  const valorActual = selector.value || 'sin-cliente';
  selector.innerHTML = '<option value="sin-cliente">Cliente No Registrado</option>';

  clientesDisponibles.forEach(cliente => {
    const option = document.createElement('option');
    option.value = cliente.id;
    option.textContent = cliente.nombre;
    selector.appendChild(option);
  });

  selector.value = clientesDisponibles.some((cliente) => String(cliente.id) === String(valorActual))
    ? valorActual
    : 'sin-cliente';
}

// Renderizar productos
function renderizarProductos(productos = productosDisponibles) {
  const contenedor = document.getElementById('lista-productos');
  contenedor.innerHTML = '';

  if (!productos || productos.length === 0) {
    contenedor.innerHTML = '<p style="text-align: center; color: #999; padding: 20px;">No hay productos disponibles</p>';
    return;
  }

  productos.forEach(producto => {
    const card = document.createElement('div');
    card.className = 'producto-card';
    card.innerHTML = `
      <div class="producto-info">
        <h3>${producto.nombre}</h3>
        <p class="producto-precio">${formatearMoneda(producto.precio)}</p>
        <p class="producto-stock">Stock: ${producto.stock}</p>
      </div>
      <button class="btn-agregar-producto" data-id="${producto.id}" data-nombre="${producto.nombre}" data-precio="${producto.precio}" data-stock="${producto.stock}" data-seguimiento="${producto.seguimientoInventario}">
        Agregar
      </button>
    `;
    contenedor.appendChild(card);
  });

  // Asignar eventos a botones
  document.querySelectorAll('.btn-agregar-producto').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = parseInt(e.target.dataset.id);
      const nombre = e.target.dataset.nombre;
      const precio = parseFloat(e.target.dataset.precio);
      const stock = parseInt(e.target.dataset.stock);
      const seguimiento = e.target.dataset.seguimiento === 'true';

      productoModalActual = { id, nombre, precio, stock, seguimiento };
      abrirModalCantidad();
    });
  });
}

// Abrir modal de cantidad
function abrirModalCantidad() {
  const modal = document.getElementById('modal-cantidad');
  document.getElementById('modal-producto-nombre').textContent = productoModalActual.nombre;
  document.getElementById('modal-cantidad-input').value = '1';
  document.getElementById('modal-cantidad-input').focus();
  document.getElementById('modal-stock-info').textContent = `Stock disponible: ${productoModalActual.stock}`;
  modal.style.display = 'flex';
}

// Cerrar modal de cantidad
function cerrarModalCantidad() {
  document.getElementById('modal-cantidad').style.display = 'none';
  productoModalActual = null;
}

// Agregar del modal
function agregarDelModal() {
  const cantidad = parseInt(document.getElementById('modal-cantidad-input').value);

  if (isNaN(cantidad) || cantidad < 1) {
    window.mostrarToast('warning', 'Cantidad inválida', 'Ingresa una cantidad válida');
    return;
  }

  if (productoModalActual.seguimiento && cantidad > productoModalActual.stock) {
    window.mostrarToast('warning', 'Stock insuficiente', `Stock insuficiente. Disponible: ${productoModalActual.stock}`);
    return;
  }

  agregarAlCarrito(productoModalActual.id, productoModalActual.nombre, cantidad, productoModalActual.precio, productoModalActual.stock, productoModalActual.seguimiento);
  cerrarModalCantidad();
}

// Agregar al carrito
function agregarAlCarrito(productoId, nombre, cantidad, precio, stock, seguimiento) {
  const itemExistente = carritoVentas.find(item => item.productoId === productoId);

  if (itemExistente) {
    const nuevaCantidad = itemExistente.cantidad + cantidad;
    if (seguimiento && nuevaCantidad > stock) {
      window.mostrarToast('warning', 'Stock insuficiente', `Stock insuficiente. Disponible: ${stock}`);
      return;
    }
    itemExistente.cantidad = nuevaCantidad;
    itemExistente.subtotal = nuevaCantidad * precio;
  } else {
    carritoVentas.push({
      productoId,
      nombre,
      cantidad,
      precioUnitario: precio,
      subtotal: cantidad * precio,
      stock,
      seguimiento
    });
  }

  renderizarCarrito();
  calcularTotales();
}

// Renderizar carrito
function renderizarCarrito() {
  const tbody = document.getElementById('tabla-carrito-body');
  const sinItems = document.getElementById('sin-items');
  const ventasAbiertas = obtenerVentasAbiertas();

  if (carritoVentas.length === 0) {
    tbody.innerHTML = '<tr id="sin-items" class="fila-sin-items"><td colspan="5" style="text-align: center; padding: 20px; color: #999;">El carrito está vacío</td></tr>';
    document.getElementById('btn-finalizar-venta').disabled = true;
    
    // Mostrar ventas pausadas incluso si el carrito está vacío
    const panelCarrito = document.querySelector('.panel-carrito');
    if (panelCarrito) {
      const ventasSection = panelCarrito.querySelector('.ventas-abiertas-seccion');
      if (ventasSection) ventasSection.remove();
      panelCarrito.insertAdjacentHTML('beforeend', renderVentasAbiertasSection(ventasAbiertas));
    }
    return;
  }

  tbody.innerHTML = '';
  carritoVentas.forEach((item, idx) => {
    const fila = document.createElement('tr');
    fila.innerHTML = `
      <td>${item.nombre}</td>
      <td>
        <input type="number" class="input-cantidad-carrito" value="${item.cantidad}" min="1" data-idx="${idx}" onchange="modificarCantidad(${idx}, this.value)">
      </td>
      <td>${formatearMoneda(item.precioUnitario)}</td>
      <td>${formatearMoneda(item.subtotal)}</td>
      <td>
        <button class="btn-eliminar-item" onclick="eliminarDelCarrito(${idx})">✕</button>
      </td>
    `;
    tbody.appendChild(fila);
  });

  document.getElementById('btn-finalizar-venta').disabled = false;
  
  // Actualizar sección de ventas pausadas
  const panelCarrito = document.querySelector('.panel-carrito');
  if (panelCarrito) {
    const ventasSection = panelCarrito.querySelector('.ventas-abiertas-seccion');
    if (ventasSection) ventasSection.remove();
    if (ventasAbiertas.length > 0) {
      panelCarrito.insertAdjacentHTML('beforeend', renderVentasAbiertasSection(ventasAbiertas));
    }
  }
}

// Modificar cantidad en carrito
function modificarCantidad(idx, nuevaCantidad) {
  const cantidad = parseInt(nuevaCantidad);

  if (isNaN(cantidad) || cantidad < 1) {
    window.mostrarToast('warning', 'Cantidad inválida', 'Ingresa una cantidad válida');
    renderizarCarrito();
    return;
  }

  const item = carritoVentas[idx];
  if (item.seguimiento && cantidad > item.stock) {
    window.mostrarToast('warning', 'Stock insuficiente', `Stock insuficiente para ${item.nombre}. Disponible: ${item.stock}`);
    renderizarCarrito();
    return;
  }

  item.cantidad = cantidad;
  item.subtotal = cantidad * item.precioUnitario;
  renderizarCarrito();
  calcularTotales();
}

// Eliminar del carrito
function eliminarDelCarrito(idx) {
  carritoVentas.splice(idx, 1);
  renderizarCarrito();
  calcularTotales();
}

// Calcular totales
function calcularTotales() {
  const subtotal = carritoVentas.reduce((sum, item) => sum + item.subtotal, 0);
  document.getElementById('subtotal-valor').textContent = formatearMoneda(subtotal);
  document.getElementById('total-valor').textContent = formatearMoneda(subtotal);
}

// Vaciar carrito
function vaciarCarrito() {
  if (carritoVentas.length === 0) {
    window.mostrarToast('info', 'Carrito vacío', 'El carrito ya está vacío');
    return;
  }

  if (confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
    carritoVentas = [];
    renderizarCarrito();
    calcularTotales();
  }
}

// Finalizar venta
async function finalizarVenta() {
  if (carritoVentas.length === 0) {
    window.mostrarToast('warning', 'Carrito vacío', 'El carrito está vacío');
    return;
  }

  const clienteSelect = document.getElementById('selector-cliente');
  const metodoPagoSelect = document.getElementById('selector-metodo-pago');

  const clienteId = clienteSelect.value === 'sin-cliente' ? null : parseInt(clienteSelect.value);
  const metodoPago = metodoPagoSelect.value;

  if (!metodoPago) {
    window.mostrarToast('warning', 'Método de pago', 'Selecciona un método de pago');
    return;
  }

  const total = extraerNumeroDeMoneda(document.getElementById('total-valor').textContent);

  // Mostrar modal de confirmación
  const totalItems = carritoVentas.reduce((sum, item) => sum + item.cantidad, 0);
  const resumenProductos = carritoVentas.map(item => `${item.cantidad}x ${item.nombre}`).join(', ');
  document.getElementById('confirmacion-mensaje').innerHTML = `
    <strong>Resumen de Venta:</strong><br>
    ${resumenProductos}<br><br>
    <strong>Cliente:</strong> ${clienteId ? clientesDisponibles.find(c => c.id === clienteId)?.nombre || 'No especificado' : 'Cliente No Registrado'}<br>
    <strong>Método de Pago:</strong> ${metodoPago}<br>
    <strong>Total:</strong> ${formatearMoneda(total)}<br><br>
    ¿Confirmar esta venta?
  `;
  document.getElementById('modal-confirmacion').style.display = 'flex';
}

// Cerrar modal de confirmación
function cerrarModalConfirmacion() {
  document.getElementById('modal-confirmacion').style.display = 'none';
}

// Confirmar y guardar venta
async function confirmarFinalizarVenta() {
  cerrarModalConfirmacion();

  const clienteSelect = document.getElementById('selector-cliente');
  const metodoPagoSelect = document.getElementById('selector-metodo-pago');

  const clienteId = clienteSelect.value === 'sin-cliente' ? null : parseInt(clienteSelect.value);
  const metodoPago = metodoPagoSelect.value;
  const total = extraerNumeroDeMoneda(document.getElementById('total-valor').textContent);

  try {
    // Crear la venta
    const ventaData = {
      fecha: new Date().toISOString(),
      clienteId,
      usuarioId: null, // Podrías obtenerlo de la sesión
      metodoPago,
      total,
      items: carritoVentas
    };

    const ventaCreada = await window.Backend.post('ventas', ventaData);
    const ventaId = ventaCreada.id;

    // Crear detalles de venta y actualizar stock
    for (const item of carritoVentas) {
      // Crear detalle de venta
      const detalleData = {
        ventaId,
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal
      };
      await window.Backend.post('detalle_ventas', detalleData);

      // Actualizar stock del producto
      const productoActual = productosDisponibles.find(p => p.id === item.productoId);
      if (productoActual && item.seguimiento) {
        const nuevoStock = productoActual.stock - item.cantidad;
        await window.Backend.put(`productos/${item.productoId}`, { stock: nuevoStock });
        productoActual.stock = nuevoStock;
      }
    }

    window.mostrarToast('success', 'Venta completada', '¡Venta registrada exitosamente!');

    // Redirigir a factura
    setTimeout(() => {
      window.location.href = `factura.html?id=${ventaId}`;
    }, 1500);

  } catch (error) {
    console.error('Error al finalizar venta:', error);
    window.mostrarToast('error', 'Error', 'Error al registrar la venta: ' + (error.payload?.error || error.message));
  }
}

// Buscar productos
function filtrarProductos() {
  const termino = document.getElementById('buscar-producto').value.toLowerCase();
  const productosFiltrados = productosDisponibles.filter(p =>
    p.nombre.toLowerCase().includes(termino)
  );
  renderizarProductos(productosFiltrados);
}

// Cerrar modal si se hace clic fuera
document.addEventListener('click', (e) => {
  const modalCantidad = document.getElementById('modal-cantidad');
  const modalConfirmacion = document.getElementById('modal-confirmacion');

  if (e.target === modalCantidad) {
    cerrarModalCantidad();
  }
  if (e.target === modalConfirmacion) {
    cerrarModalConfirmacion();
  }
});

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await cargarProductos();
    await cargarClientes();
    renderizarCarrito();

    // Asignar eventos
    document.getElementById('btn-vaciar-carrito').addEventListener('click', vaciarCarrito);
    document.getElementById('btn-pausar-venta').addEventListener('click', pausarVentaActual);
    document.getElementById('btn-finalizar-venta').addEventListener('click', finalizarVenta);
    document.getElementById('buscar-producto').addEventListener('input', filtrarProductos);

    setInterval(() => {
      Promise.all([cargarProductos(), cargarClientes()]).catch((error) => {
        console.error('Error sincronizando ventas automaticamente:', error);
      });
    }, VENTAS_SYNC_INTERVAL_MS);

    // Permitir Enter en modal
    document.getElementById('modal-cantidad-input').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') agregarDelModal();
    });

  } catch (error) {
    console.error('Error en inicialización:', error);
  }
});

// Exportar funciones globales para acceso desde HTML
window.cerrarModalCantidad = cerrarModalCantidad;
window.agregarDelModal = agregarDelModal;
window.cerrarModalConfirmacion = cerrarModalConfirmacion;
window.confirmarFinalizarVenta = confirmarFinalizarVenta;
window.modificarCantidad = modificarCantidad;
window.eliminarDelCarrito = eliminarDelCarrito;
window.pausarVentaActual = pausarVentaActual;
window.retomarVenta = retomarVenta;
window.confirmarEliminarVentaAbierta = confirmarEliminarVentaAbierta;
window.eliminarVentaAbierta = eliminarVentaAbierta;
