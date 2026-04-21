/**
 * ARCHIVO PRINCIPAL - index.js
 * Inicialización y navegación de la app
 */

import { initializeApp, checkAuthentication, applyRolePermissions, login, logout } from './app.js';
import { showToast } from './ui.js';
import { initCategories } from './modules/categorias-v2.js';

// ========== TEMA (DARK/LIGHT) ==========
function initTheme() {
  const pref = localStorage.getItem('theme');
  if (pref === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  updateThemeIcons();
}

function updateThemeIcons() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const icon = isDark ? '<i class="ph ph-sun"></i>' : '<i class="ph ph-moon"></i>';
  
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const btnThemeToggleLogin = document.getElementById('btn-theme-toggle-login');
  
  if (btnThemeToggle) btnThemeToggle.innerHTML = icon;
  if (btnThemeToggleLogin) btnThemeToggleLogin.innerHTML = icon;
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if (isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }
  updateThemeIcons();
}

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
  console.log('🔐 Configurando login...');
  
  const loginForm = document.getElementById('login-form');
  const btnSubmit = document.getElementById('btn-login-submit');
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');
  
  if (!loginForm || !btnSubmit) {
    console.error('❌ Elementos de login no encontrados');
    return;
  }
  
  console.log('✅ Elementos encontrados');
  
  // Listener en botón
  btnSubmit.addEventListener('click', async (e) => {
    e.preventDefault();
    console.log('🔐 Click en botón login');
    await doLogin(usernameInput, passwordInput, btnSubmit);
  });
  
  // Listener en formulario
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('🔐 Submit formulario');
    await doLogin(usernameInput, passwordInput, btnSubmit);
  });
  
  // Enter en password
  if (passwordInput) {
    passwordInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        console.log('🔐 Enter en password');
        await doLogin(usernameInput, passwordInput, btnSubmit);
      }
    });
  }
  
  console.log('✅ Login listeners configurados');
}

async function doLogin(usernameInput, passwordInput, btnSubmit) {
  const username = usernameInput?.value?.trim();
  const password = passwordInput?.value;
  
  console.log('🔐 Login intento:', username);
  
  if (!username || !password) {
    console.warn('⚠️ Campos vacíos:', { username, password });
    showToast('Usuario y contraseña requeridos', 'error');
    return;
  }
  
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Ingresando...';
  }
  
  try {
    const success = await login(username, password);
    console.log('📝 Resultado login:', success);
    
    if (success) {
      console.log('✅ Login exitoso, recargando...');
      setTimeout(() => {
        console.log('🔄 Recargar página');
        location.reload();
      }, 500);
    } else {
      console.warn('❌ Login retornó false');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Ingresar al Sistema';
      }
    }
  } catch (error) {
    console.error('❌ Error login:', error);
    showToast('Error en login', 'error');
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Ingresar al Sistema';
    }
  }
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
  
  // Inicializar tema
  initTheme();
  
  // Configurar botones de tema
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const btnThemeToggleLogin = document.getElementById('btn-theme-toggle-login');
  
  if (btnThemeToggle) btnThemeToggle.addEventListener('click', toggleTheme);
  if (btnThemeToggleLogin) btnThemeToggleLogin.addEventListener('click', toggleTheme);
  
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
