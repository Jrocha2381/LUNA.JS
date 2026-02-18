// carrito.js


import { productos } from "../js/data.js";


// ESTADO (con persistencia)

let carrito = JSON.parse(localStorage.getItem("carrito")) || [];


// GUARDAR EN LOCALSTORAGE

function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}


// AGREGAR PRODUCTO
export function agregarAlCarrito(id) {
  const producto = productos.find(p => p.id === id);
  if (!producto) return;

  const existe = carrito.find(p => p.id === id);

  if (existe) {
    existe.cantidad++;
  } else {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1
    });
  }

  guardarCarrito();
  renderCarrito();
}


// ELIMINAR PRODUCTO

function eliminarDelCarrito(id) {
  carrito = carrito.filter(p => p.id !== id);
  guardarCarrito();
  renderCarrito();
}


// CAMBIAR CANTIDAD

function cambiarCantidad(id, nuevaCantidad) {
  const producto = carrito.find(p => p.id === id);
  if (!producto) return;

  if (nuevaCantidad < 1) {
    eliminarDelCarrito(id);
    return;
  }

  producto.cantidad = nuevaCantidad;

  guardarCarrito();
  renderCarrito();
}


// CALCULAR TOTAL

function calcularTotal() {
  return carrito.reduce((acc, p) =>
    acc + p.precio * p.cantidad
  , 0);
}


// RENDERIZAR CARRITO

function renderCarrito() {
  const contenedor = document.getElementById("carrito");
  if (!contenedor) return;

  if (carrito.length === 0) {
    contenedor.innerHTML = "<p>Carrito vacío</p>";
    return;
  }

  contenedor.innerHTML = `
    <h2>Productos en tu carrito</h2>

    ${carrito.map(p => `
      <div class="item-carrito">
        <h4>${p.nombre}</h4>

        <input 
          type="number" 
          value="${p.cantidad}" 
          min="1" 
          data-id="${p.id}"
        >

        <p>Precio: $${p.precio.toLocaleString()}</p>
        <p>Subtotal: $${(p.precio * p.cantidad).toLocaleString()}</p>

        <button class="eliminar" data-id="${p.id}">
          Eliminar
        </button>
      </div>
    `).join("")}

    <hr>

    <h3>Total: $${calcularTotal().toLocaleString()}</h3>
  `;
}


// ACTIVAR EVENTOS

export function activarEventosCarrito() {
  const contenedor = document.getElementById("carrito");
  if (!contenedor) return;

  // Evento eliminar
  contenedor.addEventListener("click", (e) => {
    if (e.target.classList.contains("eliminar")) {
      const id = Number(e.target.dataset.id);
      eliminarDelCarrito(id);
    }
  });

  // Evento cambiar cantidad
  contenedor.addEventListener("input", (e) => {
    if (e.target.type === "number") {
      const id = Number(e.target.dataset.id);
      const nuevaCantidad = Number(e.target.value);
      cambiarCantidad(id, nuevaCantidad);
    }
  });

  // Render inicial al cargar la página
  renderCarrito();
}
