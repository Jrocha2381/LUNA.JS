// carritopage/js/carrito.js
// 1. IMPORTANTE: Agregamos "guardarProductos" al import
import { productos, guardarProductos } from "../js/data.js"; 
function crearContenedorToast() {
    if (!document.getElementById("toast-container")) {
        const container = document.createElement("div");
        container.id = "toast-container";
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 360px;
        `;
        document.body.appendChild(container);
    }
    return document.getElementById("toast-container");
}
const TOAST_ICONS = {
    success: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
    warning: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
    error:   `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`,
    info:    `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

const TOAST_STYLES = {
    success: { bg: "#f0fdf0", border: "#86efac", iconBg: "#dcfce7", iconColor: "#16a34a", titleColor: "#15803d" },
    warning: { bg: "#fefce8", border: "#fde047", iconBg: "#fef9c3", iconColor: "#ca8a04", titleColor: "#a16207" },
    error:   { bg: "#fff1f2", border: "#fca5a5", iconBg: "#fee2e2", iconColor: "#dc2626", titleColor: "#b91c1c" },
    info:    { bg: "#eff6ff", border: "#93c5fd", iconBg: "#dbeafe", iconColor: "#2563eb", titleColor: "#1d4ed8" },
};

function mostrarToast(tipo, titulo, mensaje, duracion = 3500) {
    const container = crearContenedorToast();
    const s = TOAST_STYLES[tipo] || TOAST_STYLES.info;
    const icono = TOAST_ICONS[tipo] || TOAST_ICONS.info;

    const toast = document.createElement("div");
    toast.style.cssText = `
        display: flex;
        align-items: flex-start;
        gap: 12px;
        background: ${s.bg};
        border: 1.5px solid ${s.border};
        border-radius: 12px;
        padding: 14px 16px;
        box-shadow: 0 4px 18px rgba(0,0,0,0.10);
        font-family: 'Segoe UI', Arial, sans-serif;
        animation: toast-in 0.3s ease;
        position: relative;
        min-width: 260px;
    `;

    toast.innerHTML = `
        <style>
            @keyframes toast-in  { from { opacity:0; transform: translateX(40px); } to { opacity:1; transform: translateX(0); } }
            @keyframes toast-out { from { opacity:1; transform: translateX(0);    } to { opacity:0; transform: translateX(40px); } }
        </style>
        <div style="
            background:${s.iconBg};
            color:${s.iconColor};
            border-radius:50%;
            width:40px; height:40px;
            display:flex; align-items:center; justify-content:center;
            flex-shrink:0;
        ">${icono}</div>
        <div style="flex:1; padding-top:2px;">
            <div style="font-weight:700; color:${s.titleColor}; font-size:14px; margin-bottom:2px;">${titulo}</div>
            <div style="color:#4b5563; font-size:13px; line-height:1.4;">${mensaje}</div>
        </div>
        <button onclick="this.parentElement.remove()" style="
            background:none; border:none; cursor:pointer;
            color:#9ca3af; font-size:18px; line-height:1;
            padding:0 0 0 6px; flex-shrink:0;
        ">&#x2715;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "toast-out 0.3s ease forwards";
        setTimeout(() => toast.remove(), 300);
    }, duracion);
}
function mostrarConfirmacion(mensaje, onAceptar) {
    const container = crearContenedorToast();
    const s = TOAST_STYLES.warning;
    const icono = TOAST_ICONS.warning;

    const toast = document.createElement("div");
    toast.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 10px;
        background: ${s.bg};
        border: 1.5px solid ${s.border};
        border-radius: 12px;
        padding: 14px 16px;
        box-shadow: 0 4px 18px rgba(0,0,0,0.10);
        font-family: 'Segoe UI', Arial, sans-serif;
        animation: toast-in 0.3s ease;
        min-width: 280px;
    `;

    toast.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
            <div style="
                background:${s.iconBg}; color:${s.iconColor};
                border-radius:50%; width:38px; height:38px;
                display:flex; align-items:center; justify-content:center; flex-shrink:0;
            ">${icono}</div>
            <div style="font-weight:700; color:${s.titleColor}; font-size:14px;">Confirmar acción</div>
        </div>
        <div style="color:#4b5563; font-size:13px; padding-left:4px;">${mensaje}</div>
        <div style="display:flex; gap:8px; justify-content:flex-end;">
            <button id="toast-cancelar" style="
                padding:6px 14px; border-radius:8px;
                border:1.5px solid #d1d5db; background:#fff;
                color:#374151; font-size:13px; cursor:pointer; font-weight:600;
            ">Cancelar</button>
            <button id="toast-aceptar" style="
                padding:6px 14px; border-radius:8px; border:none;
                background:${s.iconColor}; color:#fff;
                font-size:13px; cursor:pointer; font-weight:600;
            ">Confirmar</button>
        </div>
    `;

    container.appendChild(toast);

    toast.querySelector("#toast-cancelar").onclick = () => toast.remove();
    toast.querySelector("#toast-aceptar").onclick = () => {
        toast.remove();
        onAceptar();
    };
}
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
            mostrarToast("success", "Producto añadido", `${producto.nombre} añadido. (Total: ${existe.cantidad})`);
        } else {
            mostrarToast("error", "Límite alcanzado", `Solo hay ${stockDisponible} unidades disponibles.`);
            return;
        }
    } else {
        if (stockDisponible > 0) {
            carrito.push({ ...producto, cantidad: 1 });
            mostrarToast("success", "¡Añadido al carrito!", `${producto.nombre} añadido al carrito.`);
        } else {
            mostrarToast("error", "Producto agotado", "Este producto no tiene stock disponible.");
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
                    mostrarToast("warning", "Stock máximo", `No puedes agregar más. El stock máximo es ${original.stock}.`);
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
            mostrarConfirmacion("¿Vaciar carrito? Se eliminarán todos los productos.", () => {
                guardarCarrito([]);
            });
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

            mostrarToast("success", "¡Compra exitosa!", "El stock ha sido actualizado. Redirigiendo...", 2500);
            guardarCarrito([]); // Vaciamos el carrito
            
            // Volvemos a la tienda para ver los cambios de stock reflejados
            setTimeout(() => { window.location.href = "../index.html"; }, 2500);
        };
    }
}