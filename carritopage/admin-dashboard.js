// carritopage/admin-dashboard.js
// Lógica de navegación SPA y CRUD del dashboard

let clienteEnEdicion = null;
let proveedorEnEdicion = null;
let categoriaEnEdicion = null;
let itemsCompraTemp = [];

// ======= NAVEGACIÓN SPA =======
document.addEventListener("DOMContentLoaded", () => {
    activarNavegacion();
    cargarDashboard();

    // Vincular funciones para que el editor de flujo pueda refrescar esta tabla
    window.renderizarProductos = cargarProductos;
    window.renderCarrito = cargarProductos;

    // Recargar datos cuando cambian
    window.addEventListener("clienteCreado", () => recargarVista('clientes'));
    window.addEventListener("clienteActualizado", () => recargarVista('clientes'));
    window.addEventListener("clienteEliminado", () => recargarVista('clientes'));

    window.addEventListener("proveedorCreado", () => recargarVista('proveedores'));
    window.addEventListener("proveedorActualizado", () => recargarVista('proveedores'));
    window.addEventListener("proveedorEliminado", () => recargarVista('proveedores'));

    window.addEventListener("categoriaCreada", () => recargarVista('categorias'));
    window.addEventListener("categoriaActualizada", () => recargarVista('categorias'));
    window.addEventListener("categoriaEliminada", () => recargarVista('categorias'));

    // Escuchar cambios globales en productos para actualizar la vista
    window.addEventListener("productosActualizados", () => {
        recargarVista('productos');
        cargarDashboard();
    });
});

function activarNavegacion() {
    const botones = document.querySelectorAll('.nav-btn');
    botones.forEach(boton => {
        boton.addEventListener('click', (e) => {
            const view = e.target.dataset.view;
            mostrarVista(view);

            // Marcar como activo
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');

            // Cargar datos de la vista
            cargarVista(view);
        });
    });
}

function mostrarVista(view) {
    // Ocultar todas las vistas
    document.querySelectorAll('.admin-view').forEach(v => v.classList.remove('active'));

    // Mostrar la vista seleccionada
    const vista = document.getElementById(view);
    if (vista) {
        vista.classList.add('active');
    }
}

function cargarVista(view) {
    switch (view) {
        case 'dashboard':
            cargarDashboard();
            break;
        case 'productos':
            cargarProductos();
            break;
        case 'ventas-abiertas':
            cargarVentasAbiertas();
            break;
        case 'compras':
            cargarCompras();
            break;
        case 'clientes':
            cargarClientes();
            break;
        case 'proveedores':
            cargarProveedores();
            break;
        case 'categorias':
            cargarCategorias();
            break;
    }
}

function recargarVista(view) {
    const vistaActiva = document.querySelector('.admin-view.active')?.id;
    if (vistaActiva === view) {
        cargarVista(view);
    }
}

// ======= DASHBOARD =======
function cargarDashboard() {
    const productos = window.obtenerProductos?.() || [];
    const ventasAbiertas = window.obtenerVentasAbiertas?.() || [];
    const clientes = window.AdminCRUD?.listarClientes?.() || [];

    document.getElementById('stat-productos').textContent = productos.length;
    document.getElementById('stat-ventas').textContent = ventasAbiertas.length;
    document.getElementById('stat-clientes').textContent = clientes.length;
}

// ======= PRODUCTOS =======
function cargarProductos() {
    const productos = window.obtenerProductos?.() || [];
    const tabla = document.getElementById('tabla-productos');
    tabla.innerHTML = '';

    productos.forEach(prod => {
        tabla.innerHTML += `
            <tr>
                <td>${prod.id}</td>
                <td>${prod.nombre}</td>
                <td>${prod.categoria}</td>
                <td>$${(prod.precioVenta || 0).toLocaleString()}</td>
                <td>${prod.stock || 0}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-warning" onclick="uiEditarProducto(${prod.id})">✏️ Editar</button>
                        <button class="btn-danger" onclick="uiEliminarProducto(${prod.id})">🗑️ Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function uiEditarProducto(id) {
    if (window.abrirEditorFlujo) {
        window.abrirEditorFlujo(id);
    } else {
        if (window.mostrarToast) {
            window.mostrarToast("error", "Error", "El módulo de edición no se encuentra cargado.");
        } else {
            alert('Error: No se pudo abrir el editor.');
        }
    }
}

function uiEliminarProducto(id) {
    const ejecutarEliminacion = () => {
        const resultado = window.eliminarProducto?.(id);
        if (resultado?.ok) {
            if (window.mostrarToast) {
                window.mostrarToast("success", "Éxito", "Producto eliminado correctamente.");
            }
            cargarProductos();
            cargarDashboard();
        } else {
            const msg = resultado?.errores?.join(" ") || "No se pudo eliminar el producto.";
            if (window.mostrarToast) window.mostrarToast("error", "Error", msg);
            else alert(msg);
        }
    };

    if (window.mostrarConfirmacion) {
        window.mostrarConfirmacion("¿Estás seguro de que deseas eliminar este producto permanentemente?", ejecutarEliminacion);
    } else if (confirm('¿Está seguro de que desea eliminar este producto?')) {
        ejecutarEliminacion();
    }
}

function abrirModalProducto() {
    if (window.mostrarToast) {
        window.mostrarToast("info", "Próximamente", "La creación de nuevos productos desde este panel se habilitará en la siguiente actualización.");
    } else {
        alert('Función de crear producto próximamente');
    }
}

// ======= VENTAS ABIERTAS =======
function cargarVentasAbiertas() {
    const ventas = window.obtenerVentasAbiertas?.() || [];
    const tabla = document.getElementById('tabla-ventas-abiertas');
    tabla.innerHTML = '';

    ventas.forEach(venta => {
        const total = window.calcularTotalVenta?.(venta) || 0;
        tabla.innerHTML += `
            <tr>
                <td><strong>${venta.id}</strong></td>
                <td>${venta.creada}</td>
                <td>${venta.items?.length || 0}</td>
                <td>$${total.toLocaleString('es-CO')}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-warning" onclick="uiEditarVentaAbierta('${venta.id}')">✏️ Editar</button>
                        <button class="btn-danger" onclick="uiEliminarVentaAbierta('${venta.id}')">🗑️ Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
    });

    if (ventas.length === 0) {
        tabla.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay ventas abiertas</td></tr>';
    }
}

function crearNuevaVenta() {
    const venta = window.crearVentaAbierta?.();
    if (venta) {
        alert(`✅ Venta creada: ${venta.id}\nAhora puede agregar productos desde el carrito.`);
        cargarVentasAbiertas();
    }
}

function uiEditarVentaAbierta(ventaId) {
    const venta = window.obtenerVentaAbierta?.(ventaId);
    if (venta) {
        // Guardar ID en sessionStorage y redirigir a carrito
        sessionStorage.setItem('ventaEnEdicion', ventaId);
        window.location.href = 'carrito.html?venta=' + ventaId;
    }
}

function uiEliminarVentaAbierta(ventaId) {
    if (confirm('¿Desea eliminar esta venta abierta? Se perderán todos los datos.')) {
        window.eliminarVentaAbierta?.(ventaId);
        cargarVentasAbiertas();
    }
}

function abrirModalCompra() {
    itemsCompraTemp = [];
    actualizarTablaItemsCompra();

    const selectProv = document.getElementById('input-compra-proveedor');
    const selectProd = document.getElementById('input-compra-producto');

    if (!selectProv || !selectProd) return;

    // Poblar proveedores
    const proveedores = window.AdminCRUD?.listarProveedores() || [];
    selectProv.innerHTML = '<option value="">Seleccione un proveedor...</option>';
    proveedores.forEach(p => {
        selectProv.innerHTML += `<option value="${p.id}">${p.nombre}</option>`;
    });

    // Poblar productos
    const productos = window.obtenerProductos() || [];
    selectProd.innerHTML = '<option value="">Seleccione un producto...</option>';
    productos.forEach(p => {
        selectProd.innerHTML += `<option value="${p.id}" data-costo="${p.costo || 0}">${p.nombre}</option>`;
    });

    // Sugerir costo automáticamente al seleccionar producto
    selectProd.onchange = (e) => {
        const opt = e.target.selectedOptions[0];
        document.getElementById('input-compra-costo').value = opt ? opt.dataset.costo : 0;
    };

    abrirModal('modal-compra');
}

function agregarItemACompra() {
    const selectProd = document.getElementById('input-compra-producto');
    const inputCant = document.getElementById('input-compra-cantidad');
    const inputCosto = document.getElementById('input-compra-costo');

    const id = selectProd.value;
    const nombre = selectProd.selectedOptions[0]?.text;
    const cantidad = parseInt(inputCant.value);
    const costo = parseFloat(inputCosto.value);

    if (!id || cantidad <= 0 || isNaN(costo)) {
        if (window.mostrarToast) window.mostrarToast("error", "Error", "Seleccione un producto y cantidad válida.");
        return;
    }

    const existente = itemsCompraTemp.find(it => String(it.id) === String(id));
    if (existente) {
        existente.cantidad += cantidad;
        existente.costo = costo;
    } else {
        itemsCompraTemp.push({ id, nombre, cantidad, costo });
    }

    // Resetear campos para el siguiente item
    selectProd.value = "";
    inputCant.value = 1;
    inputCosto.value = 0;

    actualizarTablaItemsCompra();
}

function eliminarItemDeCompra(index) {
    itemsCompraTemp.splice(index, 1);
    actualizarTablaItemsCompra();
}

function actualizarTablaItemsCompra() {
    const tabla = document.getElementById('tabla-items-compra');
    const totalEl = document.getElementById('total-compra-modal');
    const btnGuardar = document.getElementById('btn-guardar-compra');

    if (!tabla || !totalEl || !btnGuardar) return;

    tabla.innerHTML = '';
    let total = 0;

    itemsCompraTemp.forEach((item, index) => {
        const subtotal = item.cantidad * item.costo;
        total += subtotal;
        tabla.innerHTML += `
            <tr>
                <td>${item.nombre}</td>
                <td>${item.cantidad}</td>
                <td>$${item.costo.toLocaleString()}</td>
                <td>$${subtotal.toLocaleString()}</td>
                <td style="text-align: right;">
                    <button type="button" class="btn-danger" style="padding: 2px 8px;" onclick="eliminarItemDeCompra(${index})">✕</button>
                </td>
            </tr>
        `;
    });

    if (itemsCompraTemp.length === 0) {
        tabla.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #999; padding: 20px;">No hay items agregados</td></tr>';
    }

    totalEl.textContent = `$${total.toLocaleString()}`;
    btnGuardar.disabled = itemsCompraTemp.length === 0;
}

async function guardarCompra(event) {
    event.preventDefault();
    const proveedorId = document.getElementById('input-compra-proveedor').value;

    try {
        const res = await window.registrarCompra(itemsCompraTemp, proveedorId);
        if (res) {
            cerrarModal('modal-compra');
            if (window.mostrarToast) window.mostrarToast("success", "Compras", "Compra registrada e inventario actualizado con éxito.");
            cargarVista('compras');
            cargarDashboard();
        }
    } catch (error) {
        if (window.mostrarToast) window.mostrarToast("error", "Error", error.message);
        else alert('❌ ' + error.message);
    }
}

// ======= COMPRAS =======
function cargarCompras() {
    const compras = JSON.parse(localStorage.getItem('compras') || '[]');
    const tabla = document.getElementById('tabla-compras');
    tabla.innerHTML = '';

    compras.forEach(compra => {
        const items = JSON.parse(compra.itemsJson || '[]');
        tabla.innerHTML += `
            <tr>
                <td><strong>${compra.id}</strong></td>
                <td>${compra.fecha}</td>
                <td>${compra.proveedorNombre || '-'}</td>
                <td>${items.length}</td>
                <td>$${(compra.total || 0).toLocaleString('es-CO')}</td>
            </tr>
        `;
    });

    if (compras.length === 0) {
        tabla.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay compras registradas</td></tr>';
    }
}

// ======= CLIENTES =======
function cargarClientes() {
    const clientes = window.AdminCRUD?.listarClientes?.() || [];
    const tabla = document.getElementById('tabla-clientes');
    tabla.innerHTML = '';

    clientes.forEach(cliente => {
        tabla.innerHTML += `
            <tr>
                <td>${cliente.id}</td>
                <td>${cliente.nombre}</td>
                <td>${cliente.telefono || '-'}</td>
                <td>${cliente.email || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-warning" onclick="abrirModalCliente('${cliente.id}')">✏️ Editar</button>
                        <button class="btn-danger" onclick="eliminarCliente('${cliente.id}')">🗑️ Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
    });

    if (clientes.length === 0) {
        tabla.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay clientes registrados</td></tr>';
    }
}

function buscarClientes() {
    const termino = document.getElementById('input-buscar-cliente').value;
    if (!termino.trim()) {
        cargarClientes();
        return;
    }

    const resultados = window.AdminCRUD?.buscarClientes?.(termino) || [];
    const tabla = document.getElementById('tabla-clientes');
    tabla.innerHTML = '';

    resultados.forEach(cliente => {
        tabla.innerHTML += `
            <tr>
                <td>${cliente.id}</td>
                <td>${cliente.nombre}</td>
                <td>${cliente.telefono || '-'}</td>
                <td>${cliente.email || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-warning" onclick="abrirModalCliente('${cliente.id}')">✏️ Editar</button>
                        <button class="btn-danger" onclick="eliminarCliente('${cliente.id}')">🗑️ Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function abrirModalCliente(id = null) {
    clienteEnEdicion = id;
    const modal = document.getElementById('modal-cliente');
    const titulo = document.getElementById('modal-cliente-titulo');

    if (id) {
        const cliente = window.AdminCRUD?.listarClientes?.().find(c => c.id === id);
        if (cliente) {
            titulo.textContent = 'Editar Cliente';
            document.getElementById('input-cliente-nombre').value = cliente.nombre;
            document.getElementById('input-cliente-telefono').value = cliente.telefono || '';
            document.getElementById('input-cliente-email').value = cliente.email || '';
        }
    } else {
        titulo.textContent = 'Nuevo Cliente';
        document.getElementById('input-cliente-nombre').value = '';
        document.getElementById('input-cliente-telefono').value = '';
        document.getElementById('input-cliente-email').value = '';
    }

    modal.classList.add('active');
}

function guardarCliente(event) {
    event.preventDefault();

    const datos = {
        nombre: document.getElementById('input-cliente-nombre').value,
        telefono: document.getElementById('input-cliente-telefono').value,
        email: document.getElementById('input-cliente-email').value
    };

    try {
        if (clienteEnEdicion) {
            window.AdminCRUD?.actualizarCliente?.(clienteEnEdicion, datos);
        } else {
            window.AdminCRUD?.crearCliente?.(datos);
        }
        cerrarModal('modal-cliente');
        if (window.mostrarToast) window.mostrarToast("success", "Clientes", "Datos guardados correctamente.");
    } catch (error) {
        if (window.mostrarToast) window.mostrarToast("error", "Error", error.message);
        else alert('❌ ' + error.message);
    }
}

function eliminarCliente(id) {
    if (confirm('¿Desea eliminar este cliente?')) {
        try {
            window.AdminCRUD?.eliminarCliente?.(id);
            if (window.mostrarToast) window.mostrarToast("success", "Clientes", "Cliente eliminado.");
        } catch (error) {
            if (window.mostrarToast) window.mostrarToast("error", "Error", error.message);
            else alert('❌ ' + error.message);
        }
    }
}

// ======= PROVEEDORES =======
function cargarProveedores() {
    const proveedores = window.AdminCRUD?.listarProveedores?.() || [];
    const tabla = document.getElementById('tabla-proveedores');
    tabla.innerHTML = '';

    proveedores.forEach(proveedor => {
        tabla.innerHTML += `
            <tr>
                <td>${proveedor.id}</td>
                <td>${proveedor.nombre}</td>
                <td>${proveedor.contacto || '-'}</td>
                <td>${proveedor.telefono || '-'}</td>
                <td>${proveedor.email || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-warning" onclick="abrirModalProveedor('${proveedor.id}')">✏️ Editar</button>
                        <button class="btn-danger" onclick="eliminarProveedor('${proveedor.id}')">🗑️ Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
    });

    if (proveedores.length === 0) {
        tabla.innerHTML = '<tr><td colspan="6" style="text-align: center;">No hay proveedores registrados</td></tr>';
    }
}

function buscarProveedores() {
    const termino = document.getElementById('input-buscar-proveedor').value;
    if (!termino.trim()) {
        cargarProveedores();
        return;
    }

    const resultados = window.AdminCRUD?.buscarProveedores?.(termino) || [];
    const tabla = document.getElementById('tabla-proveedores');
    tabla.innerHTML = '';

    resultados.forEach(proveedor => {
        tabla.innerHTML += `
            <tr>
                <td>${proveedor.id}</td>
                <td>${proveedor.nombre}</td>
                <td>${proveedor.contacto || '-'}</td>
                <td>${proveedor.telefono || '-'}</td>
                <td>${proveedor.email || '-'}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-warning" onclick="abrirModalProveedor('${proveedor.id}')">✏️ Editar</button>
                        <button class="btn-danger" onclick="eliminarProveedor('${proveedor.id}')">🗑️ Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function abrirModalProveedor(id = null) {
    proveedorEnEdicion = id;
    const modal = document.getElementById('modal-proveedor');
    const titulo = document.getElementById('modal-proveedor-titulo');

    if (id) {
        const proveedor = window.AdminCRUD?.listarProveedores?.().find(p => p.id === id);
        if (proveedor) {
            titulo.textContent = 'Editar Proveedor';
            document.getElementById('input-proveedor-nombre').value = proveedor.nombre;
            document.getElementById('input-proveedor-contacto').value = proveedor.contacto || '';
            document.getElementById('input-proveedor-telefono').value = proveedor.telefono || '';
            document.getElementById('input-proveedor-email').value = proveedor.email || '';
        }
    } else {
        titulo.textContent = 'Nuevo Proveedor';
        document.getElementById('input-proveedor-nombre').value = '';
        document.getElementById('input-proveedor-contacto').value = '';
        document.getElementById('input-proveedor-telefono').value = '';
        document.getElementById('input-proveedor-email').value = '';
    }

    modal.classList.add('active');
}

function guardarProveedor(event) {
    event.preventDefault();

    const datos = {
        nombre: document.getElementById('input-proveedor-nombre').value,
        contacto: document.getElementById('input-proveedor-contacto').value,
        telefono: document.getElementById('input-proveedor-telefono').value,
        email: document.getElementById('input-proveedor-email').value
    };

    try {
        if (proveedorEnEdicion) {
            window.AdminCRUD?.actualizarProveedor?.(proveedorEnEdicion, datos);
        } else {
            window.AdminCRUD?.crearProveedor?.(datos);
        }
        cerrarModal('modal-proveedor');
        if (window.mostrarToast) window.mostrarToast("success", "Proveedores", "Proveedor guardado.");
    } catch (error) {
        if (window.mostrarToast) window.mostrarToast("error", "Error", error.message);
        else alert('❌ ' + error.message);
    }
}

function eliminarProveedor(id) {
    if (confirm('¿Desea eliminar este proveedor?')) {
        try {
            window.AdminCRUD?.eliminarProveedor?.(id);
            if (window.mostrarToast) window.mostrarToast("success", "Proveedores", "Proveedor eliminado.");
        } catch (error) {
            if (window.mostrarToast) window.mostrarToast("error", "Error", error.message);
            else alert('❌ ' + error.message);
        }
    }
}

// ======= CATEGORÍAS =======
function cargarCategorias() {
    const categorias = window.AdminCRUD?.listarCategorias?.() || [];
    const tabla = document.getElementById('tabla-categorias');
    tabla.innerHTML = '';

    categorias.forEach(categoria => {
        tabla.innerHTML += `
            <tr>
                <td>${categoria.id}</td>
                <td>${categoria.nombre}</td>
                <td>
                    <div class="table-actions">
                        <button class="btn-warning" onclick="abrirModalCategoria('${categoria.id}')">✏️ Editar</button>
                        <button class="btn-danger" onclick="eliminarCategoria('${categoria.id}')">🗑️ Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
    });

    if (categorias.length === 0) {
        tabla.innerHTML = '<tr><td colspan="3" style="text-align: center;">No hay categorías registradas</td></tr>';
    }
}

function abrirModalCategoria(id = null) {
    categoriaEnEdicion = id;
    const modal = document.getElementById('modal-categoria');
    const titulo = document.getElementById('modal-categoria-titulo');

    if (id) {
        const categoria = window.AdminCRUD?.listarCategorias?.().find(c => c.id === id);
        if (categoria) {
            titulo.textContent = 'Editar Categoría';
            document.getElementById('input-categoria-nombre').value = categoria.nombre;
        }
    } else {
        titulo.textContent = 'Nueva Categoría';
        document.getElementById('input-categoria-nombre').value = '';
    }

    modal.classList.add('active');
}

function guardarCategoria(event) {
    event.preventDefault();

    const datos = {
        nombre: document.getElementById('input-categoria-nombre').value
    };

    try {
        if (categoriaEnEdicion) {
            window.AdminCRUD?.actualizarCategoria?.(categoriaEnEdicion, datos);
        } else {
            window.AdminCRUD?.crearCategoria?.(datos);
        }
        cerrarModal('modal-categoria');
        if (window.mostrarToast) window.mostrarToast("success", "Categorías", "Categoría guardada.");
    } catch (error) {
        if (window.mostrarToast) window.mostrarToast("error", "Error", error.message);
        else alert('❌ ' + error.message);
    }
}

function eliminarCategoria(id) {
    if (confirm('¿Desea eliminar esta categoría?')) {
        try {
            window.AdminCRUD?.eliminarCategoria?.(id);
            if (window.mostrarToast) window.mostrarToast("success", "Categorías", "Categoría eliminada.");
        } catch (error) {
            if (window.mostrarToast) window.mostrarToast("error", "Error", error.message);
            else alert('❌ ' + error.message);
        }
    }
}

// ======= UTILIDADES =======
function abrirModal(id) {
    document.getElementById(id).classList.add('active');
}

function cerrarModal(id) {
    document.getElementById(id).classList.remove('active');
}

// Cerrar modal al hacer click fuera
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});
