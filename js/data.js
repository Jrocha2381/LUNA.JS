// js/data.js
const STORAGE_PRODUCTOS_KEY = "productos";
const STORAGE_CODIGO_CONTADOR_KEY = "productosCodigoContador";
const CATEGORIAS_PERMITIDAS = ["Escolar", "Oficina", "Arte", "Papeleria"];

const productosIniciales = [
  { id: 1, nombre: "Cuaderno Profesional", categoria: "Escolar", precioVenta: 12000, costo: 7000, imagen: "../../images/cuaderno.png", descripcion: "Cuaderno argollado profesional", seguimientoInventario: true, stock: 15, activo: true },
  { id: 2, nombre: "Pegastick", categoria: "Escolar", precioVenta: 3000, costo: 1200, imagen: "../../images/Pegastick.png", descripcion: "Pegante en barra de alta calidad", seguimientoInventario: true, stock: 25, activo: true },
  { id: 3, nombre: "Marcador Permanente", categoria: "Escolar", precioVenta: 4000, costo: 1800, imagen: "../../images/marcadores.png", descripcion: "Marcador negro punta gruesa", seguimientoInventario: true, stock: 30, activo: true },
  { id: 4, nombre: "Pinturas", categoria: "Arte", precioVenta: 12000, costo: 6500, imagen: "../../images/pintura.png", descripcion: "Set de pinturas acrilicas", seguimientoInventario: true, stock: 12, activo: true },
  { id: 5, nombre: "Plastilina", categoria: "Arte", precioVenta: 3000, costo: 1300, imagen: "../../images/plastilina.png", descripcion: "Barra de plastilina de colores", seguimientoInventario: true, stock: 40, activo: true },
  { id: 6, nombre: "Pinceles", categoria: "Arte", precioVenta: 4000, costo: 1700, imagen: "../../images/pinceles.jpeg", descripcion: "Set de pinceles variados", seguimientoInventario: true, stock: 20, activo: true },
  { id: 7, nombre: "Carpeta Plastica", categoria: "Oficina", precioVenta: 5000, costo: 2100, imagen: "../../images/carpeta.png", descripcion: "Carpeta con broche resistente", seguimientoInventario: true, stock: 50, activo: true },
  { id: 8, nombre: "Calculadora Basica", categoria: "Oficina", precioVenta: 25000, costo: 16000, imagen: "../../images/calculadora.webp", descripcion: "Calculadora de 8 digitos", seguimientoInventario: true, stock: 15, activo: true },
  { id: 9, nombre: "Agenda 2026", categoria: "Oficina", precioVenta: 18000, costo: 9800, imagen: "../../images/agenda.png", descripcion: "Agenda diaria ejecutiva", seguimientoInventario: true, stock: 100, activo: true },
  { id: 10, nombre: "Cinta Adhesiva", categoria: "Papeleria", precioVenta: 12000, costo: 6700, imagen: "../../images/cinta.png", descripcion: "Cinta adhesiva transparente", seguimientoInventario: true, stock: 60, activo: true },
  { id: 11, nombre: "Papel de Pintura", categoria: "Papeleria", precioVenta: 3000, costo: 1100, imagen: "../../images/papelp.jpeg", descripcion: "Pliego de papel para arte", seguimientoInventario: true, stock: 80, activo: true },
  { id: 12, nombre: "Tijeras", categoria: "Papeleria", precioVenta: 4000, costo: 2200, imagen: "../../images/tijeras.png", descripcion: "Tijeras de corte preciso", seguimientoInventario: true, stock: 35, activo: true }
];

function limpiarTexto(valor) {
  return String(valor || "").trim();
}

function textoNormalizado(valor) {
  return limpiarTexto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalizarCategoriaPermitida(categoria) {
  const entrada = textoNormalizado(categoria);
  return (
    CATEGORIAS_PERMITIDAS.find((cat) => textoNormalizado(cat) === entrada) ||
    ""
  );
}

function toNumber(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function slugCategoria(categoria) {
  const base = limpiarTexto(categoria)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();
  return base || "PROD";
}

function obtenerConsecutivoCodigo() {
  const guardado = Number(localStorage.getItem(STORAGE_CODIGO_CONTADOR_KEY));
  return Number.isInteger(guardado) && guardado > 0 ? guardado : 0;
}

function guardarConsecutivoCodigo(valor) {
  localStorage.setItem(STORAGE_CODIGO_CONTADOR_KEY, String(valor));
}

function construirCodigoInterno(categoria, secuencia) {
  return `${slugCategoria(categoria)}-${String(secuencia).padStart(4, "0")}`;
}

function generarCodigoInterno(categoria, lista = []) {
  let secuencia = Math.max(obtenerConsecutivoCodigo(), 0);
  const codigos = new Set(lista.map((p) => p.codigoInterno));
  let codigo = "";

  do {
    secuencia += 1;
    codigo = construirCodigoInterno(categoria, secuencia);
  } while (codigos.has(codigo));

  guardarConsecutivoCodigo(secuencia);
  return codigo;
}

function normalizarProducto(producto, listaExistente = []) {
  const precioVenta = toNumber(producto.precioVenta ?? producto.precio);
  const seguimientoInventario = Boolean(producto.seguimientoInventario ?? true);
  const stock = seguimientoInventario ? Math.max(0, toNumber(producto.stock)) : 0;
  const categoria = normalizarCategoriaPermitida(producto.categoria) || CATEGORIAS_PERMITIDAS[0];
  const codigoInterno = limpiarTexto(producto.codigoInterno) || generarCodigoInterno(categoria, listaExistente);

  return {
    id: Number(producto.id),
    nombre: limpiarTexto(producto.nombre),
    categoria,
    precioVenta: Math.max(0, precioVenta),
    precio: Math.max(0, precioVenta),
    costo: Math.max(0, toNumber(producto.costo)),
    seguimientoInventario,
    stock,
    codigoInterno,
    imagen: limpiarTexto(producto.imagen),
    descripcion: limpiarTexto(producto.descripcion),
    activo: producto.activo !== false
  };
}

function obtenerSiguienteId(lista) {
  return lista.length ? Math.max(...lista.map((p) => Number(p.id) || 0)) + 1 : 1;
}

function obtenerProductos() {
  return productos;
}

function guardarProductos(nuevosProductos = productos) {
  productos = nuevosProductos.map((item) => normalizarProducto(item, nuevosProductos));
  localStorage.setItem(STORAGE_PRODUCTOS_KEY, JSON.stringify(productos));
  // Mantener referencia global actualizada
  window.productos = productos;
  return productos;
}

function cargarProductos() {
  const saved = localStorage.getItem(STORAGE_PRODUCTOS_KEY);
  const base = saved ? JSON.parse(saved) : productosIniciales.slice();
  return base.map((item) => normalizarProducto(item, base));
}

var productos = cargarProductos();

if (!localStorage.getItem(STORAGE_PRODUCTOS_KEY)) {
  guardarProductos(productos);
}

function validarProducto(input) {
  const errores = [];
  const nombre = limpiarTexto(input.nombre);
  const categoria = normalizarCategoriaPermitida(input.categoria);
  const precioVenta = toNumber(input.precioVenta);
  const costo = toNumber(input.costo);
  const seguimientoInventario = Boolean(input.seguimientoInventario);
  const stock = toNumber(input.stock);

  if (!nombre) errores.push("El nombre es obligatorio.");
  if (!categoria) errores.push("La categoria debe ser Escolar, Oficina, Arte o Papeleria.");
  if (!Number.isFinite(precioVenta) || precioVenta < 0) errores.push("El precio de venta debe ser un numero no negativo.");
  if (!Number.isFinite(costo) || costo < 0) errores.push("El costo debe ser un numero no negativo.");
  if (seguimientoInventario && (!Number.isFinite(stock) || stock < 0)) {
    errores.push("El stock debe ser un numero no negativo cuando hay seguimiento de inventario.");
  }

  return errores;
}

function crearProducto(input) {
  const errores = validarProducto(input);
  if (errores.length) {
    return { ok: false, errores };
  }

  const listaActual = obtenerProductos();
  const nuevo = normalizarProducto(
    {
      ...input,
      id: obtenerSiguienteId(listaActual),
      codigoInterno: generarCodigoInterno(input.categoria, listaActual),
      activo: true
    },
    listaActual
  );

  const nuevaLista = [...listaActual, nuevo];
  guardarProductos(nuevaLista);
  return { ok: true, producto: nuevo, productos: nuevaLista };
}

function actualizarProducto(id, cambios) {
  const listaActual = obtenerProductos();
  const index = listaActual.findIndex((p) => Number(p.id) === Number(id));
  if (index < 0) {
    return { ok: false, errores: ["Producto no encontrado."] };
  }

  const productoBase = listaActual[index];
  const payload = { ...productoBase, ...cambios };
  const errores = validarProducto(payload);
  if (errores.length) {
    return { ok: false, errores };
  }

  const actualizado = normalizarProducto(payload, listaActual);
  const nuevaLista = [...listaActual];
  nuevaLista[index] = actualizado;
  guardarProductos(nuevaLista);
  return { ok: true, producto: actualizado, productos: nuevaLista };
}

function inactivarProducto(id) {
  return actualizarProducto(id, { activo: false });
}

function reactivarProducto(id) {
  return actualizarProducto(id, { activo: true });
}

function eliminarProducto(id) {
  const listaActual = obtenerProductos();
  const nuevaLista = listaActual.filter((p) => Number(p.id) !== Number(id));
  if (nuevaLista.length === listaActual.length) {
    return { ok: false, errores: ["Producto no encontrado."] };
  }
  guardarProductos(nuevaLista);
  return { ok: true, productos: nuevaLista };
}

// Exponer en global para uso sin módulos
window.obtenerProductos = obtenerProductos;
window.guardarProductos = guardarProductos;
window.productos = productos;
window.validarProducto = validarProducto;
window.crearProducto = crearProducto;
window.actualizarProducto = actualizarProducto;
window.inactivarProducto = inactivarProducto;
window.reactivarProducto = reactivarProducto;
window.eliminarProducto = eliminarProducto;
window.CATEGORIAS_PERMITIDAS = CATEGORIAS_PERMITIDAS;
