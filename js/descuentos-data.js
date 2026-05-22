// js/descuentos-data.js
// CRUD y sincronización de descuentos conectada a SQLite mediante window.Backend.

(function () {
  const STORAGE_DESCUENTOS_KEY = "descuentos";
  const DESCUENTOS_SYNC_INTERVAL_MS = 10000;

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

  function backendDisponible() {
    return Boolean(window.Backend && window.Backend.isEnabled && window.Backend.isEnabled());
  }

  function normalizarDescuento(descuento) {
    const tipo = limpiarTexto(descuento.tipo);
    const valor = toNumber(descuento.valor);
    const activo = toBoolean(descuento.activo ?? true);

    return {
      id: descuento.id != null ? Number(descuento.id) : null,
      nombre: limpiarTexto(descuento.nombre),
      tipo: tipo === "fijo" ? "fijo" : "porcentaje",
      valor: Math.max(0, valor),
      activo
    };
  }

  function serializarParaDb(input) {
    return {
      nombre: limpiarTexto(input.nombre),
      tipo: limpiarTexto(input.tipo) === "fijo" ? "fijo" : "porcentaje",
      valor: Math.max(0, toNumber(input.valor)),
      activo: toBoolean(input.activo)
    };
  }

  let descuentos = [];

  function obtenerDescuentos() {
    return descuentos;
  }

  function guardarDescuentos(nuevos = []) {
    descuentos = (nuevos || []).map(normalizarDescuento);
    localStorage.setItem(STORAGE_DESCUENTOS_KEY, JSON.stringify(descuentos));
    window.descuentos = descuentos;
    window.dispatchEvent(new CustomEvent("descuentosActualizados", { detail: descuentos }));
    return descuentos;
  }

  function cargarLocales() {
    try {
      const raw = localStorage.getItem(STORAGE_DESCUENTOS_KEY) || "[]";
      const lista = JSON.parse(raw);
      return Array.isArray(lista) ? lista.map(normalizarDescuento) : [];
    } catch (_e) {
      return [];
    }
  }

  function mensajeErrorBackend(error, fallback) {
    const payload = error && error.payload;
    if (payload && payload.error) return String(payload.error);
    if (payload && payload.message) return String(payload.message);
    if (error && error.message) return String(error.message);
    return fallback;
  }

  function validarDescuento(input) {
    const errores = [];
    const payload = serializarParaDb(input);

    if (!payload.nombre) errores.push("El nombre es obligatorio.");
    if (!["porcentaje", "fijo"].includes(payload.tipo)) errores.push("El tipo debe ser porcentaje o fijo.");
    if (payload.valor < 0) errores.push("El valor debe ser no negativo.");
    if (payload.tipo === "porcentaje" && payload.valor > 100) errores.push("El porcentaje no puede ser mayor a 100.");

    return { errores, payload };
  }

  async function sincronizarDescuentosBackend() {
    if (!backendDisponible()) return false;
    try {
      const api = await window.Backend.get("descuentos");
      if (Array.isArray(api)) {
        guardarDescuentos(api);
        return true;
      }
    } catch (e) {
      console.error("Error sincronizando descuentos:", e);
    }
    return false;
  }

  async function crearDescuento(input) {
    try {
      const { errores, payload } = validarDescuento(input);
      if (errores.length) return { ok: false, errores };
      if (!backendDisponible()) return { ok: false, errores: ["El backend no esta disponible para crear descuentos."] };

      const creado = await window.Backend.post("descuentos", payload);
      const lista = await window.Backend.get("descuentos");
      guardarDescuentos(lista);
      return { ok: true, descuento: normalizarDescuento(creado), descuentos };
    } catch (e) {
      console.error("Error creando descuento:", e);
      return { ok: false, errores: [mensajeErrorBackend(e, "No se pudo crear el descuento.")] };
    }
  }

  async function actualizarDescuento(id, cambios) {
    try {
      const { errores, payload } = validarDescuento(cambios);
      if (errores.length) return { ok: false, errores };
      if (!backendDisponible()) return { ok: false, errores: ["El backend no esta disponible para actualizar descuentos."] };

      const actualizado = await window.Backend.put(`descuentos/${id}`, payload);
      const lista = await window.Backend.get("descuentos");
      guardarDescuentos(lista);
      return { ok: true, descuento: normalizarDescuento(actualizado), descuentos };
    } catch (e) {
      console.error("Error actualizando descuento:", e);
      return { ok: false, errores: [mensajeErrorBackend(e, "No se pudo actualizar el descuento.")] };
    }
  }

  async function eliminarDescuento(id) {
    try {
      if (!backendDisponible()) return { ok: false, errores: ["El backend no esta disponible para eliminar descuentos."] };
      await window.Backend.delete(`descuentos/${id}`);
      const lista = await window.Backend.get("descuentos");
      guardarDescuentos(lista);
      return { ok: true, descuentos };
    } catch (e) {
      console.error("Error eliminando descuento:", e);
      return { ok: false, errores: [mensajeErrorBackend(e, "No se pudo eliminar el descuento.")] };
    }
  }

  descuentos = cargarLocales();
  window.descuentos = descuentos;

  if (document.readyState === "complete" || document.readyState === "interactive") {
    sincronizarDescuentosBackend().catch(() => {});
  } else {
    document.addEventListener("DOMContentLoaded", () => {
      sincronizarDescuentosBackend().catch(() => {});
    });
  }

  setInterval(() => {
    sincronizarDescuentosBackend().catch(() => {});
  }, DESCUENTOS_SYNC_INTERVAL_MS);

  window.obtenerDescuentos = obtenerDescuentos;
  window.guardarDescuentos = guardarDescuentos;
  window.validarDescuento = validarDescuento;
  window.crearDescuento = crearDescuento;
  window.actualizarDescuento = actualizarDescuento;
  window.eliminarDescuento = eliminarDescuento;
  window.sincronizarDescuentosBackend = sincronizarDescuentosBackend;
})();

