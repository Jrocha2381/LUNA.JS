// js/buscador.js
// Usar funciones globales (definidas en data.js y carritopage/carrito.js)

function listaBuscable() {
  return obtenerProductos().filter((p) => p.activo !== false);
}

function precioVenta(producto) {
  return Number(producto.precioVenta ?? producto.precio ?? 0);
}

function resolverRutaImagenBuscador(ruta) {
  const valor = String(ruta || "").trim();
  if (!valor) return "";
  if (/^(data:|https?:|blob:|file:)/i.test(valor)) return valor;

  const path = window.location.pathname.toLowerCase().replace(/\\/g, "/");
  const enSeccion = path.includes("/secciones/");
  const enCarrito = path.includes("/carritopage/");

  if (enSeccion) {
    if (valor.startsWith("../../") || valor.startsWith("../")) return valor;
    if (valor.startsWith("images/") || valor.startsWith("img/")) return `../../${valor}`;
    return valor;
  }

  if (enCarrito) {
    if (valor.startsWith("../../")) return valor.replace(/^(\.\.\/){2}/, "../");
    if (valor.startsWith("images/") || valor.startsWith("img/")) return `../${valor}`;
    return valor;
  }

  if (valor.startsWith("../../")) return valor.replace(/^(\.\.\/){2}/, "");
  if (valor.startsWith("../")) return valor.replace(/^\.\.\//, "");
  return valor;
}

function filtrarProductos(textoBusqueda) {
  if (!textoBusqueda.trim()) {
    return [];
  }

  const texto = textoBusqueda.toLowerCase().trim();

  return listaBuscable().filter(
    (p) =>
      p.nombre.toLowerCase().includes(texto) ||
      p.categoria.toLowerCase().includes(texto) ||
      p.descripcion.toLowerCase().includes(texto)
  );
}

function activarBuscadorHeader() {
  const inputBuscar = document.getElementById("input-buscar-header");
  const btnBuscar = document.getElementById("btn-buscar-header");
  const resultadosContainer = document.getElementById("resultados-busqueda");

  if (!inputBuscar) return;

  function mostrarResultados(textoBusqueda) {
    const productosFiltrados = filtrarProductos(textoBusqueda);

    if (!productosFiltrados.length) {
      resultadosContainer.innerHTML = `
        <div class="resultados-vacio">
          <p>No se encontraron productos con "${textoBusqueda}"</p>
        </div>
      `;
      return;
    }

    let html = `
      <div class="resultados-header">
        <h3>Resultados para "${textoBusqueda}" — ${productosFiltrados.length} producto(s)</h3>
        <button id="cerrar-resultados" class="btn-cerrar-resultados">Cerrar</button>
      </div>
      <div class="resultados-grid">
    `;

    productosFiltrados.forEach((producto) => {
      const tieneStock = !producto.seguimientoInventario || producto.stock > 0;
      html += `
        <div class="resultado-card" style="${!tieneStock ? "opacity: 0.6;" : ""}">
          <img src="${resolverRutaImagenBuscador(producto.imagen)}" alt="${producto.nombre}" />
          <h4>${producto.nombre}</h4>
          <p class="categoria-tag">${producto.categoria}</p>
          <p class="precio">$${precioVenta(producto).toLocaleString()}</p>
          <p class="stock">${producto.seguimientoInventario ? `Stock: ${producto.stock} unidades` : "Inventario libre"}</p>
          <button class="btn-agregar-resultado"
                  data-id="${producto.id}"
                  ${!tieneStock ? "disabled" : ""}>
            ${tieneStock ? "Anadir" : "Agotado"}
          </button>
        </div>
      `;
    });

    html += `</div>`;
    resultadosContainer.innerHTML = html;

    const botonesAgregar = document.querySelectorAll(".btn-agregar-resultado");
    botonesAgregar.forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = Number(btn.dataset.id);
        const productoParaAgregar = obtenerProductos().find((p) => p.id === id);
        if (productoParaAgregar) {
          agregarAlCarrito(productoParaAgregar);
        }
      });
    });

    const btnCerrar = document.getElementById("cerrar-resultados");
    if (btnCerrar) {
      btnCerrar.addEventListener("click", () => {
        resultadosContainer.innerHTML = "";
        inputBuscar.value = "";
      });
    }
  }

  inputBuscar.addEventListener("input", (e) => {
    const texto = e.target.value.trim();
    if (texto) {
      mostrarResultados(texto);
    } else {
      resultadosContainer.innerHTML = "";
    }
  });

  if (btnBuscar) {
    btnBuscar.addEventListener("click", () => {
      const texto = inputBuscar.value.trim();
      if (texto) {
        mostrarResultados(texto);
      }
    });
  }

  inputBuscar.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const texto = inputBuscar.value.trim();
      if (texto) {
        mostrarResultados(texto);
      }
    }
  });
}

function activarBuscadorCarrito() {
  const inputBuscar = document.getElementById("input-buscar");
  const btnBuscar = document.getElementById("btn-buscar");
  const btnLimpiar = document.getElementById("btn-limpiar");
  const resultadosBusqueda = document.getElementById("resultados-busqueda");

  if (!inputBuscar) return;

  function renderCarritoFiltrado(productosFiltrados) {
    const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
    const contenedor = document.getElementById("carrito");

    const carritoFiltrado = carrito.filter((item) => productosFiltrados.some((p) => p.id === item.id));

    if (!carritoFiltrado.length) {
      contenedor.innerHTML = `
        <div style="text-align:center; padding: 50px;">
          <p>No hay productos que coincidan en tu carrito.</p>
        </div>
      `;
      return;
    }

    let html = "";
    let totalGeneral = 0;

    carritoFiltrado.forEach((p) => {
      const indexReal = carrito.findIndex((item) => item.id === p.id);
      const subtotal = precioVenta(p) * p.cantidad;
      totalGeneral += subtotal;

      html += `
        <div class="item-carrito">
          <img src="${resolverRutaImagenBuscador(p.imagen)}" alt="${p.nombre}" class="img-carrito">
          <div class="info-carrito">
            <h4>${p.nombre}</h4>
            <p>Precio: $${precioVenta(p).toLocaleString()}</p>
            <div class="controles-cantidad">
              <button class="btn-qty" data-action="restar" data-index="${indexReal}">-</button>
              <input type="number" value="${p.cantidad}" readonly class="input-cantidad">
              <button class="btn-qty" data-action="sumar" data-index="${indexReal}">+</button>
            </div>
          </div>
          <div class="controles-item">
            <p><strong>Subtotal: $${subtotal.toLocaleString()}</strong></p>
            <button class="btn-eliminar" data-index="${indexReal}">Eliminar</button>
          </div>
        </div>
      `;
    });

    html += `
      <div class="carrito-total">
        <hr>
        <h3>Total de busqueda: $${totalGeneral.toLocaleString()}</h3>
      </div>
    `;

    contenedor.innerHTML = html;
    asignarEventosBotones();
  }

  function buscarEnCarrito(textoBusqueda) {
    const productosFiltrados = filtrarProductos(textoBusqueda);

    if (!productosFiltrados.length) {
      resultadosBusqueda.textContent = `No se encontraron productos con "${textoBusqueda}"`;
      document.getElementById("carrito").innerHTML = `
        <div style="text-align:center; padding: 50px;">
          <p>No hay productos que coincidan.</p>
        </div>
      `;
      return;
    }

    resultadosBusqueda.textContent = `Resultados para "${textoBusqueda}": ${productosFiltrados.length} producto(s)`;
    renderCarritoFiltrado(productosFiltrados);
  }

  inputBuscar.addEventListener("input", (e) => {
    const texto = e.target.value.trim();
    if (texto) {
      buscarEnCarrito(texto);
    } else {
      resultadosBusqueda.textContent = "";
      renderCarrito();
    }
  });

  if (btnBuscar) {
    btnBuscar.addEventListener("click", () => {
      const texto = inputBuscar.value.trim();
      if (texto) {
        buscarEnCarrito(texto);
      }
    });
  }

  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      inputBuscar.value = "";
      resultadosBusqueda.textContent = "";
      renderCarrito();
    });
  }

  inputBuscar.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      const texto = inputBuscar.value.trim();
      if (texto) {
        buscarEnCarrito(texto);
      }
    }
  });
}

// Exponer en global
window.filtrarProductos = filtrarProductos;
window.activarBuscadorHeader = activarBuscadorHeader;
window.activarBuscadorCarrito = activarBuscadorCarrito;

