/**
 * ARCHIVO PRINCIPAL - index.js
 * Reemplaza bundle.js con la nueva arquitectura
 * 
 * INSTRUCCIONES EN HTML:
 * <script type="module" src="js/index.js"></script>
 */

import { initializeApp, checkAuthentication, applyRolePermissions, login, logout } from './app.js';
import { state, updateState } from './state.js';
import { showToast } from './ui.js';
import { initCategories } from './modules/categorias-v2.js';

// ========== EXPOSER FUNCIONES GLOBALES PARA HTML ==========
window.App = {
  // Control de sesión
  login: loginHandler,
  logout: logout,
  
  // Navegación
  navigateTo: navigateTo,
  
  // Categorías
  initCategories: initCategories,
};

// ========== MANEJO DE LOGIN ==========
async function loginHandler(e) {
  if (e) e.preventDefault();
  
  const username = document.getElementById('login-username')?.value;
  const password = document.getElementById('login-password')?.value;
  
  if (!username || !password) {
    showToast('Usuario y contraseña requeridos', 'error');
    return false;
  }
  
  try {
    const { login } = await import('./app.js');
    const success = await login(username, password);
    
    if (success) {
      // Esperar un poco y recargar
      setTimeout(() => location.reload(), 500);
    }
  } catch (error) {
    console.error('Error en login:', error);
    showToast('Error en autenticación', 'error');
  }
  
  return false;
}

// ========== NAVEGACIÓN ENTRE VISTAS ==========
function navigateTo(viewName) {
  // Esconder todas las vistas
  document.querySelectorAll('[id^="view-"]').forEach(el => {
    el.style.display = 'none';
  });
  
  // Mostrar la vista solicitada
  const view = document.getElementById(`view-${viewName}`);
  if (view) {
    view.style.display = 'block';
    
    // Inicializar módulo si existe
    if (viewName === 'categorias') {
      initCategories(view);
    }
    // Agregar más vistas según sea necesario
  }
}

// ========== INICIALIZACIÓN PRINCIPAL ==========
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 LUNA.JS iniciando...');
  
  // Verificar autenticación
  const isAuthenticated = checkAuthentication();
  
  if (isAuthenticated) {
    console.log('✅ Usuario autenticado');
    
    // Ocultar login, mostrar app
    const loginOverlay = document.getElementById('login-overlay');
    const appContainer = document.getElementById('app-container') || document.body;
    
    if (loginOverlay) loginOverlay.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';
    
    // Inicializar aplicación
    try {
      await initializeApp();
      applyRolePermissions();
      
      // Ir a home por defecto
      navigateTo('home');
      
    } catch (error) {
      console.error('Error inicializando app:', error);
      showToast('Error al inicializar la aplicación', 'error');
    }
  } else {
    console.log('❌ Usuario no autenticado, mostrando login');
    
    // Mostrar login
    const loginOverlay = document.getElementById('login-overlay');
    if (loginOverlay) loginOverlay.style.display = 'flex';
    
    // Bind login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', loginHandler);
    }
  }
});

// ========== EVENTOS GLOBALES ==========

// Cerrar sesión
window.addEventListener('logout', () => {
  logout();
});

// Manejo de errores global
window.addEventListener('error', (event) => {
  console.error('❌ Error global:', event.error);
  showToast('Error no manejado: ' + event.error?.message, 'error');
});

// Manejo de promesas rechazadas
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promesa rechazada:', event.reason);
  showToast('Error: ' + (event.reason?.message || 'Error desconocido'), 'error');
});

console.log('✅ Aplicación cargada y lista');
