/**
 * ESTADO GLOBAL CENTRALIZADO
 * Single source of truth para toda la aplicación
 */

export let state = {
  // ====== COLECCIONES PRINCIPALES ======
  productos: [],
  ventas: [],
  compras: [],
  clientes: [],
  proveedores: [],
  categorias: [],
  usuarios: [],

  // ====== CONTROL DE VENTA ACTUAL ======
  ventaActual: null,
  ventasAbiertas: [],

  // ====== USUARIO AUTENTICADO ======
  usuarioActual: null,
  rolActual: null,
  logueado: false,

  // ====== CONTADORES Y UTILIDADES ======
  nextProductCode: 1,
  nextSaleId: 1,
  eliminados: [],
  autoSync: true,
};

/**
 * Actualizar estado de forma segura
 * @param {string} path - Ruta del estado (ej: "categorias")
 * @param {*} value - Nuevo valor
 */
export function updateState(path, value) {
  const keys = path.split('.');
  let current = state;
  for (let i = 0; i < keys.length - 1; i++) {
    current = current[keys[i]];
  }
  current[keys[keys.length - 1]] = value;
  console.log(`📊 Estado actualizado: ${path}`, value);
}

/**
 * Obtener valor del estado
 * @param {string} path - Ruta del estado
 * @returns {*} Valor del estado
 */
export function getState(path) {
  const keys = path.split('.');
  let current = state;
  for (const key of keys) {
    current = current[key];
    if (current === undefined) return undefined;
  }
  return current;
}

/**
 * Guardar estado completo en localStorage como backup
 */
export function saveStateToLocalStorage() {
  try {
    localStorage.setItem('appState', JSON.stringify(state));
    console.log('✅ Estado guardado en localStorage');
  } catch (error) {
    console.error('❌ Error guardando estado:', error);
  }
}

/**
 * Restaurar estado desde localStorage
 */
export function restoreStateFromLocalStorage() {
  try {
    const saved = localStorage.getItem('appState');
    if (saved) {
      const restored = JSON.parse(saved);
      Object.assign(state, restored);
      console.log('✅ Estado restaurado desde localStorage');
      return true;
    }
  } catch (error) {
    console.error('❌ Error restaurando estado:', error);
  }
  return false;
}
