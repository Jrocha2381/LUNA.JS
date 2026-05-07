// carritopage/ventas.js

let carritoVentas = []; // Array de {productoId, nombre, cantidad, precioUnitario, subtotal, stock, seguimientoInventario}
let productosDisponibles = [];
let clientesDisponibles = [];
let productoModalActual = null;

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
    renderizarProductos(productosDisponibles);
  } catch (error) {
    console.error('Error al cargar productos:', error);
    alert('Error al cargar los productos');
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
  const opciones = selector.innerHTML;

  clientesDisponibles.forEach(cliente => {
    const option = document.createElement('option');
    option.value = cliente.id;
    option.textContent = cliente.nombre;
    selector.appendChild(option);
  });
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
    alert('Ingresa una cantidad válida');
    return;
  }

  if (productoModalActual.seguimiento && cantidad > productoModalActual.stock) {
    alert(`Stock insuficiente. Disponible: ${productoModalActual.stock}`);
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
      alert(`Stock insuficiente. Disponible: ${stock}`);
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

  if (carritoVentas.length === 0) {
    tbody.innerHTML = '<tr id="sin-items" class="fila-sin-items"><td colspan="5" style="text-align: center; padding: 20px; color: #999;">El carrito está vacío</td></tr>';
    document.getElementById('btn-finalizar-venta').disabled = true;
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
}

// Modificar cantidad en carrito
function modificarCantidad(idx, nuevaCantidad) {
  const cantidad = parseInt(nuevaCantidad);

  if (isNaN(cantidad) || cantidad < 1) {
    alert('Ingresa una cantidad válida');
    renderizarCarrito();
    return;
  }

  const item = carritoVentas[idx];
  if (item.seguimiento && cantidad > item.stock) {
    alert(`Stock insuficiente para ${item.nombre}. Disponible: ${item.stock}`);
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
    alert('El carrito ya está vacío');
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
    alert('El carrito está vacío');
    return;
  }

  const clienteSelect = document.getElementById('selector-cliente');
  const metodoPagoSelect = document.getElementById('selector-metodo-pago');

  const clienteId = clienteSelect.value === 'sin-cliente' ? null : parseInt(clienteSelect.value);
  const metodoPago = metodoPagoSelect.value;

  if (!metodoPago) {
    alert('Selecciona un método de pago');
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

    alert('¡Venta registrada exitosamente!');

    // Redirigir a factura
    window.location.href = `factura.html?id=${ventaId}`;

  } catch (error) {
    console.error('Error al finalizar venta:', error);
    alert('Error al registrar la venta: ' + (error.payload?.error || error.message));
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

    // Asignar eventos
    document.getElementById('btn-vaciar-carrito').addEventListener('click', vaciarCarrito);
    document.getElementById('btn-finalizar-venta').addEventListener('click', finalizarVenta);
    document.getElementById('buscar-producto').addEventListener('input', filtrarProductos);

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
