/**
 * ARCHIVO PRINCIPAL - index.js
 * Inicialización y navegación de la app
 */

import { initializeApp, checkAuthentication, applyRolePermissions, login, logout } from './app.js';
import { showToast } from './ui.js';
import { initCategories } from './modules/categorias-v2.js';

// ========== NAVEGACIÓN ENTRE VISTAS ==========
function navigateTo(viewName) {
  if (!viewName) return;
  
  document.querySelectorAll('.view').forEach(el => {
    el.classList.remove('active');
    el.style.display = 'none';
  });
  
  const view = document.getElementById(`view-${viewName}`);
  if (view) {
    view.classList.add('active');
    view.style.display = 'block';
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.getAttribute('data-target') === viewName) {
        btn.classList.add('active');
      }
    });
    
    if (viewName === 'categorias') {
      initCategories(view);
    }
  }
}

// ========== CONFIGURAR LOGIN ==========
function setupLogin() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('login-username')?.value?.trim();
    const password = document.getElementById('login-password')?.value;
    
    if (!username || !password) {
      showToast('Usuario y contraseña requeridos', 'error');
      return;
    }
    
    const btnSubmit = document.getElementById('btn-login-submit');
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Ingresando...';
    }
    
    try {
      console.log('🔐 Login:', username);
      const success = await login(username, password);
      
      if (success) {
        console.log('✅ Login ok, recargando...');
        setTimeout(() => location.reload(), 500);
      } else {
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = 'Ingresar al Sistema';
        }
      }
    } catch (error) {
      console.error('❌ Error:', error);
      showToast('Error en login', 'error');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Ingresar al Sistema';
      }
    }
  });
}

// ========== CONFIGURAR NAVEGACIÓN ==========
function setupNavigation() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      if (target) navigateTo(target);
    });
  });
  
  const logoutBtn = document.getElementById('btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => logout());
  }
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 LUNA.JS iniciando...');
  
  const isAuthenticated = checkAuthentication();
  
  if (isAuthenticated) {
    console.log('✅ Autenticado');
    
    document.getElementById('login-overlay').style.display = 'none';
    document.querySelector('.app-layout').style.display = 'flex';
    
    try {
      await initializeApp();
      applyRolePermissions();
      setupNavigation();
      navigateTo('ventas');
    } catch (error) {
      console.error('❌ Error:', error);
      showToast('Error al inicializar', 'error');
    }
  } else {
    console.log('❌ No autenticado');
    
    document.querySelector('.app-layout').style.display = 'none';
    document.getElementById('login-overlay').style.display = 'flex';
    setupLogin();
  }
});

window.App = { navigateTo, logout };
console.log('✅ App cargada');
