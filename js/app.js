/**
 * INICIALIZACIÓN CORRECTA DE LA APP
 * 1. Cargar estado global
 * 2. Autenticar usuario
 * 3. Cargar recursos
 * 4. Inicializar módulos
 * 5. Iniciar auto-sync
 */

import { state, updateState, restoreStateFromLocalStorage, saveStateToLocalStorage } from './state.js';
import { loadAllResources, loadResource } from './apiV2.js';
import { showToast } from './ui.js';

/**
 * Inicializar la aplicación completa
 */
export async function initializeApp() {
  try {
    console.log('🚀 Iniciando aplicación...');

    // ✅ Paso 1: Restaurar estado desde localStorage
    restoreStateFromLocalStorage();
    console.log('✅ Estado restaurado');

    // ✅ Paso 2: Cargar todos los recursos desde API
    console.log('📥 Cargando recursos del servidor...');
    await loadAllResources();
    console.log('✅ Recursos cargados');

    // ✅ Paso 3: Inicializar módulos según necesidad
    console.log('⚙️ Inicializando módulos...');
    // Los módulos se inicializarán cuando se navegue a su vista

    // ✅ Paso 4: Iniciar auto-sync en background
    if (state.autoSync) {
      startAutoSync();
    }

    console.log('✅ App inicializada correctamente');
    showToast('✓ App lista', 'success');

    return true;

  } catch (error) {
    console.error('❌ Error inicializando app:', error);
    showToast('Error al inicializar la app', 'error');
    return false;
  }
}

/**
 * AUTO-SYNC EN BACKGROUND
 * Intenta sincronizar cada 15 segundos
 */
function startAutoSync() {
  console.log('🔄 Auto-sync iniciado (cada 15s)');

  setInterval(async () => {
    // Solo sincronizar si no hay modal abierto
    const modalOpen = document.querySelector('.modal-overlay');
    if (modalOpen) return;

    try {
      // Recargar recursos silenciosamente
      await loadAllResources();
      
      // Guardar estado
      saveStateToLocalStorage();

    } catch (error) {
      console.warn('⚠️ Auto-sync error:', error.message);
    }
  }, 15000); // 15 segundos
}

/**
 * LOGOUT - Limpiar sesión
 */
export function logout() {
  try {
    updateState('usuarioActual', null);
    updateState('rolActual', null);
    updateState('logueado', false);
    
    localStorage.removeItem('appState');
    localStorage.removeItem('usuarioActual');
    
    console.log('✅ Sesión cerrada');
    location.reload(); // Recargar para volver a login

  } catch (error) {
    console.error('Error en logout:', error);
  }
}

/**
 * VERIFICAR autenticación al cargar
 */
export function checkAuthentication() {
  const saved = localStorage.getItem('usuarioActual');
  if (saved) {
    try {
      const user = JSON.parse(saved);
      updateState('usuarioActual', user);
      updateState('rolActual', user.rol);
      updateState('logueado', true);
      console.log('✅ Usuario restaurado:', user.usuario);
      return true;
    } catch (error) {
      console.error('Error restaurando usuario:', error);
    }
  }
  return false;
}

/**
 * LOGIN - Autenticar usuario
 * @param {string} usuario - Username
 * @param {string} contraseña - Password
 * @returns {boolean}
 */
export async function login(usuario, contraseña) {
  try {
    console.log('🔐 Intentando login:', usuario);
    
    // Cargar usuarios si no están cargados
    if (!state.usuarios || state.usuarios.length === 0) {
      console.log('📥 Cargando usuarios...');
      await loadResource('usuarios');
    }
    
    const usuarios = state.usuarios || [];
    console.log('👥 Usuarios disponibles:', usuarios.length);
    
    const found = usuarios.find(u => 
      u.usuario === usuario && u.contraseña === contraseña && u.activo !== false
    );

    if (!found) {
      console.warn('❌ Credenciales incorrectas');
      showToast('Usuario o contraseña incorrectos', 'error');
      return false;
    }

    // ✅ Usuario autenticado
    updateState('usuarioActual', found);
    updateState('rolActual', found.rol);
    updateState('logueado', true);

    localStorage.setItem('usuarioActual', JSON.stringify(found));
    console.log('✅ Login exitoso:', found.usuario);

    showToast(`Bienvenido, ${found.nombre}`, 'success');
    return true;

  } catch (error) {
    console.error('❌ Error en login:', error);
    showToast('Error en login', 'error');
    return false;
  }
}

/**
 * Aplicar permisos por rol
 */
export function applyRolePermissions() {
  const rol = state.rolActual;

  // Actualizar label del rol en sidebar
  const roleLabel = document.getElementById('current-role-label');
  if (roleLabel) roleLabel.textContent = rol || 'N/A';

  // Ocultar/mostrar botones según data-role en el HTML
  document.querySelectorAll('.nav-btn[data-target]').forEach(btn => {
    const roles = (btn.getAttribute('data-role') || '').split(',').map(r => r.trim());
    if (rol && roles.includes(rol)) {
      btn.classList.remove('hidden');
      btn.style.display = '';
    } else {
      btn.classList.add('hidden');
    }
  });

  console.log(`✅ Permisos aplicados para rol: ${rol}`);
}

// ========== EXPORTAR PARA USO EN HTML ==========
window.App = {
  initialize: initializeApp,
  logout,
  checkAuthentication,
  login,
  applyRolePermissions
};

console.log('📦 App module loaded');
