// ============================================
// VARIABLES GLOBALES
// ============================================
let ventasActuales = [];
let ventasEliminadas = [];
let ordenAscendente = true;
let ventaAEliminar = null;
let modo = 'historial'; // 'historial' o 'papelera'

// ============================================
// CARGAR DATOS
// ============================================
function cargarVentas() {
    try {
        const datosGuardados = localStorage.getItem('ventasCompletadas');
        ventasActuales = datosGuardados ? JSON.parse(datosGuardados) : [];
        console.log('Ventas cargadas:', ventasActuales.length);
    } catch (error) {
        console.error('Error al cargar ventas:', error);
        ventasActuales = [];
    }
}

function cargarPapelera() {
    try {
        const datosGuardados = localStorage.getItem('ventasEliminadas');
        ventasEliminadas = datosGuardados ? JSON.parse(datosGuardados) : [];
        console.log('Papelera cargada:', ventasEliminadas.length);
    } catch (error) {
        console.error('Error al cargar papelera:', error);
        ventasEliminadas = [];
    }
}

function guardarDatos() {
    localStorage.setItem('ventasCompletadas', JSON.stringify(ventasActuales));
    localStorage.setItem('ventasEliminadas', JSON.stringify(ventasEliminadas));
    console.log('Datos guardados');
}

// ============================================
// CREAR TARJETAS
// ============================================
function crearTarjetaVenta(venta, esVentaEliminada = false) {
    const fechaFormato = new Date(venta.fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const total = venta.articulos.reduce((sum, art) => sum + (art.precio * art.cantidad), 0);
    const cantidadItems = venta.articulos.reduce((sum, art) => sum + art.cantidad, 0);

    const tarjeta = document.createElement('div');
    tarjeta.className = 'tarjeta-venta';
    tarjeta.dataset.ventaId = venta.id;
    tarjeta.dataset.esEliminada = esVentaEliminada;

    const metodoPago = venta.metodoPago || 'No especificado';
    const estado = esVentaEliminada ? 'En papelera' : 'Completada';

    tarjeta.innerHTML = `
        <div class="tarjeta-contenido">
            <div class="tarjeta-encabezado">
                <h3>Venta #${venta.id}</h3>
                <span class="estado-badge">${estado}</span>
            </div>
            <div class="tarjeta-info">
                <p><strong>Fecha:</strong> ${fechaFormato}</p>
                <p><strong>Artículos:</strong> ${cantidadItems}</p>
                <p><strong>Total:</strong> $${total.toFixed(2)}</p>
                <p><strong>Método de pago:</strong> ${metodoPago}</p>
            </div>
            <div class="tarjeta-acciones">
                <button class="btn-detalles" data-venta-id="${venta.id}">Ver Detalles</button>
                ${!esVentaEliminada ? 
                    `<button class="btn-papelera" data-venta-id="${venta.id}">Enviar a Papelera</button>` :
                    `<button class="btn-recuperar" data-venta-id="${venta.id}">Recuperar</button>
                     <button class="btn-eliminar-def" data-venta-id="${venta.id}">Eliminar Permanentemente</button>`
                }
            </div>
        </div>
    `;

    return tarjeta;
}

// ============================================
// RENDERIZAR HISTORIAL Y PAPELERA
// ============================================
function renderizarHistorial() {
    const contenedor = document.getElementById('contenedor-ventas');
    if (!contenedor) {
        console.error('Contenedor no encontrado');
        return;
    }

    const datos = modo === 'historial' ? ventasActuales : ventasEliminadas;
    
    if (datos.length === 0) {
        contenedor.innerHTML = `<div class="sin-datos"><p>No hay ventas para mostrar</p></div>`;
        return;
    }

    // Ordenar ventas
    const datosOrdenados = [...datos].sort((a, b) => {
        const fechaA = new Date(a.fecha);
        const fechaB = new Date(b.fecha);
        return ordenAscendente ? fechaA - fechaB : fechaB - fechaA;
    });

    contenedor.innerHTML = '';
    datosOrdenados.forEach(venta => {
        const tarjeta = crearTarjetaVenta(venta, modo === 'papelera');
        contenedor.appendChild(tarjeta);
    });

    asignarEventosTarjetas();
}

function filtrarVentas(termino) {
    const contenedor = document.getElementById('contenedor-ventas');
    if (!contenedor) return;

    const datos = modo === 'historial' ? ventasActuales : ventasEliminadas;
    const terminoLower = termino.toLowerCase();

    const datosFiltrados = datos.filter(venta => {
        const id = venta.id.toString();
        const total = venta.articulos.reduce((sum, art) => sum + (art.precio * art.cantidad), 0).toString();
        const metodoPago = (venta.metodoPago || '').toLowerCase();
        
        return id.includes(terminoLower) || 
               total.includes(terminoLower) || 
               metodoPago.includes(terminoLower) ||
               venta.articulos.some(art => art.nombre.toLowerCase().includes(terminoLower));
    });

    contenedor.innerHTML = '';
    datosFiltrados.forEach(venta => {
        const tarjeta = crearTarjetaVenta(venta, modo === 'papelera');
        contenedor.appendChild(tarjeta);
    });

    asignarEventosTarjetas();
}

// ============================================
// ASIGNAR EVENTOS A TARJETAS
// ============================================
function asignarEventosTarjetas() {
    document.querySelectorAll('.btn-detalles').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ventaId = e.target.dataset.ventaId;
            mostrarDetalles(ventaId);
        });
    });

    document.querySelectorAll('.btn-papelera').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ventaId = e.target.dataset.ventaId;
            enviarAPapelera(ventaId);
        });
    });

    document.querySelectorAll('.btn-recuperar').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ventaId = e.target.dataset.ventaId;
            recuperarDePapelera(ventaId);
        });
    });

    document.querySelectorAll('.btn-eliminar-def').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ventaId = e.target.dataset.ventaId;
            eliminarDefinitivamente(ventaId);
        });
    });
}

// ============================================
// MODAL DE DETALLES
// ============================================
function mostrarDetalles(ventaId) {
    const datos = modo === 'historial' ? ventasActuales : ventasEliminadas;
    const venta = datos.find(v => v.id == ventaId);
    
    if (!venta) {
        console.error('Venta no encontrada');
        return;
    }

    const modal = document.getElementById('modal-detalles');
    if (!modal) {
        console.error('Modal no encontrado');
        return;
    }

    const fechaFormato = new Date(venta.fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    let detallesHTML = `
        <h2>Detalles de Venta #${venta.id}</h2>
        <div class="detalles-info">
            <p><strong>Fecha:</strong> ${fechaFormato}</p>
            <p><strong>Método de pago:</strong> ${venta.metodoPago || 'No especificado'}</p>
            <p><strong>Estado:</strong> ${modo === 'papelera' ? 'En papelera' : 'Completada'}</p>
        </div>
        <div class="detalles-articulos">
            <h3>Artículos</h3>
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
    `;

    let totalGeneral = 0;
    venta.articulos.forEach(articulo => {
        const subtotal = articulo.precio * articulo.cantidad;
        totalGeneral += subtotal;
        detallesHTML += `
            <tr>
                <td>${articulo.nombre}</td>
                <td>${articulo.cantidad}</td>
                <td>$${articulo.precio.toFixed(2)}</td>
                <td>$${subtotal.toFixed(2)}</td>
            </tr>
        `;
    });

    detallesHTML += `
                </tbody>
            </table>
            <div class="total-venta">
                <h4>Total: $${totalGeneral.toFixed(2)}</h4>
            </div>
        </div>
    `;

    const contenidoModal = document.querySelector('.modal-contenido');
    if (contenidoModal) {
        contenidoModal.innerHTML = detallesHTML;
    }

    modal.style.display = 'block';
    reasignarEventosModal();
}

function reasignarEventosModal() {
    const modal = document.getElementById('modal-detalles');
    const btnCerrar = document.querySelector('.btn-cerrar');
    
    if (btnCerrar) {
        btnCerrar.onclick = () => {
            modal.style.display = 'none';
        };
    }

    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

// ============================================
// GESTIÓN DE PAPELERA
// ============================================
function enviarAPapelera(ventaId) {
    const index = ventasActuales.findIndex(v => v.id == ventaId);
    if (index !== -1) {
        const venta = ventasActuales.splice(index, 1)[0];
        ventasEliminadas.push(venta);
        guardarDatos();
        console.log(`Venta #${ventaId} enviada a papelera`);
        
        if (modo === 'historial') {
            renderizarHistorial();
        }
    }
}

function recuperarDePapelera(ventaId) {
    const index = ventasEliminadas.findIndex(v => v.id == ventaId);
    if (index !== -1) {
        const venta = ventasEliminadas.splice(index, 1)[0];
        ventasActuales.push(venta);
        guardarDatos();
        console.log(`Venta #${ventaId} recuperada de papelera`);
        
        if (modo === 'papelera') {
            renderizarHistorial();
        }
    }
}

function eliminarDefinitivamente(ventaId) {
    if (confirm('¿Está seguro de que desea eliminar permanentemente esta venta? Esta acción no se puede deshacer.')) {
        const index = ventasEliminadas.findIndex(v => v.id == ventaId);
        if (index !== -1) {
            ventasEliminadas.splice(index, 1);
            guardarDatos();
            console.log(`Venta #${ventaId} eliminada permanentemente`);
            renderizarHistorial();
        }
    }
}

// ============================================
// CAMBIAR MODO (Historial / Papelera)
// ============================================
function cambiarModo(nuevoModo) {
    modo = nuevoModo;
    console.log('Modo cambiado a:', modo);
    renderizarHistorial();
}

// ============================================
// ORDENAMIENTO
// ============================================
function cambiarOrdenamiento() {
    ordenAscendente = !ordenAscendente;
    console.log('Orden:', ordenAscendente ? 'Ascendente' : 'Descendente');
    renderizarHistorial();
}

// ============================================
// INICIALIZACIÓN
// ============================================
function inicializar() {
    console.log('Inicializando historial...');
    
    cargarVentas();
    cargarPapelera();
    
    renderizarHistorial();

    // Asignar eventos a botones de modo
    const btnHistorial = document.getElementById('btn-historial');
    const btnPapelera = document.getElementById('btn-papelera');
    const btnOrdenar = document.getElementById('btn-ordenar');
    const inputBuscar = document.getElementById('buscar-venta');

    if (btnHistorial) {
        btnHistorial.addEventListener('click', () => cambiarModo('historial'));
    }

    if (btnPapelera) {
        btnPapelera.addEventListener('click', () => cambiarModo('papelera'));
    }

    if (btnOrdenar) {
        btnOrdenar.addEventListener('click', cambiarOrdenamiento);
    }

    if (inputBuscar) {
        inputBuscar.addEventListener('input', (e) => {
            filtrarVentas(e.target.value);
        });
    }

    console.log('Historial inicializado correctamente');
}

// Iniciar cuando el DOM está listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializar);
} else {
    inicializar();
}
