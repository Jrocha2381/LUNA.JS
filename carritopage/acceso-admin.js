if (window.top !== window.self) {
  // Frame-breaker: Si el panel admin intenta cargarse dentro de un iframe, 
  // forzamos la recarga en la ventana principal para evitar anidamiento infinito.
  window.top.location.href = window.location.href;
}

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
  const navItems = document.querySelectorAll(".nav-item");
  const viewTitle = document.getElementById("view-title");

  const mostrarVista = (autenticado) => {
    if (!loginContainer || !dashboardContainer) return;

    if (autenticado) {
      loginContainer.classList.add("oculto");
      dashboardContainer.classList.remove("oculto");
      document.body.classList.add("admin-mode");

      // Cargamos el contenido del iframe SOLO cuando el usuario está autenticado
      if (adminFrame && !adminFrame.src) {
        adminFrame.src = "admin.html";
      }
    } else {
      loginContainer.classList.remove("oculto");
      dashboardContainer.classList.add("oculto");
      document.body.classList.remove("admin-mode");
    }
  };

  // Navegación del Dashboard
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      const src = item.dataset.src;
      const href = item.getAttribute("href");

      // BUG FIX: Si el destino es volver a la tienda (index.html), redirigimos la ventana principal.
      // Esto evita que la tienda se abra DENTRO del panel administrativo.
      if ((src && src.includes("index.html")) || (href && href.includes("index.html"))) {
        e.preventDefault();
        window.top.location.href = href || src;
        return;
      }

      // Si el elemento no tiene data-src, es un enlace normal (como el de Volver) 
      // o un botón de acción, por lo que dejamos que siga su curso natural.
      if (!src) {
        return;
      }

      e.preventDefault(); // Solo prevenimos el default si vamos a cargar contenido en el iframe
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
