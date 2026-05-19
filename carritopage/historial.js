// ============================================
// VARIABLES GLOBALES
// ============================================
let ventasActuales = [];
let ventasEliminadas = [];
let ordenAscendente = true;
let ventaAEliminar = null;
let modo = 'historial'; // 'historial' o 'papelera'

// ============================================
// NORMALIZACIÓN / COMPATIBILIDAD
// ============================================
function detectarApiPrefix() {
    try {
        const path = window?.location?.pathname || '';
        const candidates = [
            '/Jeronimo%20Rubio_Sebastian%20Rocha_Ibrahim%20Safadi',
            '/Jeronimo Rubio_Sebastian Rocha_Ibrahim Safadi',
            '/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi'
        ];
        const match = candidates.find((p) => path.startsWith(p));
        return match || candidates[0];
    } catch (_e) {
        return '/Jeronimo%20Rubio_Sebastian%20Rocha_Ibrahim%20Safadi';
    }
}

async function fetchVentasDesdeApi() {
    const prefix = detectarApiPrefix();
    const url = `${prefix}/ventas`;
    const token = (typeof localStorage !== 'undefined' && localStorage.getItem('token')) || null;
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) throw new Error(`API ${res.status}`);
    return res.json();
}

function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function leerArrayLocalStorage(clave) {
    try {
        const raw = localStorage.getItem(clave);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
        return [];
    }
}

function normalizarArticulosDesdeItems(items) {
    if (typeof items === 'string') {
        try {
            items = JSON.parse(items || '[]');
        } catch (_error) {
            items = [];
        }
    }
    if (!Array.isArray(items)) return [];
    return items.map((item) => ({
        nombre: item?.nombre || item?.titulo || item?.producto?.nombre || 'Producto',
        cantidad: toNumber(item?.cantidad, 1),
        precio: toNumber(item?.precioUnitario ?? item?.precio ?? item?.precioVenta ?? item?.producto?.precioVenta, 0)
    }));
}

function normalizarVentaHistorial(venta) {
    if (!venta || (venta.id === undefined || venta.id === null)) return null;

    const fecha = venta.fecha || venta.createdAt || new Date().toISOString();

    const articulos = Array.isArray(venta.articulos)
        ? venta.articulos.map((art) => ({
            nombre: art?.nombre || 'Producto',
            cantidad: toNumber(art?.cantidad, 1),
            precio: toNumber(art?.precio, 0)
        }))
        : Array.isArray(venta.detalles)
            ? venta.detalles.map((det) => ({
                nombre: det?.producto?.nombre || det?.producto?.name || 'Producto',
                cantidad: toNumber(det?.cantidad, 1),
                precio: toNumber(det?.precioUnitario, 0)
            }))
        : normalizarArticulosDesdeItems(venta.items || venta.itemsJson);

    const totalCalculado = articulos.reduce((sum, art) => sum + (toNumber(art.precio) * toNumber(art.cantidad)), 0);

    return {
        ...venta,
        id: venta.id,
        fecha,
        metodoPago: venta.metodoPago || venta.metodo || venta.paymentMethod || '',
        articulos,
        total: Number.isFinite(Number(venta.total)) ? Number(venta.total) : totalCalculado
    };
}

function deduplicarVentasPorId(ventas) {
    const map = new Map();
    for (const venta of ventas) {
        if (!venta) continue;
        map.set(String(venta.id), venta);
    }
    return Array.from(map.values());
}

// ============================================
// CARGAR DATOS
// ============================================
function cargarVentas() {
    try {
        ventasActuales = [];
    } catch (error) {
        console.error('Error al cargar ventas:', error);
        ventasActuales = [];
    }
}

async function cargarVentasPreferenteApi() {
    try {
        const apiVentas = await fetchVentasDesdeApi();
        const normalizadas = (Array.isArray(apiVentas) ? apiVentas : [])
            .map(normalizarVentaHistorial)
            .filter(Boolean);
        ventasActuales = deduplicarVentasPorId(normalizadas);
        console.log('Ventas cargadas desde API:', ventasActuales.length);
        return;
    } catch (error) {
        console.warn('No se pudo cargar ventas desde API, usando localStorage:', error?.message || error);
    }

    // Fuente local (compatibilidad)
    const ventas = leerArrayLocalStorage('ventas');
    const ventasCompletadas = leerArrayLocalStorage('ventasCompletadas');
    const historialVentas = leerArrayLocalStorage('historialVentas');

    const combinadas = [...ventas, ...ventasCompletadas, ...historialVentas]
        .map(normalizarVentaHistorial)
        .filter(Boolean);

    ventasActuales = deduplicarVentasPorId(combinadas);
    console.log('Ventas cargadas desde localStorage:', ventasActuales.length);
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
    // Mantener `ventas` como fuente principal para historial + factura.
    localStorage.setItem('ventas', JSON.stringify(ventasActuales));
    // Compatibilidad con versiones que leían `ventasCompletadas`.
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

    const articulos = Array.isArray(venta.articulos) ? venta.articulos : [];
    const total = Number.isFinite(Number(venta.total))
        ? Number(venta.total)
        : articulos.reduce((sum, art) => sum + (toNumber(art.precio) * toNumber(art.cantidad)), 0);
    const cantidadItems = articulos.reduce((sum, art) => sum + toNumber(art.cantidad), 0);

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
        const articulos = Array.isArray(venta.articulos) ? venta.articulos : [];
        const total = (Number.isFinite(Number(venta.total))
            ? Number(venta.total)
            : articulos.reduce((sum, art) => sum + (toNumber(art.precio) * toNumber(art.cantidad)), 0)
        ).toString();
        const metodoPago = (venta.metodoPago || '').toLowerCase();

        return id.includes(terminoLower) ||
               total.includes(terminoLower) ||
               metodoPago.includes(terminoLower) ||
               articulos.some(art => String(art?.nombre || '').toLowerCase().includes(terminoLower));
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

    // Asegurar compatibilidad si entra una venta en formato `{ items: [...] }`
    const normalizada = normalizarVentaHistorial(venta) || venta;
    if (normalizada !== venta) {
        const index = datos.findIndex(v => v && v.id == ventaId);
        if (index !== -1) datos[index] = normalizada;
        guardarDatos();
    }

    const articulos = Array.isArray(normalizada.articulos) ? normalizada.articulos : [];

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
            <p><strong>Método de pago:</strong> ${normalizada.metodoPago || 'No especificado'}</p>
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
    articulos.forEach(articulo => {
        const subtotal = toNumber(articulo.precio) * toNumber(articulo.cantidad);
        totalGeneral += subtotal;
        detallesHTML += `
            <tr>
                <td>${articulo.nombre}</td>
                <td>${toNumber(articulo.cantidad, 1)}</td>
                <td>$${toNumber(articulo.precio, 0).toFixed(2)}</td>
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
async function inicializar() {
    console.log('Inicializando historial...');
    
    await cargarVentasPreferenteApi();
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
