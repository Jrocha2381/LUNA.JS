import { getEntities, saveEntity, deleteEntity } from '../api.js';
import { getFormData, showConfirmModal, showFormModal, showToast, escapeHtml } from '../ui.js';

const RESOURCE = "clientes";
let cacheData = [];

export async function init(container) {
  try { cacheData = await getEntities(RESOURCE); } catch(e) { }
}

export function render() {
  document.getElementById(`view-${RESOURCE}`).innerHTML = `
    <div style="margin-bottom: 20px;">
      <button class="btn btn-primary" id="btn-new-${RESOURCE}"><i class="ph ph-plus"></i> Nuevo Cliente</button>
    </div>
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr><th style="padding: 12px;">Nombre</th><th style="padding: 12px;">Teléfono</th><th style="padding: 12px;">Correo</th><th style="padding: 12px; text-align: right;">Acciones</th></tr>
        </thead>
        <tbody id="tbl-${RESOURCE}-body"></tbody>
      </table>
    </div>
  `;
  renderTable(cacheData);
  document.getElementById(`btn-new-${RESOURCE}`).addEventListener("click", () => openFormModal());
}

function renderTable(data) {
  const tbody = document.getElementById(`tbl-${RESOURCE}-body`);
  if(!data.length) return tbody.innerHTML = `<tr><td colspan="4" style="padding: 20px; text-align:center;">No hay clientes</td></tr>`;
  
  tbody.innerHTML = data.map(i => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px;"><strong>${escapeHtml(i.nombre)}</strong></td>
      <td style="padding: 12px;">${escapeHtml(i.teléfono || i.telefono)}</td>
      <td style="padding: 12px;">${escapeHtml(i.correo)}</td>
      <td style="padding: 12px; text-align: right;">
        <div class="action-buttons">
          <button class="btn btn-secondary btn-sm" onclick="window.appEditCliente('${escapeHtml(i.id)}')" style="padding: 6px 10px;"><i class="ph ph-pencil-simple"></i></button>
          <button class="btn btn-danger btn-sm" onclick="window.appDeleteCliente('${escapeHtml(i.id)}')" style="padding: 6px 10px;"><i class="ph ph-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

window.appEditCliente = (id) => openFormModal(cacheData.find(x => String(x.id) === String(id)));
window.appDeleteCliente = (id) => {
  showConfirmModal("Eliminar Cliente", "<p>¿Seguro?</p>", async () => {
    await deleteEntity(RESOURCE, id); showToast("Eliminado"); cacheData = cacheData.filter(x => String(x.id) !== String(id)); renderTable(cacheData);
  });
};

function openFormModal(item) {
  const i = item || {};
  const formHtml = `
    <input type="hidden" name="id" value="${i.id || ''}">
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">Nombre Completo *</label>
      <input type="text" name="nombre" value="${escapeHtml(i.nombre)}" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">Teléfono</label>
      <input type="text" name="teléfono" value="${escapeHtml(i.teléfono || i.telefono)}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">Correo Electrónico</label>
      <input type="email" name="correo" value="${escapeHtml(i.correo)}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
    </div>
  `;
  showFormModal(i.id ? "Editar Cliente" : "Nuevo Cliente", formHtml, async (form) => {
    const fd = getFormData(form);
    const isNew = !fd.id;
    
    // UI optimista al instante
    if(isNew) {
      fd.id = "temp-" + Date.now();
      cacheData.push(fd);
    } else {
      const idx = cacheData.findIndex(x => String(x.id) === String(fd.id));
      if(idx > -1) cacheData[idx] = { ...cacheData[idx], ...fd };
    }
    renderTable(cacheData);
    showToast(isNew ? "Creando (en segundo plano)..." : "Actualizando (en segundo plano)...");
    
    if(isNew) delete fd.id; // Quitar ID temporal antes de enviar a Sheets
    
    // Guardar silenciosamente
    saveEntity(RESOURCE, fd).then(result => {
      const savedItem = result.data || fd;
      if(isNew) {
        const tempIdx = cacheData.findIndex(x => String(x.id).startsWith("temp-"));
        if(tempIdx > -1 && savedItem?.id) {
          cacheData[tempIdx] = savedItem;
        } else if(tempIdx > -1 && !savedItem.id) {
          cacheData[tempIdx].id = "ID-" + Date.now();
        }
      } else if(savedItem?.id) {
        const idx = cacheData.findIndex(x => String(x.id) === String(savedItem.id));
        if(idx > -1) cacheData[idx] = savedItem;
      }
      renderTable(cacheData);
    }).catch(() => {
      showToast("Error guardando. Refresca la pestaña.", "error");
      cacheData = cacheData.filter(x => !String(x.id).startsWith("temp-"));
      renderTable(cacheData);
    });
  });
}