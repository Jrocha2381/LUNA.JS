// js/catalogo.js (usa funciones globales definidas en data.js y carrito.js)

const contenedor = document.querySelector(".productos__container");
const buscador = document.querySelector("#buscador");

function normalizarCategoria(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function obtenerCategoriaPaginaActual() {
  const path = window.location.pathname.toLowerCase().replace(/\\/g, "/");
  if (path.includes("/secciones/escolar/")) return "Escolar";
  if (path.includes("/secciones/oficina/")) return "Oficina";
  if (path.includes("/secciones/arte/")) return "Arte";
  if (path.includes("/secciones/papeleria/")) return "Papeleria";
  return null;
}

function resolverRutaImagenCatalogo(ruta) {
  const valor = String(ruta || "").trim();
  if (!valor) return "";
  if (/^(data:|https?:|blob:|file:)/i.test(valor)) return valor;

  const path = window.location.pathname.toLowerCase().replace(/\\/g, "/");
  const enSeccion = path.includes("/secciones/");

  if (enSeccion) {
    if (valor.startsWith("../../") || valor.startsWith("../")) return valor;
    if (valor.startsWith("images/") || valor.startsWith("img/")) return `../../${valor}`;
    return valor;
  }

  if (valor.startsWith("../../")) return valor.replace(/^(\.\.\/){2}/, "");
  if (valor.startsWith("../")) return valor.replace(/^\.\.\//, "");
  return valor;
}

function obtenerProductosActivos() {
  const categoriaPagina = obtenerCategoriaPaginaActual();
  const activos = obtenerProductos().filter((producto) => producto.activo !== false);

  if (!categoriaPagina) return activos;

  const categoriaNormalizada = normalizarCategoria(categoriaPagina);
  return activos.filter(
    (producto) => normalizarCategoria(producto.categoria) === categoriaNormalizada
  );
}

function renderizarProductos(productosFiltrados = obtenerProductosActivos()) {
  if (!contenedor) return;
  contenedor.innerHTML = "";

  productosFiltrados.forEach((producto) => {
    const tieneStock = !producto.seguimientoInventario || producto.stock > 0;

    contenedor.innerHTML += `
      <div class="card" style="${!tieneStock ? "opacity: 0.6;" : ""}">
        <img src="${resolverRutaImagenCatalogo(producto.imagen)}" alt="${producto.nombre}" />
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
