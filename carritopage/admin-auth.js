const AUTH_TOKEN_KEY = "token";

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

    return true;
  } catch (_error) {
    window.top.location.href = "../index.html";
    return false;
  }
}

window.validarSesionAdmin = validarSesionAdmin;
