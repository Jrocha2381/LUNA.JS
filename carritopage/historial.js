// carritopage/historial.js

// Usar funciones globales definidas en ../js/ventas.js

let ventasActuales = [];
let ordenAscendente = false;
let ventaAEliminar = null;

function formatearMoneda(valor) {
    return `$${Number(valor).toLocaleString()}`;
}

function obtenerNombreProducto(item) {
    return item.nombre || item.titulo || item.producto?.nombre || "Producto";
}

<<<<<<< HEAD
function crearTarjetaVenta(venta) {
    const ticket = venta.id.toString().slice(-6);
    const totalItems = venta.items.reduce((sum, item) => sum + (item.cantidad || 1), 0);
    
    // Resumen de productos (primeros 2-3)
    const resumenProductos = venta.items
        .slice(0, 3)
        .map(item => `${item.cantidad}x ${obtenerNombreProducto(item)}`)
        .join(", ");
    
    const productosExtra = venta.items.length > 3 ? `... +${venta.items.length - 3} más` : "";
=======
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
async function cargarVentas() {
    try {
        if (!window.Backend || !window.Backend.isEnabled || !window.Backend.isEnabled()) {
            console.warn('Backend no disponible; no se pueden cargar ventas desde API.');
            ventasActuales = [];
            return;
        }

        const ventas = await window.Backend.get('ventas');
        const detalles = await window.Backend.get('detalle_ventas');

        const detallesPorVenta = new Map();
        if (Array.isArray(detalles)) {
            detalles.forEach(d => {
                const ventaId = d.ventaId;
                if (ventaId === undefined || ventaId === null) return;
                const key = String(ventaId);
                if (!detallesPorVenta.has(key)) detallesPorVenta.set(key, []);
                detallesPorVenta.get(key).push(d);
            });
        }

        const normalizadas = (Array.isArray(ventas) ? ventas : [])
            .map((v) => {
                const articulosDetalles = (detallesPorVenta.get(String(v.id)) || []).map((d) => ({
                    nombre:
                        d.nombre ||
                        d.productoNombre ||
                        d.producto?.nombre ||
                        d.nombreProducto ||
                        'Producto',
                    cantidad: toNumber(d.cantidad, 1),
                    precio: toNumber(d.precioUnitario ?? d.precio ?? d.precioVenta, 0)
                }));

                const totalCalculado = articulosDetalles.reduce((sum, art) => sum + (toNumber(art.precio) * toNumber(art.cantidad)), 0);

                return {
                    ...v,
                    id: v.id,
                    fecha: v.fecha || v.createdAt || new Date().toISOString(),
                    metodoPago: v.metodoPago || v.metodo || v.paymentMethod || '',
                    articulos: articulosDetalles,
                    total: Number.isFinite(Number(v.total)) ? Number(v.total) : totalCalculado,
                    estado: v.estado || 'activa'
                };
            })
            .filter(Boolean);

        ventasActuales = deduplicarVentasPorId(normalizadas);
        console.log('Ventas cargadas desde API:', ventasActuales.length);
    } catch (error) {
        console.error('Error al cargar ventas desde API:', error);
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
    const fechaFormato = new Date(normalizada.fecha).toLocaleDateString('es-ES', {
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
>>>>>>> sooosou

    const tarjeta = document.createElement("div");
    tarjeta.className = "tarjeta-venta";
    tarjeta.innerHTML = `
        <div class="tarjeta-encabezado">
            <div class="info-ticket">
                <h3>#${ticket}</h3>
                <p class="fecha">${venta.fecha}</p>
            </div>
            <div class="info-total">
                <p class="total">Total: ${formatearMoneda(venta.total)}</p>
                <p class="metodo-pago">💳 ${venta.metodoPago}</p>
            </div>
        </div>

        <div class="tarjeta-cuerpo">
            <p class="items-info">
                <strong>${totalItems} artículos:</strong><br>
                <span class="resumen">${resumenProductos}${productosExtra}</span>
            </p>
        </div>

        <div class="tarjeta-acciones">
            <button class="btn-ver-detalle" data-id="${venta.id}">👁️ Ver detalle</button>
            <button class="btn-ver-factura" data-id="${venta.id}">🧾 Ver factura</button>
            <button class="btn-eliminar-venta" data-id="${venta.id}">🗑️ Eliminar</button>
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

    ventas.forEach(venta => {
        const tarjeta = crearTarjetaVenta(venta);
        contenedor.appendChild(tarjeta);
    });

    asignarEventosTarjetas();
}

function asignarEventosTarjetas() {
    // Botones "Ver detalle"
    document.querySelectorAll(".btn-ver-detalle").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idVenta = e.target.dataset.id;
            const venta = ventasActuales.find(v => v.id.toString() === idVenta);
            if (venta) {
                mostrarModalDetalle(venta);
            }
        });
    });

    // Botones "Ver factura"
    document.querySelectorAll(".btn-ver-factura").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const idVenta = e.target.dataset.id;
            window.location.href = `factura.html?id=${idVenta}`;
        });
    });

    // Botones "Eliminar"
    document.querySelectorAll(".btn-eliminar-venta").forEach(btn => {
        btn.addEventListener("click", (e) => {
            ventaAEliminar = e.target.dataset.id;
            document.getElementById("modal-confirmar").style.display = "flex";
        });
    });
}

function mostrarModalDetalle(venta) {
    const detalles = venta.items.map((item, idx) => {
        const cantidad = item.cantidad || 1;
        const precio = item.precio || item.precioVenta || 0;
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
                    <h2>Detalle de Venta #${venta.id.toString().slice(-6)}</h2>
                    <button class="btn-cerrar-modal" onclick="document.getElementById('modal-detalle-overlay').remove()">✕</button>
                </div>

                <div class="modal-body">
                    <div class="detalle-info">
                        <p><strong>Fecha:</strong> ${venta.fecha}</p>
                        <p><strong>Método de pago:</strong> ${venta.metodoPago}</p>
                        ${venta.metodoPago === "Efectivo" ? `
                            <p><strong>Valor recibido:</strong> ${formatearMoneda(venta.valorRecibido)}</p>
                            <p><strong>Cambio:</strong> ${formatearMoneda(venta.cambio)}</p>
                        ` : ""}
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
                        <tbody>
                            ${detalles}
                        </tbody>
                    </table>

                    <div style="text-align: right; margin-top: 20px; border-top: 2px solid #eee; padding-top: 15px;">
                        <h3 style="color: #8a9b2f;">Total: ${formatearMoneda(venta.total)}</h3>
                    </div>
                </div>

                <div class="modal-footer">
                    <button class="btn-secundario" onclick="document.getElementById('modal-detalle-overlay').remove()">Cerrar</button>
                    <button class="btn-primario" onclick="window.location.href='factura.html?id=${venta.id}'">Ver factura</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", contenidoModal);

    // Cerrar modal al hacer clic en overlay
    document.getElementById("modal-detalle-overlay").addEventListener("click", (e) => {
        if (e.target.id === "modal-detalle-overlay") {
            e.target.remove();
        }
    });
}

function filtrarVentas(terminoBusqueda) {
    const termino = terminoBusqueda.toLowerCase();
    return ventasActuales.filter(venta => {
        const ticket = venta.id.toString().slice(-6);
        const fecha = venta.fecha.toLowerCase();
        return ticket.includes(termino) || fecha.includes(termino);
    });
}

function ordenarVentas(ventas) {
    return [...ventas].sort((a, b) => {
        if (ordenAscendente) {
            return new Date(a.fecha) - new Date(b.fecha);
        } else {
            return new Date(b.fecha) - new Date(a.fecha);
        }
    });
}

function eliminarVenta(idVenta) {
    const ventas = obtenerVentas();
    const indice = ventas.findIndex(v => v.id.toString() === idVenta);
    
    if (indice !== -1) {
        ventas.splice(indice, 1);
        localStorage.setItem("ventas", JSON.stringify(ventas));
        ventasActuales = ventas;
        renderizarHistorial(ventasActuales);
        mostrarNotificacion("success", "Venta eliminada", "El registro ha sido eliminado correctamente.");
    }
}

function mostrarNotificacion(tipo, titulo, mensaje) {
    const notification = document.createElement("div");
    notification.className = `notification notification-${tipo}`;
    notification.innerHTML = `
        <strong>${titulo}:</strong> ${mensaje}
    `;
    
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
        animation: slideIn 0.3s ease;
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

    contenido += "DETALLE DE VENTAS:\n";
    contenido += "---------------------------------\n\n";

    ventasActuales.forEach(venta => {
        contenido += `Ticket: #${venta.id.toString().slice(-6)}\n`;
        contenido += `Fecha: ${venta.fecha}\n`;
        contenido += `Método de pago: ${venta.metodoPago}\n`;
        venta.items.forEach(item => {
            const cantidad = item.cantidad || 1;
            const precio = item.precio || item.precioVenta || 0;
            contenido += `  - ${obtenerNombreProducto(item)}: ${cantidad}x ${formatearMoneda(precio)}\n`;
        });
        contenido += `Total: ${formatearMoneda(venta.total)}\n`;
        contenido += "---------------------------------\n\n";
    });

    const elemento = document.createElement("a");
    elemento.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(contenido));
    elemento.setAttribute("download", `reporte-ventas-${new Date().getTime()}.txt`);
    elemento.style.display = "none";
    document.body.appendChild(elemento);
    elemento.click();
    document.body.removeChild(elemento);

    mostrarNotificacion("success", "Descargado", "Reporte descargado exitosamente");
}

// ==================== FILTROS AVANZADOS ====================

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

<<<<<<< HEAD
function aplicarFiltrosAvanzados(ventas, filtros) {
    return ventas.filter(venta => {
        // Filtro por rango de fechas
        if (filtros.fechaDesde || filtros.fechaHasta) {
            const fechaVenta = new Date(venta.fecha);
            if (filtros.fechaDesde) {
                const fechaDesde = new Date(filtros.fechaDesde);
                if (fechaVenta < fechaDesde) return false;
            }
            if (filtros.fechaHasta) {
                const fechaHasta = new Date(filtros.fechaHasta);
                fechaHasta.setHours(23, 59, 59, 999); // Incluye todo el día
                if (fechaVenta > fechaHasta) return false;
            }
        }

        // Filtro por rango de montos
        if (venta.total < filtros.montoMinimo || venta.total > filtros.montoMaximo) {
            return false;
        }

        // Filtro por método de pago
        if (filtros.metodoPago && venta.metodoPago !== filtros.metodoPago) {
            return false;
        }

        // Filtro por cantidad mínima de items
        const totalItems = venta.items.reduce((sum, item) => sum + (item.cantidad || 1), 0);
        if (totalItems < filtros.itemsMinimo) {
            return false;
        }

        return true;
    });
}

function mostrarFiltrosActivos(filtros) {
    const contenedor = document.getElementById("filtros-activos");
    const activos = [];

    if (filtros.fechaDesde) activos.push(`📅 Desde: ${filtros.fechaDesde}`);
    if (filtros.fechaHasta) activos.push(`📅 Hasta: ${filtros.fechaHasta}`);
    if (filtros.montoMinimo > 0) activos.push(`💰 Mín: ${formatearMoneda(filtros.montoMinimo)}`);
    if (filtros.montoMaximo < Infinity) activos.push(`💰 Máx: ${formatearMoneda(filtros.montoMaximo)}`);
    if (filtros.metodoPago) activos.push(`💳 ${filtros.metodoPago}`);
    if (filtros.itemsMinimo > 1) activos.push(`🛍️ ${filtros.itemsMinimo}+ items`);

    if (activos.length > 0) {
        contenedor.innerHTML = `<div class="filtros-tag-container">${activos.map(f => `<span class="filtro-tag">${f}</span>`).join("")}</div>`;
    } else {
        contenedor.innerHTML = "";
    }
}

function inicializarHistorial() {
    ventasActuales = obtenerVentas();
=======
// ============================================
// GESTIÓN DE PAPELERA
// ============================================
async function enviarAPapelera(ventaId) {
    try {
        await window.Backend.put(`ventas/${ventaId}`, { estado: 'papelera' });
        await cargarVentas();
        // refrescar modos
        if (modo === 'historial' || modo === 'papelera') renderizarHistorial();
    } catch (error) {
        console.error('Error al enviar a papelera:', error);
        alert('No se pudo enviar a papelera.');
    }
}

async function recuperarDePapelera(ventaId) {
    try {
        await window.Backend.put(`ventas/${ventaId}`, { estado: 'activa' });
        await cargarVentas();
        if (modo === 'historial' || modo === 'papelera') renderizarHistorial();
    } catch (error) {
        console.error('Error al recuperar de papelera:', error);
        alert('No se pudo recuperar la venta.');
    }
}

async function eliminarDefinitivamente(ventaId) {
    if (!confirm('¿Está seguro de que desea eliminar permanentemente esta venta? Esta acción no se puede deshacer.')) return;

    try {
        await window.Backend.delete(`ventas/${ventaId}`);
        await cargarVentas();
        if (modo === 'historial' || modo === 'papelera') renderizarHistorial();
    } catch (error) {
        console.error('Error al eliminar permanentemente:', error);
        alert('No se pudo eliminar la venta.');
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
>>>>>>> sooosou

    // Ordenar por defecto de más recientes a más antiguos
    ventasActuales = ordenarVentas(ventasActuales);
    renderizarHistorial(ventasActuales);

    // Event listeners
    const inputBusqueda = document.getElementById("buscar-venta");
    const btnLimpiar = document.getElementById("limpiar-busqueda");
    const btnOrdenar = document.getElementById("ordenar-ventas");
    const btnDescargar = document.getElementById("descargar-reporte");

    if (inputBusqueda) {
        inputBusqueda.addEventListener("input", (e) => {
            const filtradas = filtrarVentas(e.target.value);
            const ordenadas = ordenarVentas(filtradas);
            renderizarHistorial(ordenadas);
        });
    }

    if (btnLimpiar) {
        btnLimpiar.addEventListener("click", () => {
            if (inputBusqueda) inputBusqueda.value = "";
            renderizarHistorial(ventasActuales);
        });
    }

    if (btnOrdenar) {
        btnOrdenar.addEventListener("click", () => {
            ordenAscendente = !ordenAscendente;
            btnOrdenar.textContent = ordenAscendente ? "⬆️ Más antiguos" : "⬇️ Más recientes";
            ventasActuales = ordenarVentas(ventasActuales);
            renderizarHistorial(ventasActuales);
        });
    }

    if (btnDescargar) {
        btnDescargar.addEventListener("click", descargarReporte);
    }

    // ==================== FILTROS AVANZADOS ====================
    const toggleFiltros = document.getElementById("toggle-filtros");
    const filtrosAvanzados = document.getElementById("filtros-avanzados");
    const btnAplicarFiltros = document.getElementById("aplicar-filtros");
    const btnLimpiarFiltros = document.getElementById("limpiar-filtros");

    if (toggleFiltros) {
        toggleFiltros.addEventListener("click", () => {
            const estaVisible = filtrosAvanzados.style.display !== "none";
            filtrosAvanzados.style.display = estaVisible ? "none" : "flex";
            toggleFiltros.textContent = estaVisible ? "🔽 Filtros Avanzados" : "🔼 Ocultar Filtros";
        });
    }

    if (btnAplicarFiltros) {
        btnAplicarFiltros.addEventListener("click", () => {
            const filtros = obtenerFiltros();
            
            // Combinar búsqueda con filtros avanzados
            let resultado = ventasActuales;
            
            // Aplicar filtros avanzados
            resultado = aplicarFiltrosAvanzados(resultado, filtros);
            
            // Aplicar búsqueda si hay
            const terminoBusqueda = inputBusqueda ? inputBusqueda.value : "";
            if (terminoBusqueda) {
                resultado = filtrarVentas(terminoBusqueda);
                resultado = aplicarFiltrosAvanzados(resultado, filtros);
            }
            
            // Ordenar
            resultado = ordenarVentas(resultado);
            
            // Mostrar filtros activos
            mostrarFiltrosActivos(filtros);
            
            // Renderizar
            renderizarHistorial(resultado);
            
            if (resultado.length > 0) {
                mostrarNotificacion("success", "Filtros aplicados", `Se encontraron ${resultado.length} venta(s)`);
            } else {
                mostrarNotificacion("warning", "Sin resultados", "No hay ventas que coincidan con los filtros");
            }
        });
    }

    if (btnLimpiarFiltros) {
        btnLimpiarFiltros.addEventListener("click", () => {
            // Limpiar inputs
            document.getElementById("fecha-desde").value = "";
            document.getElementById("fecha-hasta").value = "";
            document.getElementById("monto-minimo").value = "";
            document.getElementById("monto-maximo").value = "";
            document.getElementById("metodo-pago-filtro").value = "";
            document.getElementById("items-minimo").value = "";
            if (inputBusqueda) inputBusqueda.value = "";
            
            // Mostrar todas las ventas
            ventasActuales = obtenerVentas();
            ventasActuales = ordenarVentas(ventasActuales);
            renderizarHistorial(ventasActuales);
            mostrarFiltrosActivos(obtenerFiltros());
            
            mostrarNotificacion("info", "Filtros reseteados", "Mostrando todas las ventas");
        });
    }

    // Modal de confirmación para eliminar
    const modalConfirmar = document.getElementById("modal-confirmar");
    const btnCancelarEliminar = document.getElementById("cancelar-eliminar");
    const btnConfirmarEliminar = document.getElementById("confirmar-eliminar");

    if (btnCancelarEliminar) {
        btnCancelarEliminar.addEventListener("click", () => {
            modalConfirmar.style.display = "none";
            ventaAEliminar = null;
        });
    }

    if (btnConfirmarEliminar) {
        btnConfirmarEliminar.addEventListener("click", () => {
            if (ventaAEliminar) {
                eliminarVenta(ventaAEliminar);
            }
            modalConfirmar.style.display = "none";
            ventaAEliminar = null;
        });
    }

    // Cerrar modal al hacer clic fuera
    if (modalConfirmar) {
        modalConfirmar.addEventListener("click", (e) => {
            if (e.target === modalConfirmar) {
                modalConfirmar.style.display = "none";
                ventaAEliminar = null;
            }
        });
    }
}

// Exponer en global
window.inicializarHistorial = inicializarHistorial;
