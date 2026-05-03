// js/data.js
// Fuente de datos principal (localStorage) con opción de sincronización futura vía `window.Backend`.

const STORAGE_PRODUCTOS_KEY = "productos";
const STORAGE_CODIGO_CONTADOR_KEY = "productosCodigoContador";
const CATEGORIAS_PERMITIDAS = ["Escolar", "Oficina", "Arte", "Papeleria"];

// Datos fallback (solo para desarrollo local). En producción deberían venir de backend/base de datos.
const productosIniciales = [];

function limpiarTexto(valor) {
  return String(valor || "").trim();
}

function textoNormalizado(valor) {
  return limpiarTexto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function toNumber(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function toBoolean(valor) {
  if (typeof valor === "boolean") return valor;
  return String(valor).toUpperCase() === "TRUE";
}

function normalizarCategoriaPermitida(categoria) {
  const entrada = textoNormalizado(categoria);
  return (
    CATEGORIAS_PERMITIDAS.find((cat) => textoNormalizado(cat) === entrada) ||
    limpiarTexto(categoria) ||
    ""
  );
}

function obtenerSiguienteId(lista) {
  return lista.length ? Math.max(...lista.map((p) => Number(p.id) || 0)) + 1 : 1;
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
  const codigos = new Set((lista || []).map((p) => limpiarTexto(p.codigoInterno)));
  let codigo = "";

  do {
    secuencia += 1;
    codigo = construirCodigoInterno(categoria, secuencia);
  } while (codigos.has(codigo));

  guardarConsecutivoCodigo(secuencia);
  return codigo;
}

function normalizarProducto(producto, listaExistente = []) {
  const categoria = normalizarCategoriaPermitida(producto.categoria) || CATEGORIAS_PERMITIDAS[0];
  const precioVenta = toNumber(producto.precioVenta ?? producto.precio);
  const seguimientoInventario = toBoolean(producto.seguimientoInventario ?? true);
  const stock = seguimientoInventario ? Math.max(0, toNumber(producto.stock)) : 0;
  const codigoInterno = limpiarTexto(producto.codigoInterno) || generarCodigoInterno(categoria, listaExistente);

  return {
    id: producto.id != null ? Number(producto.id) : obtenerSiguienteId(listaExistente),
    nombre: limpiarTexto(producto.nombre),
    categoria,
    categoriaId: producto.categoriaId || null, // NEW: Relación a entidad categoría
    precioVenta: Math.max(0, precioVenta),
    precio: Math.max(0, precioVenta),
    costo: Math.max(0, toNumber(producto.costo)),
    proveedorId: producto.proveedorId || null, // NEW: Relación a entidad proveedor
    seguimientoInventario,
    stock,
    codigoInterno,
    imagen: limpiarTexto(producto.imagen),
    descripcion: limpiarTexto(producto.descripcion),
    activo: producto.activo !== false
  };
}

function cargarProductos() {
  const saved = localStorage.getItem(STORAGE_PRODUCTOS_KEY);
  const base = saved ? JSON.parse(saved) : productosIniciales.slice();
  return (base || []).map((item) => normalizarProducto(item, base || []));
}

let productos = cargarProductos();

function obtenerProductos() {
  return productos;
}

function guardarProductos(nuevosProductos = productos) {
  productos = (nuevosProductos || []).map((item) => normalizarProducto(item, nuevosProductos || []));
  localStorage.setItem(STORAGE_PRODUCTOS_KEY, JSON.stringify(productos));
  window.productos = productos;
  window.dispatchEvent(new CustomEvent("productosActualizados", { detail: productos }));
  return productos;
}

if (!localStorage.getItem(STORAGE_PRODUCTOS_KEY)) {
  guardarProductos(productos);
}

async function sincronizarProductosBackend() {
  if (!window.Backend || !window.Backend.isEnabled || !window.Backend.isEnabled()) return false;
  try {
    const productosAPI = await window.Backend.get("productos");
    if (productosAPI && Array.isArray(productosAPI)) {
      guardarProductos(productosAPI);
      return true;
    }
  } catch (error) {
    console.error("❌ Error sincronizando productos con backend:", error);
  }
  return false;
}

// Mantener compatibilidad: nombre histórico
async function sincronizarProductosAPI() {
  return sincronizarProductosBackend();
}

// Auto-sincronizar solo si el backend está habilitado.
if (document.readyState === "complete" || document.readyState === "interactive") {
  try {
    sincronizarProductosBackend();
  } catch (e) {
    // noop
  }
} else {
  document.addEventListener("DOMContentLoaded", () => {
    try {
      sincronizarProductosBackend();
    } catch (e) {
      // noop
    }
  });
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
  if (errores.length) return { ok: false, errores };

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
  if (index < 0) return { ok: false, errores: ["Producto no encontrado."] };

  const productoBase = listaActual[index];
  const payload = { ...productoBase, ...cambios };
  const errores = validarProducto(payload);
  if (errores.length) return { ok: false, errores };

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

// ============================================
// SISTEMA DE VENTAS ABIERTAS (NEW)
// ============================================
const STORAGE_VENTAS_ABIERTAS_KEY = "ventas_abiertas";
const STORAGE_CARRITO_ACTUAL_KEY = "carrito_actual";

/**
 * Obtiene lista de ventas abiertas desde localStorage
 * Estructura: { id, creada, ultimaEdicion, items: [...] }
 */
function obtenerVentasAbiertas() {
  const saved = localStorage.getItem(STORAGE_VENTAS_ABIERTAS_KEY);
  return saved ? JSON.parse(saved) : [];
}

/**
 * Guarda lista de ventas abiertas
 */
function guardarVentasAbiertas(ventas) {
  localStorage.setItem(STORAGE_VENTAS_ABIERTAS_KEY, JSON.stringify(ventas || []));
  window.dispatchEvent(new CustomEvent("ventasAbiertasActualizadas", { detail: ventas }));
}

/**
 * Obtiene el carrito actual en progreso
 */
function obtenerCarritoActual() {
  const saved = localStorage.getItem(STORAGE_CARRITO_ACTUAL_KEY);
  return saved ? JSON.parse(saved) : { items: [], total: 0 };
}

/**
 * Guarda carrito actual en progreso
 */
function guardarCarritoActual(carrito) {
  localStorage.setItem(STORAGE_CARRITO_ACTUAL_KEY, JSON.stringify(carrito || { items: [], total: 0 }));
  window.dispatchEvent(new CustomEvent("carritoActualActualizado", { detail: carrito }));
}

/**
 * Limpia el carrito actual (después de cerrar venta)
 */
function limpiarCarritoActual() {
  localStorage.removeItem(STORAGE_CARRITO_ACTUAL_KEY);
  window.dispatchEvent(new CustomEvent("carritoActualActualizado", { detail: { items: [], total: 0 } }));
}

/**
 * Crea una nueva venta abierta
 * @returns { id, creada, ultimaEdicion, items: [], clienteId, clienteNombre, metodoPago }
 */
function crearVentaAbierta() {
  const nuevaVenta = {
    id: `VENTA-${Date.now()}${Math.random().toString(36).substring(2, 5)}`,
    creada: new Date().toLocaleString('es-CO'),
    ultimaEdicion: new Date().toLocaleString('es-CO'),
    items: [],
    clienteId: null,
    clienteNombre: null, // NEW: Cache de nombre de cliente
    metodoPago: "Efectivo"
  };

  const ventas = obtenerVentasAbiertas();
  ventas.push(nuevaVenta);
  guardarVentasAbiertas(ventas);
  guardarCarritoActual(nuevaVenta.items);

  return nuevaVenta;
}

/**
 * Agrega un producto al carrito de una venta abierta
 */
function agregarItemVentaAbierta(ventaId, producto, cantidad = 1) {
  const ventas = obtenerVentasAbiertas();
  const ventaIndex = ventas.findIndex(v => v.id === ventaId);

  if (ventaIndex < 0) {
    throw new Error(`Venta ${ventaId} no encontrada`);
  }

  const venta = ventas[ventaIndex];
  cantidad = Math.max(1, Math.floor(Number(cantidad)));

  const itemExistente = venta.items.find(item => Number(item.id) === Number(producto.id));

  if (itemExistente) {
    itemExistente.cantidad += cantidad;
  } else {
    venta.items.push({
      id: producto.id,
      nombre: producto.nombre,
      precioVenta: producto.precioVenta || producto.precio,
      cantidad: cantidad,
      costo: producto.costo || 0
    });
  }

  venta.ultimaEdicion = new Date().toLocaleString('es-CO');
  guardarVentasAbiertas(ventas);
  guardarCarritoActual(venta.items);

  return venta;
}

/**
 * Actualiza cantidad de un item en venta abierta
 */
function actualizarItemVentaAbierta(ventaId, productoId, cantidad) {
  const ventas = obtenerVentasAbiertas();
  const ventaIndex = ventas.findIndex(v => v.id === ventaId);

  if (ventaIndex < 0) throw new Error(`Venta ${ventaId} no encontrada`);

  const venta = ventas[ventaIndex];
  const item = venta.items.find(it => Number(it.id) === Number(productoId));

  if (!item) throw new Error(`Producto ${productoId} no en venta`);

  cantidad = Math.max(1, Math.floor(Number(cantidad)));
  item.cantidad = cantidad;
  venta.ultimaEdicion = new Date().toLocaleString('es-CO');

  guardarVentasAbiertas(ventas);
  guardarCarritoActual(venta.items);

  return venta;
}

/**
 * Elimina item de venta abierta
 */
function eliminarItemVentaAbierta(ventaId, productoId) {
  const ventas = obtenerVentasAbiertas();
  const ventaIndex = ventas.findIndex(v => v.id === ventaId);

  if (ventaIndex < 0) throw new Error(`Venta ${ventaId} no encontrada`);

  const venta = ventas[ventaIndex];
  venta.items = venta.items.filter(it => Number(it.id) !== Number(productoId));
  venta.ultimaEdicion = new Date().toLocaleString('es-CO');

  guardarVentasAbiertas(ventas);
  guardarCarritoActual(venta.items);

  return venta;
}

/**
 * Obtiene una venta abierta específica
 */
function obtenerVentaAbierta(ventaId) {
  const ventas = obtenerVentasAbiertas();
  return ventas.find(v => v.id === ventaId) || null;
}

/**
 * Calcula total de una venta abierta
 */
function calcularTotalVenta(venta) {
  if (!venta || !venta.items) return 0;
  return venta.items.reduce((sum, item) => sum + (item.precioVenta * item.cantidad), 0);
}

/**
 * Edita datos de una venta abierta (cliente, método pago, etc)
 */
function actualizarDatosVentaAbierta(ventaId, cambios) {
  const ventas = obtenerVentasAbiertas();
  const ventaIndex = ventas.findIndex(v => v.id === ventaId);

  if (ventaIndex < 0) throw new Error(`Venta ${ventaId} no encontrada`);

  const venta = ventas[ventaIndex];
  venta.clienteId = cambios.clienteId !== undefined ? cambios.clienteId : venta.clienteId;
  venta.metodoPago = cambios.metodoPago || venta.metodoPago;
  venta.ultimaEdicion = new Date().toLocaleString('es-CO');

  guardarVentasAbiertas(ventas);
  return venta;
}

/**
 * Cierra una venta abierta (la mueve a historial de ventas)
 * No elimina de ventas abiertas, solo marca como cerrada
 */
function cerrarVentaAbierta(ventaId, total, valorRecibido = 0) {
  const ventas = obtenerVentasAbiertas();
  const venta = ventas.find(v => v.id === ventaId);

  if (!venta) throw new Error(`Venta ${ventaId} no encontrada`);

  // Crear snapshot para historial
  const ventaCerrada = {
    id: ventaId,
    fecha: venta.creada,
    clienteId: venta.clienteId || "",
    metodoPago: venta.metodoPago || "Efectivo",
    total: Number(total) || 0,
    itemsJson: JSON.stringify(venta.items.map(item => ({
      id: item.id,
      nombre: item.nombre,
      precio: item.precioVenta,
      costo: item.costo || 0,
      cantidad: item.cantidad
    })))
  };

  // Eliminar de ventas abiertas
  const ventasActualizadas = ventas.filter(v => v.id !== ventaId);
  guardarVentasAbiertas(ventasActualizadas);
  limpiarCarritoActual();

  return ventaCerrada;
}

/**
 * Elimina una venta abierta (sin guardar historial)
 */
function eliminarVentaAbierta(ventaId) {
  const ventas = obtenerVentasAbiertas();
  const ventasActualizadas = ventas.filter(v => v.id !== ventaId);
  guardarVentasAbiertas(ventasActualizadas);
  limpiarCarritoActual();
}

// Exponer funciones de ventas abiertas globalmente
window.obtenerVentasAbiertas = obtenerVentasAbiertas;
window.guardarVentasAbiertas = guardarVentasAbiertas;
window.obtenerCarritoActual = obtenerCarritoActual;
window.guardarCarritoActual = guardarCarritoActual;
window.limpiarCarritoActual = limpiarCarritoActual;
window.crearVentaAbierta = crearVentaAbierta;
window.agregarItemVentaAbierta = agregarItemVentaAbierta;
window.actualizarItemVentaAbierta = actualizarItemVentaAbierta;
window.eliminarItemVentaAbierta = eliminarItemVentaAbierta;
window.obtenerVentaAbierta = obtenerVentaAbierta;
window.calcularTotalVenta = calcularTotalVenta;
window.actualizarDatosVentaAbierta = actualizarDatosVentaAbierta;
window.cerrarVentaAbierta = cerrarVentaAbierta;
window.eliminarVentaAbierta = eliminarVentaAbierta;
window.sincronizarProductosAPI = sincronizarProductosAPI;
window.sincronizarProductosBackend = sincronizarProductosBackend;

