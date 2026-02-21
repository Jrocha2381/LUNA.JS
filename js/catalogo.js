// js/catalogo.js
import { obtenerProductos } from "./data.js";
import { agregarAlCarrito } from "../carritopage/carrito.js";

const contenedor = document.querySelector(".productos__container");
const buscador = document.querySelector("#buscador");

function obtenerProductosActivos() {
  return obtenerProductos().filter((producto) => producto.activo !== false);
}

function renderizarProductos(productosFiltrados = obtenerProductosActivos()) {
  if (!contenedor) return;
  contenedor.innerHTML = "";

  productosFiltrados.forEach((producto) => {
    const tieneStock = !producto.seguimientoInventario || producto.stock > 0;

    contenedor.innerHTML += `
      <div class="card" style="${!tieneStock ? "opacity: 0.6;" : ""}">
        <img src="${producto.imagen}" alt="${producto.nombre}" />
        <h3>${producto.nombre}</h3>
        <p class="precio">$${producto.precioVenta.toLocaleString()}</p>
        <p class="stock">${producto.seguimientoInventario ? `Disponibles: ${producto.stock}` : "Inventario libre"}</p>
        <button class="btn-agregar"
                data-id="${producto.id}"
                ${!tieneStock ? 'disabled style="background: #ccc; border-color: #ccc; cursor: not-allowed;"' : ""}>
          ${tieneStock ? "Anadir al carrito" : "Agotado"}
        </button>
      </div>
    `;
  });

  activarBotones();
}

function activarBotones() {
  const botones = document.querySelectorAll(".btn-agregar");
  botones.forEach((boton) => {
    boton.addEventListener("click", () => {
      const id = Number(boton.dataset.id);
      const productoParaAgregar = obtenerProductos().find((p) => p.id === id);

      if (productoParaAgregar) {
        agregarAlCarrito(productoParaAgregar);
      }
    });
  });
}

if (buscador) {
  buscador.addEventListener("input", (e) => {
    const texto = e.target.value.toLowerCase();
    const filtrados = obtenerProductosActivos().filter((p) => p.nombre.toLowerCase().includes(texto));
    renderizarProductos(filtrados);
  });
}

renderizarProductos();
