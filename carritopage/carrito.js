import { productos } from "../js/data.js";

// Cargar carrito del localStorage
let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

export function agregarAlCarrito(producto) {
    const existe = carrito.find(item => item.id === producto.id);

    if (existe) {
        existe.cantidad += 1;
    } else {
        carrito.push({ ...producto, cantidad: 1 });
    }

    localStorage.setItem("carrito", JSON.stringify(carrito));
    alert("¡Producto guardado en el storage!"); // Alerta de prueba
}

export function activarEventosCarrito() {
    console.log("Renderizando carrito...");
    renderCarrito();
}

function renderCarrito() {
    const contenedor = document.getElementById("carrito");
    if (!contenedor) return;

    if (carrito.length === 0) {
        contenedor.innerHTML = "<p>El carrito está vacío.</p>";
        return;
    }

    let html = "";
    carrito.forEach(p => {
        html += `
            <div class="item-carrito">
                <img src="${p.imagen}" class="img-carrito">
                <div class="info-carrito">
                    <h4>${p.nombre}</h4>
                    <p>$${p.precio}</p>
                    <p>Cant: ${p.cantidad}</p>
                </div>
            </div>`;
    });
    contenedor.innerHTML = html;
}