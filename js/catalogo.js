// js/catalogo.js
import { productos } from "./data.js";
import { agregarAlCarrito } from "../carritopage/js/carrito.js";

const contenedor = document.querySelector(".productos__container");

function renderizarProductos() {
  if (!contenedor) return;
  contenedor.innerHTML = "";

  productos.forEach(producto => {
    contenedor.innerHTML += `
      <div class="card">
        <img src="${producto.imagen}" alt="${producto.nombre}" />
        <h3>${producto.nombre}</h3>
        <p class="precio">$${producto.precio.toLocaleString()}</p>
        <button class="btn-agregar" data-id="${producto.id}">
          Añadir al carrito
        </button>
      </div>
    `;
  });

  activarBotones();
}

function activarBotones() {
  const botones = document.querySelectorAll(".btn-agregar");

  botones.forEach(boton => {
    boton.addEventListener("click", () => {
      const id = Number(boton.dataset.id);
      
      // BUSCAMOS EL OBJETO COMPLETO
      const productoParaAgregar = productos.find(p => p.id === id);
      
      if (productoParaAgregar) {
        agregarAlCarrito(productoParaAgregar);
      }
    });
  });
}

// Inicializar
renderizarProductos();