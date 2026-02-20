// js/buscador.js
import { productos } from "./data.js";
import { agregarAlCarrito, asignarEventosBotones, renderCarrito } from "../carritopage/carrito.js";

/**
 * Filtra productos según el texto de búsqueda
 */
export function filtrarProductos(textoBusqueda) {
    if (!textoBusqueda.trim()) {
        return [];
    }

    const texto = textoBusqueda.toLowerCase().trim();
    
    return productos.filter(p => 
        p.nombre.toLowerCase().includes(texto) ||
        p.categoria.toLowerCase().includes(texto) ||
        p.descripcion.toLowerCase().includes(texto)
    );
}

/**
 * Activa el buscador en el header principal (index.html)
 */
export function activarBuscadorHeader() {
    const inputBuscar = document.getElementById("input-buscar-header");
    const btnBuscar = document.getElementById("btn-buscar-header");
    const resultadosContainer = document.getElementById("resultados-busqueda");

    if (!inputBuscar) return;

    // Función para mostrar resultados
    function mostrarResultados(textoBusqueda) {
        const productosFiltrados = filtrarProductos(textoBusqueda);

        if (!productosFiltrados.length) {
            resultadosContainer.innerHTML = `
                <div class="resultados-vacio">
                    <p>❌ No se encontraron productos con "${textoBusqueda}"</p>
                </div>
            `;
            return;
        }

        let html = `
            <div class="resultados-header">
                <h3>✅ Se encontraron ${productosFiltrados.length} producto(s)</h3>
                <button id="cerrar-resultados" class="btn-cerrar-resultados">✕ Cerrar</button>
            </div>
            <div class="resultados-grid">
        `;

        productosFiltrados.forEach(producto => {
            const tieneStock = producto.stock > 0;
            html += `
                <div class="resultado-card" style="${!tieneStock ? 'opacity: 0.6;' : ''}">
                    <img src="${producto.imagen}" alt="${producto.nombre}" />
                    <h4>${producto.nombre}</h4>
                    <p class="categoria-tag">${producto.categoria}</p>
                    <p class="precio">$${producto.precio.toLocaleString()}</p>
                    <p class="stock">Stock: ${producto.stock} unidades</p>
                    <button class="btn-agregar-resultado" 
                            data-id="${producto.id}" 
                            ${!tieneStock ? 'disabled' : ''}>
                        ${tieneStock ? '🛒 Añadir' : 'Agotado'}
                    </button>
                </div>
            `;
        });

        html += `</div>`;
        resultadosContainer.innerHTML = html;

        // Agregar evento a los botones de agregar
        const botonesAgregar = document.querySelectorAll(".btn-agregar-resultado");
        botonesAgregar.forEach(btn => {
            btn.addEventListener("click", () => {
                const id = Number(btn.dataset.id);
                const productoParaAgregar = productos.find(p => p.id === id);
                if (productoParaAgregar) {
                    agregarAlCarrito(productoParaAgregar);
                }
            });
        });

        // Cerrar resultados
        const btnCerrar = document.getElementById("cerrar-resultados");
        if (btnCerrar) {
            btnCerrar.addEventListener("click", () => {
                resultadosContainer.innerHTML = "";
                inputBuscar.value = "";
            });
        }
    }

    // Evento al escribir (búsqueda en tiempo real)
    inputBuscar.addEventListener("input", (e) => {
        const texto = e.target.value.trim();
        if (texto) {
            mostrarResultados(texto);
        } else {
            resultadosContainer.innerHTML = "";
        }
    });

    // Evento del botón buscar
    if (btnBuscar) {
        btnBuscar.addEventListener("click", () => {
            const texto = inputBuscar.value.trim();
            if (texto) {
                mostrarResultados(texto);
            }
        });
    }

    // Tecla Enter
    inputBuscar.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const texto = inputBuscar.value.trim();
            if (texto) {
                mostrarResultados(texto);
            }
        }
    });
}

/**
 * Activa el buscador en el carrito (filtra carrito local + datos)
 */
export function activarBuscadorCarrito() {
    const inputBuscar = document.getElementById("input-buscar");
    const btnBuscar = document.getElementById("btn-buscar");
    const btnLimpiar = document.getElementById("btn-limpiar");
    const resultadosBusqueda = document.getElementById("resultados-busqueda");

    if (!inputBuscar) return;

    function renderCarritoFiltrado(productosFiltrados) {
        const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
        const contenedor = document.getElementById("carrito");

        // Filtrar solo los que están en el carrito
        const carritoFiltrado = carrito.filter(item =>
            productosFiltrados.some(p => p.id === item.id)
        );

        if (!carritoFiltrado.length) {
            contenedor.innerHTML = `
                <div style="text-align:center; padding: 50px;">
                    <p>No hay productos que coincidan en tu carrito.</p>
                </div>
            `;
            return;
        }

        let html = "";
        let totalGeneral = 0;

        carritoFiltrado.forEach((p, index) => {
            const indexReal = carrito.findIndex(item => item.id === p.id);
            const subtotal = p.precio * p.cantidad;
            totalGeneral += subtotal;

            html += `
                <div class="item-carrito">
                    <img src="${p.imagen}" alt="${p.nombre}" class="img-carrito">
                    <div class="info-carrito">
                        <h4>${p.nombre}</h4>
                        <p>Precio: $${p.precio.toLocaleString()}</p>
                        <div class="controles-cantidad">
                            <button class="btn-qty" data-action="restar" data-index="${indexReal}">-</button>
                            <input type="number" value="${p.cantidad}" readonly class="input-cantidad">
                            <button class="btn-qty" data-action="sumar" data-index="${indexReal}">+</button>
                        </div>
                    </div>
                    <div class="controles-item">
                        <p><strong>Subtotal: $${subtotal.toLocaleString()}</strong></p>
                        <button class="btn-eliminar" data-index="${indexReal}">Eliminar</button>
                    </div>
                </div>
            `;
        });

        html += `
            <div class="carrito-total">
                <hr>
                <h3>Total de búsqueda: $${totalGeneral.toLocaleString()}</h3>
            </div>
        `;

        contenedor.innerHTML = html;
    }

    function buscarEnCarrito(textoBusqueda) {
        const productosFiltrados = filtrarProductos(textoBusqueda);

        if (!productosFiltrados.length) {
            resultadosBusqueda.textContent = `❌ No se encontraron productos con "${textoBusqueda}"`;
            document.getElementById("carrito").innerHTML = `
                <div style="text-align:center; padding: 50px;">
                    <p>No hay productos que coincidan.</p>
                </div>
            `;
            return;
        }

        resultadosBusqueda.textContent = `✅ Se encontraron ${productosFiltrados.length} producto(s)`;
        renderCarritoFiltrado(productosFiltrados);
    }

    // Búsqueda en tiempo real
    inputBuscar.addEventListener("input", (e) => {
        const texto = e.target.value.trim();
        if (texto) {
            buscarEnCarrito(texto);
        } else {
            resultadosBusqueda.textContent = "";
            // Re-renderizar carrito completo
            renderCarrito();
        }
    });

    // Botón buscar
    if (btnBuscar) {
        btnBuscar.addEventListener("click", () => {
            const texto = inputBuscar.value.trim();
            if (texto) {
                buscarEnCarrito(texto);
            }
        });
    }

    // Botón limpiar
    if (btnLimpiar) {
        btnLimpiar.addEventListener("click", () => {
            inputBuscar.value = "";
            resultadosBusqueda.textContent = "";
            renderCarrito();
        });
    }

    // Tecla Enter
    inputBuscar.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            const texto = inputBuscar.value.trim();
            if (texto) {
                buscarEnCarrito(texto);
            }
        }
    });
}
