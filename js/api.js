﻿export const BASE_API = "https://script.google.com/macros/s/AKfycbwBqWV20EZVA9HEyMCYUwCo_vy9U2lH5byRYNg5vGI68rwp_raTbMA8f1l4aEFJ6rmI/exec";

// Data falsa temporal por si el servidor falla y limpiar cache viejo
const localDB = {
  productos: [],
  categorias: [],
  clientes: [],
  proveedores: [],
  ventas: [],
  compras: [],
  usuarios: [],
};

// GET DTO Optimista con Local Storage Firme
export async function getEntities(resource) {
  const cacheKey = "cpos_cache_" + resource;
  const localCache = localStorage.getItem(cacheKey);

  const fetchPromise = fetch(
    `${BASE_API}?resource=${resource}&_t=${Date.now()}`,
  )
    .then(async (res) => {
      if (!res.ok) throw new Error("Error HTTP " + res.status);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      const freshData = json.data || [];
      localStorage.setItem(cacheKey, JSON.stringify(freshData));

      window.dispatchEvent(
        new CustomEvent("sync_" + resource, { detail: freshData }),
      );
      if (resource === "productos") {
        window.dispatchEvent(
          new CustomEvent("cambioCatalogo", { detail: freshData }),
        );
      }
      return freshData;
    })
    .catch((error) => {
      console.warn(
        "Aviso de red o hoja no encontrada para " +
          resource +
          ", usando local.",
      );
      let existingLocal = localStorage.getItem(cacheKey);
      if (!existingLocal) {
        localStorage.setItem(cacheKey, JSON.stringify(localDB[resource] || []));
        return localDB[resource] || [];
      }
      return JSON.parse(existingLocal);
    });

  if (localCache) {
    // Sincroniza en background sin bloquear
    fetchPromise.catch((e) => console.warn(e));
    return JSON.parse(localCache);
  }
  return await fetchPromise;
}

// POST/PUT/DELETE DTO: Operación Local Automática (Offline First Muteado Error)
export async function saveEntity(resource, dataObj, action = "upsert") {
  try {
    const cacheKey = "cpos_cache_" + resource;
    let localStr = localStorage.getItem(cacheKey);
    let dataArr = localStr ? JSON.parse(localStr) : localDB[resource] || [];

    if (action === "delete") {
      dataArr = dataArr.filter((x) => String(x.id) !== String(dataObj.id));
    } else {
      const idx = dataArr.findIndex((x) => String(x.id) === String(dataObj.id));
      if (idx > -1) dataArr[idx] = { ...dataArr[idx], ...dataObj };
      else dataArr.unshift(dataObj);
    }
    // Siempre GUARDAR a localStorage sin importar si backend falla
    localStorage.setItem(cacheKey, JSON.stringify(dataArr));

    const payload = {
      resource,
      action: action === "delete" ? "delete" : "save",
      id: String(dataObj.id || ""),
      data: dataObj,
    };

    const postData = {
      method: "POST",
      mode: "no-cors", // Ayuda a mitigar bloqueos en entornos locales restringidos
      // Eliminamos el header de JSON para evitar errores de CORS (Preflight OPTIONS) 
      // Google Apps Script recibirá el body igualmente en e.postData.contents
      body: JSON.stringify(payload),
    };

    const res = await fetch(`${BASE_API}?resource=${resource}`, postData);
    if (!res.ok) throw new Error("HTTP POST " + res.status);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    return { ...json, data: json.data || dataObj };
  } catch (error) {
    console.warn(
      `Error de red al guardar '${resource}' en Sheets. El elemento fue guardado localmente (Offline): ${error}`,
    );
    // No hacer el throw, permitir que la App continúe su camino exitoso offline
    return { success: true, localOnly: true, data: dataObj };
  }
}

// Helper wrapper para eliminar
export async function deleteEntity(resource, id) {
  return saveEntity(resource, { id }, "delete");
}
