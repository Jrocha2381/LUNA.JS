const ADMIN_SESSION_KEY = "luna_admin_session";

function validarSesionAdmin() {
  try {
    const sesion = JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) || "null");
    if (!sesion || sesion.autenticado !== true) {
      window.top.location.href = "acceso-admin.html";
      return false;
    }
    return true;
  } catch (error) {
    window.top.location.href = "acceso-admin.html";
    return false;
  }
}

window.validarSesionAdmin = validarSesionAdmin;
