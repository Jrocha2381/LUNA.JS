// js/data.js
// Fuente principal de productos conectada a SQLite mediante window.Backend.

const STORAGE_PRODUCTOS_KEY = "productos";
const PRODUCTOS_SYNC_INTERVAL_MS = 8000;

function limpiarTexto(valor) {
  return String(valor || "").trim();
}

function toNumber(valor) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
}

function toBoolean(valor) {
  if (typeof valor === "boolean") return valor;
  return String(valor).toLowerCase() === "true" || String(valor).toLowerCase() === "on";
}

function backendDisponibleProductos() {
  return Boolean(window.Backend && window.Backend.isEnabled && window.Backend.isEnabled());
}

function obtenerCategoriasLocales() {
  try {
    const raw = localStorage.getItem("pos_categorias") || "[]";
    const lista = JSON.parse(raw);
    return Array.isArray(lista) ? lista : [];
  } catch (_error) {
    return [];
  }
}

function nombreCategoriaPorId(categoriaId) {
  const categoria = obtenerCategoriasLocales().find((item) => String(item.id) === String(categoriaId));
  return categoria ? categoria.nombre : "";
}

function normalizarProducto(producto) {
  const categoriaId = producto.categoriaId != null && producto.categoriaId !== "" ? Number(producto.categoriaId) : null;
  const precio = toNumber(producto.precio);
  const costo = toNumber(producto.costo);
  const stock = Math.max(0, Math.floor(toNumber(producto.stock)));
  const seguimientoInventario = toBoolean(producto.seguimientoInventario ?? true);

  return {
    id: producto.id != null ? Number(producto.id) : null,
    nombre: limpiarTexto(producto.nombre),
    categoriaId,
    precio,
    precioVenta: precio,
    costo,
    stock,
    seguimientoInventario,
    categoria: nombreCategoriaPorId(categoriaId),
    activo: true
  };
}

function serializarProductoParaDb(input) {
  return {
    nombre: limpiarTexto(input.nombre),
    categoriaId: input.categoriaId != null && input.categoriaId !== "" ? Number(input.categoriaId) : null,
    precio: toNumber(input.precio ?? input.precioVenta),
    costo: toNumber(input.costo),
    stock: Math.max(0, Math.floor(toNumber(input.stock))),
    seguimientoInventario: toBoolean(input.seguimientoInventario)
  };
}

let productos = [];

function obtenerProductos() {
  return productos;
}

function guardarProductos(nuevosProductos = []) {
  productos = (nuevosProductos || []).map(normalizarProducto);
  localStorage.setItem(STORAGE_PRODUCTOS_KEY, JSON.stringify(productos));
  window.productos = productos;
  window.dispatchEvent(new CustomEvent("productosActualizados", { detail: productos }));
  return productos;
}

function cargarProductosLocales() {
  try {
    const raw = localStorage.getItem(STORAGE_PRODUCTOS_KEY) || "[]";
    const lista = JSON.parse(raw);
    return Array.isArray(lista) ? lista.map(normalizarProducto) : [];
  } catch (_error) {
    return [];
  }
}

async function sincronizarProductosBackend() {
  if (!backendDisponibleProductos()) return false;
  try {
    const productosAPI = await window.Backend.get("productos");
    if (Array.isArray(productosAPI)) {
      guardarProductos(productosAPI);
      return true;
    }
  } catch (error) {
    console.error("Error sincronizando productos con backend:", error);
  }
  return false;
}

async function sincronizarProductosAPI() {
  return sincronizarProductosBackend();
}

function validarProducto(input) {
  const errores = [];
  const payload = serializarProductoParaDb(input);

  if (!payload.nombre) errores.push("El nombre es obligatorio.");
  if (!Number.isInteger(payload.categoriaId) || payload.categoriaId <= 0) {
    errores.push("Debes seleccionar una categoria valida.");
  }
  if (payload.precio < 0) errores.push("El precio debe ser un numero no negativo.");
  if (payload.costo < 0) errores.push("El costo debe ser un numero no negativo.");
  if (payload.stock < 0) errores.push("El stock debe ser un numero no negativo.");

  return errores;
}

async function crearProducto(input) {
  try {
    const errores = validarProducto(input);
    if (errores.length) return { ok: false, errores };
    if (!backendDisponibleProductos()) {
      return { ok: false, errores: ["El backend no esta disponible para crear productos."] };
    }

    const creado = await window.Backend.post("productos", serializarProductoParaDb(input));
    const lista = await window.Backend.get("productos");
    guardarProductos(lista);
    return { ok: true, producto: normalizarProducto(creado), productos };
  } catch (error) {
    console.error("Error creando producto:", error);
    return { ok: false, errores: [mensajeErrorBackend(error, "No se pudo crear el producto.")] };
  }
}

async function actualizarProducto(id, cambios) {
  try {
    const errores = validarProducto(cambios);
    if (errores.length) return { ok: false, errores };
    if (!backendDisponibleProductos()) {
      return { ok: false, errores: ["El backend no esta disponible para actualizar productos."] };
    }

    const actualizado = await window.Backend.put(`productos/${id}`, serializarProductoParaDb(cambios));
    const lista = await window.Backend.get("productos");
    guardarProductos(lista);
    return { ok: true, producto: normalizarProducto(actualizado), productos };
  } catch (error) {
    console.error("Error actualizando producto:", error);
    return { ok: false, errores: [mensajeErrorBackend(error, "No se pudo actualizar el producto.")] };
  }
}

async function eliminarProducto(id) {
  try {
    if (!backendDisponibleProductos()) {
      return { ok: false, errores: ["El backend no esta disponible para eliminar productos."] };
    }

    await window.Backend.delete(`productos/${id}`);
    const lista = await window.Backend.get("productos");
    guardarProductos(lista);
    return { ok: true, productos };
  } catch (error) {
    console.error("Error eliminando producto:", error);
    return { ok: false, errores: [mensajeErrorBackend(error, "No se pudo eliminar el producto.")] };
  }
}

function mensajeErrorBackend(error, fallback) {
  const payload = error && error.payload;
  if (payload && Array.isArray(payload.errors) && payload.errors.length) {
    return payload.errors.map((item) => item.msg || item.message || String(item)).join(" ");
  }
  if (payload && payload.error) return String(payload.error);
  if (payload && payload.message) return String(payload.message);
  if (error && error.message) return String(error.message);
  return fallback;
}

async function inactivarProducto(id) {
  return eliminarProducto(id);
}

async function reactivarProducto(_id) {
  return { ok: false, errores: ["La base de datos no maneja estado activo/inactivo para productos."] };
}

productos = cargarProductosLocales();
window.productos = productos;

if (document.readyState === "complete" || document.readyState === "interactive") {
  sincronizarProductosBackend().catch(() => {});
} else {
  document.addEventListener("DOMContentLoaded", () => {
    sincronizarProductosBackend().catch(() => {});
  });
}

setInterval(() => {
  sincronizarProductosBackend().catch(() => {});
}, PRODUCTOS_SYNC_INTERVAL_MS);

window.obtenerProductos = obtenerProductos;
window.guardarProductos = guardarProductos;
window.validarProducto = validarProducto;
window.crearProducto = crearProducto;
window.actualizarProducto = actualizarProducto;
window.inactivarProducto = inactivarProducto;
window.reactivarProducto = reactivarProducto;
window.eliminarProducto = eliminarProducto;
window.sincronizarProductosAPI = sincronizarProductosAPI;
window.sincronizarProductosBackend = sincronizarProductosBackend;
