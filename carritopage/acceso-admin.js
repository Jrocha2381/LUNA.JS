if (window.top !== window.self) {
  // Frame-breaker: Si el panel admin intenta cargarse dentro de un iframe, 
  // forzamos la recarga en la ventana principal para evitar anidamiento infinito.
  window.top.location.href = window.location.href;
}

const AUTH_TOKEN_KEY = "token";

function getToken() {
  try {
    return (
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem(AUTH_TOKEN_KEY)) ||
      (typeof localStorage !== "undefined" && localStorage.getItem(AUTH_TOKEN_KEY)) ||
      null
    );
  } catch (_error) {
    return null;
  }
}

function setToken(token) {
  try {
    if (typeof sessionStorage !== "undefined") sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    if (typeof localStorage !== "undefined") localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch (_error) {
    // ignore
  }
}

function clearToken() {
  try {
    if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(AUTH_TOKEN_KEY);
    if (typeof localStorage !== "undefined") localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch (_error) {
    // ignore
  }
}

function sesionEsValida() {
  return Boolean(getToken());
}

window.sesionAdminActiva = sesionEsValida;
window.cerrarSesionAdmin = clearToken;

document.addEventListener("DOMContentLoaded", () => {
  const dashboardContainer = document.getElementById("dashboard-container");
  const btnCerrarSesion = document.getElementById("btn-cerrar-sesion");
  const adminFrame = document.getElementById("admin-frame");
  const navItems = document.querySelectorAll(".nav-item");
  const viewTitle = document.getElementById("view-title");
  const displayUser = document.getElementById("display-user");
  const userAvatar = document.querySelector(".user-avatar");

  if (!sesionEsValida()) {
    window.top.location.href = "../index.html";
    return;
  }

  if (dashboardContainer) dashboardContainer.classList.remove("oculto");
  document.body.classList.add("admin-mode");

  // Cargamos el contenido del iframe SOLO cuando el usuario está autenticado
  if (adminFrame && !adminFrame.src) {
    adminFrame.src = "admin.html";
  }

  const actualizarUsuario = async () => {
    if (!sesionEsValida() || !window.Backend || typeof window.Backend.get !== "function") return;
    try {
      const me = await window.Backend.get("me");
      const user = me && me.user ? me.user : null;
      const name = (user && (user.username || user.correo)) || "Usuario";
      if (displayUser) displayUser.textContent = name;
      if (userAvatar) userAvatar.textContent = String(name).trim().charAt(0).toUpperCase() || "U";
    } catch (_err) {
      // si el token expiró o es inválido, forzamos re-login
      clearToken();
      window.top.location.href = "../index.html";
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

  actualizarUsuario();

  if (btnCerrarSesion) {
    btnCerrarSesion.addEventListener("click", () => {
      clearToken();
      window.top.location.href = "../index.html";
    });
  }
});
