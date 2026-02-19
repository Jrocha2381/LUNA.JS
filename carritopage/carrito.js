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

 if (!existe) {
    carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen: producto.imagen, // <-- Línea clave para la imagen
      cantidad: 1
    });
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

    const rutaImagen = p.imagen.includes('img/') ? `../${p.imagen}` : `../img/${p.imagen}`;

    html += `
      <div class="item-carrito">
        <img src="${rutaImagen}" alt="${p.nombre}" class="img-carrito">
        
        <div class="info-carrito">
            <h4>${p.nombre}</h4>
            <p>Precio: $${p.precio.toLocaleString()}</p>
            <p><strong>Subtotal: $${(p.precio * p.cantidad).toLocaleString()}</strong></p>
        </div>

        <div class="controles-item">
            <input 
              type="number"
              value="${p.cantidad}"
              min="1"
              data-id="${p.id}"
            >
            <button class="eliminar" data-id="${p.id}">Eliminar</button>
        </div>
      </div>
    `;
  }

  html += `
    <hr>
    <h3>Total: $${calcularTotal().toLocaleString()}</h3>
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