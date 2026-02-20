// carritopage/js/carrito.js
// 1. IMPORTANTE: Agregamos "guardarProductos" al import
import { productos, guardarProductos } from "../js/data.js"; 

function obtenerCarrito() {
    return JSON.parse(localStorage.getItem("carrito")) || [];
}

function guardarCarrito(nuevoCarrito) {
    localStorage.setItem("carrito", JSON.stringify(nuevoCarrito));
    renderCarrito();
}

/**
 * Agrega un producto validando contra el stock de data.js
 */
export function agregarAlCarrito(producto) {
    let carrito = obtenerCarrito();
    const existe = carrito.find(item => item.id === producto.id);
    
    const productoOriginal = productos.find(p => p.id === producto.id);
    const stockDisponible = productoOriginal ? productoOriginal.stock : 0;

    if (existe) {
        if (existe.cantidad < stockDisponible) {
            existe.cantidad += 1;
            alert(`${producto.nombre} añadido. (Total: ${existe.cantidad})`);
        } else {
            alert(`Límite alcanzado: Solo hay ${stockDisponible} unidades disponibles.`);
            return;
        }
    } else {
        if (stockDisponible > 0) {
            carrito.push({ ...producto, cantidad: 1 });
            alert(`${producto.nombre} añadido al carrito.`);
        } else {
            alert("Producto agotado.");
            return;
        }
    }

    guardarCarrito(carrito);
}

export function activarEventosCarrito() {
    renderCarrito();
}

export function renderCarrito() {
    const contenedor = document.getElementById("carrito");
    if (!contenedor) return;

    const carrito = obtenerCarrito();

    if (carrito.length === 0) {
        contenedor.innerHTML = `
            <div style="text-align:center; padding: 50px;">
                <p>Tu carrito está vacío.</p>
                <br>
                <a href="../index.html" style="color: #8a9b2f; font-weight: bold;">Volver a la tienda</a>
            </div>
        `;
        return;
    }

    let html = "";
    let totalGeneral = 0;

    carrito.forEach((p, index) => {
        const subtotal = p.precio * p.cantidad;
        totalGeneral += subtotal;

        html += `
            <div class="item-carrito">
                <img src="${p.imagen}" alt="${p.nombre}" class="img-carrito">
                <div class="info-carrito">
                    <h4>${p.nombre}</h4>
                    <p>Precio: $${p.precio.toLocaleString()}</p>
                    <div class="controles-cantidad">
                        <button class="btn-qty" data-action="restar" data-index="${index}">-</button>
                        <input type="number" value="${p.cantidad}" readonly class="input-cantidad">
                        <button class="btn-qty" data-action="sumar" data-index="${index}">+</button>
                    </div>
                </div>
                <div class="controles-item">
                    <p><strong>Subtotal: $${subtotal.toLocaleString()}</strong></p>
                    <button class="btn-eliminar" data-index="${index}">Eliminar</button>
                </div>
            </div>
        `;
    });

    html += `
        <div class="carrito-total">
            <hr>
            <h3>Total a pagar: $${totalGeneral.toLocaleString()}</h3>
            <div class="botones-finales">
                <button id="vaciar-carrito" class="btn-vaciar">Vaciar Carrito</button>
                <button id="finalizar-compra" class="btn-finalizar">Finalizar Compra</button>
            </div>
        </div>
    `;

    contenedor.innerHTML = html;
    asignarEventosBotones();
}

export function asignarEventosBotones() {
    const carrito = obtenerCarrito();

    document.querySelectorAll(".btn-qty").forEach(btn => {
        btn.onclick = (e) => {
            const index = e.target.dataset.index;
            const accion = e.target.dataset.action;
            const item = carrito[index];
            const original = productos.find(p => p.id === item.id);

            if (accion === "sumar") {
                if (item.cantidad < original.stock) {
                    item.cantidad += 1;
                } else {
                    alert(`No puedes agregar más. El stock máximo es ${original.stock}.`);
                }
            } else if (accion === "restar" && item.cantidad > 1) {
                item.cantidad -= 1;
            }
            guardarCarrito(carrito);
        };
    });

    document.querySelectorAll(".btn-eliminar").forEach(btn => {
        btn.onclick = (e) => {
            const index = e.target.dataset.index;
            carrito.splice(index, 1);
            guardarCarrito(carrito);
        };
    });

    const btnVaciar = document.getElementById("vaciar-carrito");
    if (btnVaciar) {
        btnVaciar.onclick = () => {
            if (confirm("¿Vaciar carrito?")) guardarCarrito([]);
        };
    }

    // 2. LÓGICA INTEGRADA DE FINALIZAR COMPRA
    const btnFinalizar = document.getElementById("finalizar-compra");
    if (btnFinalizar) {
        btnFinalizar.onclick = () => {
            if (carrito.length === 0) return;

            // RECORREMOS el carrito para restar el stock de la data maestra
            carrito.forEach(itemComprado => {
                const productoData = productos.find(p => p.id === itemComprado.id);
                if (productoData) {
                    productoData.stock -= itemComprado.cantidad;
                }
            });

            // GUARDAMOS el nuevo stock en el LocalStorage
            guardarProductos();

            alert("¡Compra finalizada con éxito! El stock ha sido actualizado.");
            guardarCarrito([]); // Vaciamos el carrito
            
            // Volvemos a la tienda para ver los cambios de stock reflejados
            window.location.href = "../index.html";
        };
    }
}