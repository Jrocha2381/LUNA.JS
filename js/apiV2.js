/**
 * API MEJORADA - Offline First
 * 1. Guardar en localStorage SIEMPRE
 * 2. Intentar sincronizar con Sheets
 * 3. Fallback a localStorage si falla
 */

import { state, updateState, saveStateToLocalStorage } from './state.js';

const BASE_API = "https://script.google.com/macros/s/AKfycbwBqWV20EZVA9HEyMCYUwCo_vy9U2lH5byRYNg5vGI68rwp_raTbMA8f1l4aEFJ6rmI/exec";

/**
 * CARGAR datos desde Google Sheets
 * @param {string} resource - Recurso a cargar (productos, categorias, etc)
 * @returns {Promise<Array>} Array de datos
 */
export async function loadResource(resource) {
  const cacheKey = `cache_${resource}`;
  
  try {
    console.log(`📥 Cargando ${resource}...`);
    
    const response = await fetch(`${BASE_API}?resource=${resource}&_t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const json = await response.json();
    if (!json.success) throw new Error(json.message || 'API error');
    
    const data = json.data || [];
    
    // ✅ Guardar en localStorage como backup
    localStorage.setItem(cacheKey, JSON.stringify(data));
    
    // ✅ Actualizar state
    updateState(resource, data);
    
    console.log(`✅ ${resource} cargados (${data.length} items)`);
    return data;
    
  } catch (error) {
    console.warn(`⚠️ Error cargando ${resource}, usando localStorage:`, error.message);
    
    // Fallback: cargar del localStorage
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        const data = JSON.parse(cached);
        updateState(resource, data);
        console.log(`📦 ${resource} restaurados desde cache local (${data.length} items)`);
        return data;
      } catch (e) {
        console.error('❌ Error parseando cache:', e);
      }
    }
    
    // Fallback final: devolver array vacío
    return [];
  }
}

/**
 * GUARDAR datos en Google Sheets
 * Estrategia: localStorage PRIMERO, luego Sheets
 * @param {string} resource - Recurso a guardar
 * @param {Object} item - Item a guardar
 * @returns {Promise<{success: boolean, localSaved: boolean, remoteSaved: boolean}>}
 */
export async function saveItem(resource, item) {
  if (!item?.id) {
    console.error('❌ Item debe tener ID');
    return { success: false, localSaved: false, remoteSaved: false };
  }

  let localSaved = false;
  let remoteSaved = false;

  try {
    // ✅ PASO 1: Guardar en localStorage
    const cacheKey = `cache_${resource}`;
    let items = [];
    
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      items = JSON.parse(cached);
    }
    
    const existingIdx = items.findIndex(x => String(x.id) === String(item.id));
    if (existingIdx > -1) {
      items[existingIdx] = { ...items[existingIdx], ...item };
    } else {
      items.unshift(item);
    }
    
    localStorage.setItem(cacheKey, JSON.stringify(items));
    updateState(resource, items);
    localSaved = true;
    console.log(`✅ Guardado en localStorage: ${resource}/${item.id}`);
    
    // ✅ PASO 2: Intentar sincronizar con Sheets
    try {
      const payload = JSON.stringify({
        action: 'save',
        resource: resource,
        id: item.id,
        data: item
      });
      
      const response = await fetch(BASE_API, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: payload
      });
      
      if (response.ok) {
        const json = await response.json();
        if (json.success) {
          remoteSaved = true;
          console.log(`☁️ Sincronizado con Sheets: ${resource}/${item.id}`);
        }
      }
    } catch (apiError) {
      console.warn(`⚠️ API no disponible, guardado solo en localStorage:`, apiError.message);
    }
    
    return { 
      success: true, 
      localSaved, 
      remoteSaved,
      message: remoteSaved ? '✓ Guardado en línea' : '⚠ Guardado localmente'
    };
    
  } catch (error) {
    console.error(`❌ Error guardando ${resource}:`, error);
    return { 
      success: localSaved, 
      localSaved, 
      remoteSaved: false,
      message: localSaved ? '⚠ Guardado localmente' : '❌ Error'
    };
  }
}

/**
 * ELIMINAR datos (soft delete)
 * @param {string} resource - Recurso
 * @param {string} id - ID del item a eliminar
 * @returns {Promise<boolean>}
 */
export async function deleteItem(resource, id) {
  try {
    // ✅ PASO 1: Eliminar de localStorage
    const cacheKey = `cache_${resource}`;
    let items = [];
    
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      items = JSON.parse(cached);
    }
    
    items = items.filter(x => String(x.id) !== String(id));
    localStorage.setItem(cacheKey, JSON.stringify(items));
    updateState(resource, items);
    console.log(`✅ Eliminado localmente: ${resource}/${id}`);
    
    // ✅ PASO 2: Intentar eliminar en Sheets
    const response = await fetch(`${BASE_API}?resource=${resource}&action=delete&id=${id}`);
    if (response.ok) {
      console.log(`☁️ Eliminado en Sheets: ${resource}/${id}`);
      return true;
    }
    
    return true; // Éxito local aunque falle remote
    
  } catch (error) {
    console.error(`❌ Error eliminando ${resource}:`, error);
    return true; // Éxito local
  }
}

/**
 * CARGAR TODOS los recursos en paralelo
 * @returns {Promise<void>}
 */
export async function loadAllResources() {
  console.log('🔄 Cargando todos los recursos...');
  
  const resources = [
    'productos',
    'categorias',
    'ventas',
    'compras',
    'clientes',
    'proveedores',
    'usuarios'
  ];
  
  await Promise.all(resources.map(r => loadResource(r)));
  
  console.log('✅ Todos los recursos cargados');
}
