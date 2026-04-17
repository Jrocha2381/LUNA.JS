import { showToast, showError } from './ui.js';
import * as ModuleProductos from './modules/productos.js';
import * as ModuleVentas from './modules/ventas.js';
import * as ModuleCompras from './modules/compras.js';
import * as ModuleHistorial from './modules/historial.js';
import * as ModuleClientes from './modules/clientes.js';
import * as ModuleProveedores from './modules/proveedores.js';
import * as ModuleCategorias from './modules/categorias.js';
import * as ModuleUsuarios from './modules/usuarios.js';
import * as ModuleDescuentos from './modules/descuentos.js';
import * as ModuleFaltantes from './modules/faltantes.js';
import { getEntities } from './api.js';

const menuToggle = document.getElementById("menu-toggle");
const sidebar = document.getElementById("sidebar");
const navButtons = document.querySelectorAll(".nav-btn");
const views = document.querySelectorAll(".view");
const pageTitle = document.getElementById("page-title");
const btnThemeToggle = document.getElementById("btn-theme-toggle");
const btnThemeToggleLogin = document.getElementById("btn-theme-toggle-login");

let currentView = "ventas"; 
let currentUser = null;

// Fake Module mapped (Usuarios módulo se harÃ¡ prÃ³ximamente)
const moduleMap = {
  "productos": ModuleProductos,
  "ventas": ModuleVentas,
  "compras": ModuleCompras,
  "historial": ModuleHistorial,
  "clientes": ModuleClientes,
  "proveedores": ModuleProveedores,
  "categorias": ModuleCategorias,
  "descuentos": ModuleDescuentos,
  "faltantes": ModuleFaltantes,
  "usuarios": ModuleUsuarios
};

// --- LOGICA DE TEMA (DARK/LIGHT) ---
function initTheme() {
  const pref = localStorage.getItem('theme');
  if(pref === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
    updateThemeIcons(true);
  }
}

function updateThemeIcons(isDark) {
  if (btnThemeToggle) btnThemeToggle.innerHTML = isDark ? '<i class="ph ph-sun"></i>' : '<i class="ph ph-moon"></i>';
  if (btnThemeToggleLogin) btnThemeToggleLogin.innerHTML = isDark ? '<i class="ph ph-sun"></i>' : '<i class="ph ph-moon"></i>';
}

function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  if(isDark) {
    document.documentElement.removeAttribute('data-theme');
    localStorage.setItem('theme', 'light');
    updateThemeIcons(false);
  } else {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
    updateThemeIcons(true);
  }
}

if (btnThemeToggle) btnThemeToggle.addEventListener('click', toggleTheme);
if (btnThemeToggleLogin) btnThemeToggleLogin.addEventListener('click', toggleTheme);

initTheme();

// --- LÃ“GICA DE PAUTAS DE ROL Y RUTEO ---
function applyRoles() {
  const role = currentUser ? currentUser.role : 'cajero';
  document.getElementById('current-role-label').textContent = role.toUpperCase();
  
  navButtons.forEach(btn => {
    const allowed = btn.dataset.role.split(',');
    if(allowed.includes(role)) {
      btn.classList.remove('hidden');
    } else {
      btn.classList.add('hidden');
    }
  });
}

function switchView(target) {
  currentView = target;
  
  navButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.target === target);
    if(btn.dataset.target === target) pageTitle.textContent = btn.textContent.trim();
  });

  views.forEach(v => v.classList.toggle("active", v.id === 'view-' + target));

  if (window.innerWidth <= 768) sidebar.classList.remove("show");

  if(moduleMap[target]) {
    try {
      const container = document.getElementById('view-' + target);
      if(container && container.querySelector('.empty-state')) {
         container.innerHTML = '<div style="text-align:center; padding: 40px;"><i class="ph ph-spinner ph-spin" style="font-size:32px;"></i></div>'; 
         moduleMap[target].init(container).then(() => {
           moduleMap[target].render();
         });
      } else {
         moduleMap[target].render();
      }
    } catch(e) {
      showError("Falló la carga del módulo: " + target);
    }
  } else {
    const container = document.getElementById('view-' + target);
    if(container) container.innerHTML = '<div class="empty-state"><i class="ph ph-wrench"></i><p>Construyendo módulo...</p></div>';
  }
}

// --- LOGICA LOGIN ---
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const btnLogin = document.getElementById('btn-login-submit');

loginForm.addEventListener('submit', async (e) => {
   e.preventDefault();
   const u = document.getElementById('login-username').value.trim();
   const p = document.getElementById('login-password').value.trim();
   const err = document.getElementById('login-error');
   const card = document.querySelector('.login-card');
   err.style.display = 'none';

   btnLogin.innerHTML = '<i class="ph ph-spinner ph-spin"></i> Validando...';
   
   let user = null;
   try {
     const usuariosDB = await getEntities('usuarios');
     if (Array.isArray(usuariosDB)) {
       user = usuariosDB.find(x => x.username === u && x.password === p);
     }
   } catch(e) {
     console.warn("No se pudo obtener usuarios, se intentará usar fallback admin", e);
   }

   // Fallback master por si no hay tabla creada aún en google sheets
   if(!user && u === 'admin' && p === 'admin') {
     user = { username: 'admin', role: 'admin' };
   }

   if(user) {
     currentUser = user;
     sessionStorage.setItem('session_user', JSON.stringify(user));
     loginOverlay.classList.add('hidden');
     applyRoles();
     switchView("ventas");
     showToast("¡Bienvenido, " + user.username + "!", "success");
   } else {
     err.innerText = "Credenciales incorrectas o error de conexión";
     err.style.display = 'block';
     if(card) {
       card.classList.remove('shake-error');
       void card.offsetWidth; // trigger reflow
       card.classList.add('shake-error');
     }
     showError("Usuario o contraseña incorrectos");
   }
   
   btnLogin.innerHTML = 'Ingresar al Sistema';
});

document.getElementById('btn-logout').addEventListener('click', () => {
   sessionStorage.removeItem('session_user');
   window.location.reload();
});

// Iniciador Principal
document.addEventListener("DOMContentLoaded", () => {
  const cachedUser = sessionStorage.getItem('session_user');
  if(cachedUser) {
     currentUser = JSON.parse(cachedUser);
     loginOverlay.classList.add('hidden');
     applyRoles();
     switchView(currentUser.role === 'admin' ? "ventas" : "ventas");
  }

  navButtons.forEach(btn => {
    btn.addEventListener("click", () => switchView(btn.dataset.target));
  });

  menuToggle.addEventListener("click", () => sidebar.classList.toggle("show"));
});

window.appSyncModule = async (target, silent = false) => {
  if(!moduleMap[target]) return;
  const btnIcon = document.querySelector("#btn-sync i");
  if(btnIcon) btnIcon.classList.add("ph-spin");
  if(!silent) showToast("Sincronizando con Sheets...");
  
  try {
    const container = document.getElementById('view-' + target);
    await moduleMap[target].init(container);
    moduleMap[target].render();
    if(!silent) showToast("Base de datos sincronizada", "success");
  } catch(e) {
    if(!silent) showError("Error de sincronización");
  } finally {
    if(btnIcon) btnIcon.classList.remove("ph-spin");
  }
};

document.getElementById("btn-sync")?.addEventListener("click", () => {
  window.appSyncModule(currentView, false);
});

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === 'visible' && currentUser) {
    window.appSyncModule(currentView, true);
  }
});



