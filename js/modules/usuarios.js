import { getEntities, saveEntity, deleteEntity } from '../api.js';
import { showConfirmModal, showToast } from '../ui.js';

let containerElement;
let cacheData = [];
let mode = "table"; 
let currentId = null;

export async function init(container) {
  containerElement = container;
}

export async function render() {
  if (mode === "form") {
    renderForm();
    return;
  }
  
  containerElement.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px;">Cargando usuarios...</div>`;
  try {
    try {
      cacheData = await getEntities("usuarios");
    } catch(err) {
      cacheData = [];
      console.warn("Sheet usuarios not found. Falling back to local.");
    }
    
    // Inyectar el admin por defecto si la base estÃ¡ vacia o no existe
    if (cacheData.length === 0) {
      const defaultAdmin = { id: 1, username: 'admin', role: 'admin', password: 'admin' };
      cacheData.push(defaultAdmin);
      // Guardar silenciosamente el admin en la base local para que no desaparezca
      saveEntity("usuarios", defaultAdmin).catch(() => {});
    }

    containerElement.innerHTML = `
      <div style="background: var(--bg-card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="font-weight: 600; color: var(--primary-color);">Gestión de Usuarios</h2>
          <button class="btn btn-primary" onclick="window.posNewUsuario()"><i class="ph ph-plus"></i> Nuevo Usuario</button>
        </div>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
             <thead style="background: var(--primary-light); text-align: left;">
               <tr>
                 <th style="padding: 12px; border-bottom: 2px solid var(--border-color);">Usuario</th>
                 <th style="padding: 12px; border-bottom: 2px solid var(--border-color);">Rol</th>
                 <th style="padding: 12px; border-bottom: 2px solid var(--border-color); text-align: right;">Acciones</th>
               </tr>
             </thead>
             <tbody>
               ` + cacheData.map(u => `
                 <tr style="border-bottom: 1px solid var(--border-color);">
                   <td style="padding: 12px; font-weight: 500;">` + u.username + `</td>
                   <td style="padding: 12px;"><span style="background: var(--bg-solid); padding: 4px 8px; border-radius: 12px; font-size: 12px; text-transform: uppercase;">` + u.role + `</span></td>
                   <td style="padding: 12px; text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
                     <button class="btn btn-secondary btn-sm" onclick="window.posEditUsuario('` + u.id + `')"><i class="ph ph-pencil-simple"></i> Editar</button>
                     <button class="btn btn-danger btn-sm" onclick="window.posDeleteUsuario('` + u.id + `')"><i class="ph ph-trash"></i></button>
                   </td>
                 </tr>
               `).join('') + `
             </tbody>
          </table>
        </div>
      </div>
    `;
  } catch(e) {
    containerElement.innerHTML = `<div style="text-align: center; color: var(--danger-color); padding: 40px;">Error al cargar usuarios</div>`;
  }
}

function renderForm() {
  const isEdit = currentId !== null;
  const user = isEdit ? cacheData.find(u => String(u.id) === String(currentId)) : { username: "", password: "", role: "cajero" };

  containerElement.innerHTML = `
    <div style="background: var(--bg-card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px; max-width: 500px; margin: 0 auto;">
      <h2 style="margin-bottom: 20px; font-weight: 600; color: var(--primary-color);">` + (isEdit ? "Editar Usuario" : "Nuevo Usuario") + `</h2>
      <div class="form-group" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Nombre de Usuario</label>
        <input type="text" id="usr-name" class="input" style="width: 100%; box-sizing: border-box;" value="` + (user.username || '') + `">
      </div>
      <div class="form-group" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Contraseña ` + (isEdit ? "(dejar en blanco para no cambiar)" : "") + `</label>
        <input type="password" id="usr-pass" class="input" style="width: 100%; box-sizing: border-box;">
      </div>
      <div class="form-group" style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Rol</label>
        <select id="usr-role" class="input" style="width: 100%; box-sizing: border-box;">
          <option value="cajero" ` + (user.role === 'cajero' ? 'selected' : '') + `>Cajero</option>
          <option value="admin" ` + (user.role === 'admin' ? 'selected' : '') + `>Administrador</option>
        </select>
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button class="btn btn-secondary" onclick="window.posCancelUsuario()"><i class="ph ph-x"></i> Cancelar</button>
        <button class="btn btn-primary" onclick="window.posSaveUsuario()"><i class="ph ph-floppy-disk"></i> Guardar</button>
      </div>
    </div>
  `;
}

window.posNewUsuario = () => {
  mode = "form";
  currentId = null;
  render();
};

window.posEditUsuario = (id) => {
  mode = "form";
  currentId = id;
  render();
};

window.posCancelUsuario = () => {
  mode = "table";
  render();
};

window.posDeleteUsuario = (id) => {
  showConfirmModal("Eliminar Usuario", "¿Estás seguro de eliminar este usuario? No podrá entrar logearse más.", async () => {
    cacheData = cacheData.filter(x => String(x.id) !== String(id));
    render();
    showToast("Eliminando Usuario...");
    await deleteEntity("usuarios", id);
    showToast("Usuario eliminado", "success");
  });
};

window.posSaveUsuario = async () => {
  const username = document.getElementById("usr-name").value.trim();
  const pass = document.getElementById("usr-pass").value;
  const role = document.getElementById("usr-role").value;

  if (!username) return showToast("Falta nombre de usuario", "warning");
  if (!currentId && !pass) return showToast("Agrega una contraseña para el nuevo usuario", "warning");

  const isEdit = currentId !== null;
  let oldUser = isEdit ? cacheData.find(u => String(u.id) === String(currentId)) : null;

  const newUser = {
    id: isEdit ? oldUser.id : new Date().getTime(),
    username,
    role
  };
  
  if (pass) {
    newUser.password = pass; // En producción acá va hash
  } else if (isEdit) {
    newUser.password = oldUser.password;
  }

  if (isEdit) {
    Object.assign(oldUser, newUser);
  } else {
    cacheData.push(newUser);
  }
  
  mode = "table";
  render();
  showToast("Guardando usuario...");
  try {
     await saveEntity('usuarios', newUser);
     showToast("Usuario guardado con éxito", "success");
     cacheData = await getEntities("usuarios"); // Recargar info fresca del server/local
  } catch(e) {
     showToast("Error guardando el usuario", "error");
  }
};

