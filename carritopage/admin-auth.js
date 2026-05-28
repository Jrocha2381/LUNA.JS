const AUTH_TOKEN_KEY = "token";
const USER_ALLOWED_PAGES = new Set(["ventas.html", "factura.html"]);

function validarSesionAdmin() {
  try {
    const token =
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem(AUTH_TOKEN_KEY)) ||
      (typeof localStorage !== "undefined" && localStorage.getItem(AUTH_TOKEN_KEY)) ||
      null;

    if (!token) {
      window.top.location.href = "../index.html";
      return false;
    }

    const page = window.location.pathname.split("/").pop();
    if (!USER_ALLOWED_PAGES.has(page) && obtenerRoleToken(token) !== "ADMIN") {
      window.top.location.href = "/carritopage/ventas.html";
      return false;
    }

    return true;
  } catch (_error) {
    window.top.location.href = "../index.html";
    return false;
  }
}

function obtenerRoleToken(token) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(normalized)
        .split("")
        .map((char) => `%${(`00${char.charCodeAt(0).toString(16)}`).slice(-2)}`)
        .join("")
    );
    return JSON.parse(json).role || null;
  } catch (_error) {
    return null;
  }
}

window.validarSesionAdmin = validarSesionAdmin;
