import { productos } from "./data.js";
import { agregarAlCarrito } from "./carrito.js";

document.addEventListener("DOMContentLoaded", () => {
  const contenedor = document.getElementById("catalogo");
  const buscador = document.getElementById("buscador");

  mostrarProductos(productos);

  buscador.addEventListener("input", (e) => {
    const texto = e.target.value.toLowerCase();
    
    const filtrados = productos.filter(producto =>
      producto.nombre.toLowerCase().includes(texto) ||
      producto.categoria.toLowerCase().includes(texto)
    );

    mostrarProductos(filtrados);
  });

  contenedor.addEventListener("click", (e) => {
    if (e.target.classList.contains("btn-agregar")) {
      const id = Number(e.target.dataset.id);
      agregarAlCarrito(id);
    }
  });

  function mostrarProductos(lista) {

    if (lista.length === 0) {
      contenedor.innerHTML = "<p>No hay productos disponibles</p>";
      return;
    }

    contenedor.innerHTML = lista.map(producto => `
      <div class="card">
        <img src="${producto.imagen}" alt="${producto.nombre}">
        <h3>${producto.nombre}</h3>
        <p>${producto.descripcion}</p>
        <p><strong>$${producto.precio.toLocaleString()}</strong></p>
        <button class="btn-agregar" data-id="${producto.id}">
          Agregar al carrito
        </button>
      </div>
    `).join("");
  }

});
