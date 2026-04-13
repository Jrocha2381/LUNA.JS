const ADMIN_SESSION_KEY = "luna_admin_session";
const ADMIN_USER = "admin";
const ADMIN_PASS = "luna123";

function obtenerSesionAdmin() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function guardarSesionAdmin(usuario) {
  const payload = {
    autenticado: true,
    usuario,
    fecha: new Date().toISOString()
  };
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(payload));
}

function cerrarSesionAdmin() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

function sesionEsValida() {
  const sesion = obtenerSesionAdmin();
  return Boolean(sesion && sesion.autenticado === true);
}

window.sesionAdminActiva = sesionEsValida;
window.cerrarSesionAdmin = cerrarSesionAdmin;

document.addEventListener("DOMContentLoaded", () => {
  const loginContainer = document.getElementById("login-container");
  const dashboardContainer = document.getElementById("dashboard-container");
  const loginForm = document.getElementById("login-form");
  const errorLabel = document.getElementById("login-error");
  const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
  const adminFrame = document.getElementById("admin-frame");
  const navItems = document.querySelectorAll(".nav-item[data-src]");
  const viewTitle = document.getElementById("view-title");

  const mostrarVista = (autenticado) => {
    if (!loginContainer || !dashboardContainer) return;

    if (autenticado) {
      loginContainer.classList.add("oculto");
      dashboardContainer.classList.remove("oculto");
      document.body.classList.add("admin-mode");
    } else {
      loginContainer.classList.remove("oculto");
      dashboardContainer.classList.add("oculto");
      document.body.classList.remove("admin-mode");
    }
  };

  // Navegación del Dashboard
  navItems.forEach(item => {
    item.addEventListener("click", () => {
      const src = item.dataset.src;
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      adminFrame.src = src;
      viewTitle.textContent = item.innerText.replace(/[^\w\s]/gi, '').trim();
    });
  });

  mostrarVista(sesionEsValida());

  if (loginForm) {
    loginForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const usuario = loginForm.usuario.value.trim();
      const contrasena = loginForm.contrasena.value;

      if (usuario === ADMIN_USER && contrasena === ADMIN_PASS) {
        guardarSesionAdmin(usuario);
        loginForm.reset();
        if (errorLabel) errorLabel.textContent = "";
        mostrarVista(true);
        return;
      }

      if (errorLabel) {
        errorLabel.textContent = "Usuario o contrasena incorrectos.";
      }
    });
  }

  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", () => {
      cerrarSesionAdmin();
      mostrarVista(false);
    });
  }
});
