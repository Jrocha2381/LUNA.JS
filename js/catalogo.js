import { productos } from "./data.js";
import { agregarAlCarrito } from "./carrito.js";

document.addEventListener("DOMContentLoaded", function () {
  const contenedor = document.getElementById("catalogo");
  const buscador = document.getElementById("buscador");

  if (!contenedor) return;

  // render inicial
  mostrarProductos(productos);

  if (buscador) {
    buscador.addEventListener("input", function (e) {
      const texto = (e.target.value || "").toLowerCase();

      const filtrados = productos.filter(function (producto) {
        const nombre = (producto.nombre || "").toLowerCase();
        const categoria = (producto.categoria || "").toLowerCase();
        return nombre.includes(texto) || categoria.includes(texto);
      });

      mostrarProductos(filtrados);
    });
  }

  contenedor.addEventListener("click", function (e) {
    const boton = e.target.closest(".btn-agregar");
    if (!boton) return;
    if (!contenedor.contains(boton)) return;

    const id = Number(boton.dataset.id);
    if (Number.isNaN(id)) return;

    agregarAlCarrito(id);
  });


  function mostrarProductos(lista) {
    if (!Array.isArray(lista) || lista.length === 0) {
      contenedor.innerHTML = "<p>No hay productos disponibles</p>";
      return;
    }

    contenedor.innerHTML = lista.map(function (producto) {
      var imagen = producto.imagen || "img/placeholder.png";
      var nombre = producto.nombre || "Sin nombre";
      var descripcion = producto.descripcion || "";
      var precioTexto = "";
      if (typeof producto.precio === "number") {
        precioTexto = producto.precio.toLocaleString();
      } else {
        precioTexto = producto.precio || "";
      }

      return (
        '<div class="card">' +
          '<img src="' + imagen + '" alt="' + nombre + '">' +
          '<h3>' + nombre + '</h3>' +
          '<p>' + descripcion + '</p>' +
          '<p><strong>$' + precioTexto + '</strong></p>' +
          '<button type="button" class="btn-agregar" data-id="' + producto.id + '">Agregar al carrito</button>' +
        '</div>'
      );
    }).join("");
  }

});
