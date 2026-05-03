// carritopage/admin-dashboard.js
// Lógica de navegación SPA y CRUD del dashboard

let clienteEnEdicion = null;
let proveedorEnEdicion = null;
let categoriaEnEdicion = null;

// ======= NAVEGACIÓN SPA =======
document.addEventListener("DOMContentLoaded", () => {
    activarNavegacion();
    cargarDashboard();
    
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
    switch(view) {
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
                        <button class="btn-warning" onclick="editarProducto(${prod.id})">✏️ Editar</button>
                        <button class="btn-danger" onclick="eliminarProducto(${prod.id})">🗑️ Eliminar</button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function editarProducto(id) {
    // TODO: Implementar modal de edición de producto
    alert('Función de edición de productos próximamente');
}

function eliminarProducto(id) {
    if (confirm('¿Está seguro de que desea eliminar este producto?')) {
        const resultado = window.eliminarProducto?.(id);
        if (resultado?.ok) {
            cargarProductos();
        }
    }
}

function abrirModalProducto() {
    alert('Función de crear producto próximamente');
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
                        <button class="btn-warning" onclick="editarVentaAbierta('${venta.id}')">✏️ Editar</button>
                        <button class="btn-danger" onclick="eliminarVentaAbierta('${venta.id}')">🗑️ Eliminar</button>
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

function editarVentaAbierta(ventaId) {
    const venta = window.obtenerVentaAbierta?.(ventaId);
    if (venta) {
        // Guardar ID en sessionStorage y redirigir a carrito
        sessionStorage.setItem('ventaEnEdicion', ventaId);
        window.location.href = 'carrito.html?venta=' + ventaId;
    }
}

function eliminarVentaAbierta(ventaId) {
    if (confirm('¿Desea eliminar esta venta abierta? Se perderán todos los datos.')) {
        window.eliminarVentaAbierta?.(ventaId);
        cargarVentasAbiertas();
    }
}

function abrirModalCompra() {
    alert('Función de registrar compra próximamente');
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
                <td>${compra.proveedor || '-'}</td>
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
    } catch (error) {
        alert('❌ ' + error.message);
    }
}

function eliminarCliente(id) {
    if (confirm('¿Desea eliminar este cliente?')) {
        try {
            window.AdminCRUD?.eliminarCliente?.(id);
        } catch (error) {
            alert('❌ ' + error.message);
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
    } catch (error) {
        alert('❌ ' + error.message);
    }
}

function eliminarProveedor(id) {
    if (confirm('¿Desea eliminar este proveedor?')) {
        try {
            window.AdminCRUD?.eliminarProveedor?.(id);
        } catch (error) {
            alert('❌ ' + error.message);
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
    } catch (error) {
        alert('❌ ' + error.message);
    }
}

function eliminarCategoria(id) {
    if (confirm('¿Desea eliminar esta categoría?')) {
        try {
            window.AdminCRUD?.eliminarCategoria?.(id);
        } catch (error) {
            alert('❌ ' + error.message);
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
