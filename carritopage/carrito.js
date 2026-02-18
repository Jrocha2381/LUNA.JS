// carrito.js

import { productos } from "../js/data.js";


// ESTADO (localStorage)


let carrito = [];

// Cargar carrito si existe en localStorage
if (localStorage.getItem("carrito")) {
  carrito = JSON.parse(localStorage.getItem("carrito"));
}



// GUARDAR EN LOCALSTORAGE


function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(carrito));
}



// AGREGAR PRODUCTO


export function agregarAlCarrito(id) {

  // Buscar el producto en la lista
  let producto = null;

  for (let i = 0; i < productos.length; i++) {
    if (productos[i].id === id) {
      producto = productos[i];
      break;
    }
  }

  if (producto === null) {
    return;
  }

  // Verificar si ya existe en el carrito
  let existe = false;

  for (let i = 0; i < carrito.length; i++) {
    if (carrito[i].id === id) {
      carrito[i].cantidad = carrito[i].cantidad + 1;
      existe = true;
      break;
    }
  }

  // Si no existe, lo agregamos
  if (!existe) {
    let nuevoProducto = {
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1
    };

    carrito.push(nuevoProducto);
  }

  guardarCarrito();
  renderCarrito();
}



// ELIMINAR PRODUCTO


function eliminarDelCarrito(id) {

  let nuevoCarrito = [];

  for (let i = 0; i < carrito.length; i++) {
    if (carrito[i].id !== id) {
      nuevoCarrito.push(carrito[i]);
    }
  }

  carrito = nuevoCarrito;

  guardarCarrito();
  renderCarrito();
}



// CAMBIAR CANTIDAD

function cambiarCantidad(id, nuevaCantidad) {

  for (let i = 0; i < carrito.length; i++) {

    if (carrito[i].id === id) {

      if (nuevaCantidad < 1) {
        eliminarDelCarrito(id);
        return;
      }

      carrito[i].cantidad = nuevaCantidad;
      break;
    }
  }

  guardarCarrito();
  renderCarrito();
}


// CALCULAR TOTAL

function calcularTotal() {

  let total = 0;

  for (let i = 0; i < carrito.length; i++) {
    total = total + (carrito[i].precio * carrito[i].cantidad);
  }

  return total;
}


// RENDERIZAR CARRITO

function renderCarrito() {

  const contenedor = document.getElementById("carrito");

  if (!contenedor) {
    return;
  }

  if (carrito.length === 0) {
    contenedor.innerHTML = "<p>Carrito vacío</p>";
    return;
  }

  let html = "<h2>Productos en tu carrito</h2>";

  for (let i = 0; i < carrito.length; i++) {

    let p = carrito[i];

    html += `
      <div class="item-carrito">
        <h4>${p.nombre}</h4>

        <input 
          type="number"
          value="${p.cantidad}"
          min="1"
          data-id="${p.id}"
        >

        <p>Precio: $${p.precio}</p>
        <p>Subtotal: $${p.precio * p.cantidad}</p>

        <button class="eliminar" data-id="${p.id}">
          Eliminar
        </button>
      </div>
    `;
  }

  html += `
    <hr>
    <h3>Total: $${calcularTotal()}</h3>
  `;

  contenedor.innerHTML = html;
}



// ACTIVAR EVENTOS


export function activarEventosCarrito() {

  const contenedor = document.getElementById("carrito");

  if (!contenedor) {
    return;
  }

  // Evento eliminar
  contenedor.addEventListener("click", function(e) {

    if (e.target.classList.contains("eliminar")) {
      let id = Number(e.target.getAttribute("data-id"));
      eliminarDelCarrito(id);
    }

  });

  // Evento cambiar cantidad
  contenedor.addEventListener("input", function(e) {

    if (e.target.type === "number") {
      let id = Number(e.target.getAttribute("data-id"));
      let nuevaCantidad = Number(e.target.value);
      cambiarCantidad(id, nuevaCantidad);
    }

  });

  // Render inicial
  renderCarrito();
}
