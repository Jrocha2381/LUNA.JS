/**
 * ARCHIVO PRINCIPAL - index.js
 * Inicialización y navegación de la app
 */

import { initializeApp, checkAuthentication, applyRolePermissions, login, logout } from './app.js';
import { showToast, showError } from './ui.js';
import { initCategories } from './modules/categorias-v2.js';
import { init as initVentas, render as renderVentas } from './modules/ventas.js';
import { init as initProductos, render as renderProductos } from './modules/productos.js';
import { init as initHistorial, render as renderHistorial } from './modules/historial.js';
import { init as initClientes, render as renderClientes } from './modules/clientes.js';
import { init as initCompras, render as renderCompras } from './modules/compras.js';
import { init as initProveedores, render as renderProveedores } from './modules/proveedores.js';
import { init as initDescuentos, render as renderDescuentos } from './modules/descuentos.js';
import { init as initFaltantes, render as renderFaltantes } from './modules/faltantes.js';
import { init as initUsuarios, render as renderUsuarios } from './modules/usuarios.js';
import { loadAllResources } from './apiV2.js';

const VIEW_TITLES = {
  ventas: 'Nueva Venta',
  productos: 'Productos',
  historial: 'Historial de Ventas',
  clientes: 'Clientes',
  compras: 'Compras',
  proveedores: 'Proveedores',
  categorias: 'Categorías',
  descuentos: 'Descuentos',
  faltantes: 'Faltantes',
  usuarios: 'Gestión de Usuarios',
};

// Rastrear qué módulos ya fueron inicializados para no repetir init
const initialized = new Set();

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
async function navigateTo(viewName) {
  if (!viewName) return;

  document.querySelectorAll('.view').forEach(el => {
    el.classList.remove('active');
    el.style.display = 'none';
  });

  const view = document.getElementById(`view-${viewName}`);
  if (!view) return;

  view.classList.add('active');
  view.style.display = 'block';

  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('data-target') === viewName) {
      btn.classList.add('active');
    }
  });

  const titleEl = document.getElementById('page-title');
  if (titleEl) titleEl.textContent = VIEW_TITLES[viewName] || viewName;

  try {
    switch (viewName) {
      case 'ventas':
        if (!initialized.has('ventas')) { await initVentas(view); initialized.add('ventas'); }
        renderVentas();
        break;
      case 'productos':
        if (!initialized.has('productos')) { await initProductos(view); initialized.add('productos'); }
        renderProductos();
        break;
      case 'historial':
        if (!initialized.has('historial')) { await initHistorial(view); initialized.add('historial'); }
        await renderHistorial();
        break;
      case 'clientes':
        if (!initialized.has('clientes')) { await initClientes(view); initialized.add('clientes'); }
        renderClientes();
        break;
      case 'compras':
        if (!initialized.has('compras')) { await initCompras(view); initialized.add('compras'); }
        renderCompras();
        break;
      case 'proveedores':
        if (!initialized.has('proveedores')) { await initProveedores(view); initialized.add('proveedores'); }
        renderProveedores();
        break;
      case 'categorias':
        initCategories(view);
        break;
      case 'descuentos':
        if (!initialized.has('descuentos')) { await initDescuentos(view); initialized.add('descuentos'); }
        renderDescuentos();
        break;
      case 'faltantes':
        if (!initialized.has('faltantes')) { await initFaltantes(view); initialized.add('faltantes'); }
        renderFaltantes();
        break;
      case 'usuarios':
        if (!initialized.has('usuarios')) { await initUsuarios(view); initialized.add('usuarios'); }
        await renderUsuarios();
        break;
    }
  } catch (err) {
    console.error(`Error cargando vista ${viewName}:`, err);
    showError(`Error al cargar ${VIEW_TITLES[viewName] || viewName}`);
  }
}

// ========== CONFIGURAR LOGIN ==========
function setupLogin() {
  const loginForm = document.getElementById('login-form');
  const btnSubmit = document.getElementById('btn-login-submit');
  const usernameInput = document.getElementById('login-username');
  const passwordInput = document.getElementById('login-password');

  if (!loginForm || !btnSubmit) return;

  btnSubmit.addEventListener('click', async (e) => {
    e.preventDefault();
    await doLogin(usernameInput, passwordInput, btnSubmit);
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    await doLogin(usernameInput, passwordInput, btnSubmit);
  });

  if (passwordInput) {
    passwordInput.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        await doLogin(usernameInput, passwordInput, btnSubmit);
      }
    });
  }
}

async function doLogin(usernameInput, passwordInput, btnSubmit) {
  const username = usernameInput?.value?.trim();
  const password = passwordInput?.value;

  if (!username || !password) {
    showToast('Usuario y contraseña requeridos', 'error');
    return;
  }

  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Ingresando...';
  }

  try {
    const success = await login(username, password);
    if (success) {
      setTimeout(() => location.reload(), 500);
    } else {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Ingresar al Sistema';
      }
    }
  } catch (error) {
    console.error('Error login:', error);
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

  const syncBtn = document.getElementById('btn-sync');
  if (syncBtn) {
    syncBtn.addEventListener('click', async () => {
      syncBtn.disabled = true;
      syncBtn.innerHTML = '<i class="ph ph-arrows-clockwise"></i> Sincronizando...';
      try {
        await loadAllResources();
        showToast('Sincronización completada', 'success');
        initialized.clear();
        const activeView = document.querySelector('.view.active');
        if (activeView) {
          const viewName = activeView.id.replace('view-', '');
          await navigateTo(viewName);
        }
      } catch (e) {
        showToast('Error al sincronizar', 'error');
      } finally {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '<i class="ph ph-arrows-clockwise"></i> Sincronizar';
      }
    });
  }

  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('show'));
  }
}

// ========== INICIALIZACIÓN ==========
document.addEventListener('DOMContentLoaded', async () => {
  initTheme();

  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const btnThemeToggleLogin = document.getElementById('btn-theme-toggle-login');
  if (btnThemeToggle) btnThemeToggle.addEventListener('click', toggleTheme);
  if (btnThemeToggleLogin) btnThemeToggleLogin.addEventListener('click', toggleTheme);

  const isAuthenticated = checkAuthentication();

  if (isAuthenticated) {
    document.getElementById('login-overlay').style.display = 'none';
    document.querySelector('.app-layout').style.display = 'flex';

    try {
      await initializeApp();
      applyRolePermissions();
      setupNavigation();
      await navigateTo('ventas');
    } catch (error) {
      console.error('Error inicializando:', error);
      showToast('Error al inicializar', 'error');
    }
  } else {
    document.querySelector('.app-layout').style.display = 'none';
    document.getElementById('login-overlay').style.display = 'flex';
    setupLogin();
  }
});

window.App = { navigateTo, logout };
