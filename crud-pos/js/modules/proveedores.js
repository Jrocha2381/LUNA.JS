import { getEntities, saveEntity, deleteEntity } from '../api.js';
import { getFormData, showConfirmModal, showFormModal, showToast, escapeHtml } from '../ui.js';

const RESOURCE = "proveedores";
let cacheData = [];

export async function init(container) {
  try { cacheData = await getEntities(RESOURCE); } catch(e) { }
}

export function render() {
  document.getElementById(`view-${RESOURCE}`).innerHTML = `
    <div style="margin-bottom: 20px;">
      <button class="btn btn-primary" id="btn-new-${RESOURCE}"><i class="ph ph-plus"></i> Nuevo Proveedor</button>
    </div>
    <table style="width: 100%; border-collapse: collapse; background: var(--bg-card); border-radius: var(--radius); overflow: hidden;">
      <thead style="background: var(--primary-light); text-align: left;">
        <tr><th style="padding: 12px;">Empresa/Nombre</th><th style="padding: 12px;">NIT</th><th style="padding: 12px;">Contacto</th><th style="padding: 12px; text-align: right;">Acciones</th></tr>
      </thead>
      <tbody id="tbl-${RESOURCE}-body"></tbody>
    </table>
  `;
  renderTable(cacheData);
  document.getElementById(`btn-new-${RESOURCE}`).addEventListener("click", () => openFormModal());
}

function renderTable(data) {
  const tbody = document.getElementById(`tbl-${RESOURCE}-body`);
  if(!data.length) return tbody.innerHTML = `<tr><td colspan="4" style="padding: 20px; text-align:center;">No hay proveedores</td></tr>`;
  
  tbody.innerHTML = data.map(i => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px;"><strong>${escapeHtml(i.nombre)}</strong></td>
      <td style="padding: 12px;">${escapeHtml(i.nit)}</td>
      <td style="padding: 12px;">${escapeHtml(i.contacto)}</td>
      <td style="padding: 12px; text-align: right;">
        <button class="btn btn-secondary btn-sm" onclick="window.appEditProveedor('${escapeHtml(i.id)}')" style="padding: 6px 10px;"><i class="ph ph-pencil-simple"></i></button>
        <button class="btn btn-danger btn-sm" onclick="window.appDeleteProveedor('${escapeHtml(i.id)}')" style="padding: 6px 10px;"><i class="ph ph-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

window.appEditProveedor = (id) => openFormModal(cacheData.find(x => String(x.id) === String(id)));
window.appDeleteProveedor = (id) => {
  showConfirmModal("Eliminar Proveedor", "<p>¿Seguro?</p>", async () => {
    await deleteEntity(RESOURCE, id); showToast("Eliminado"); cacheData = cacheData.filter(x => String(x.id) !== String(id)); renderTable(cacheData);
  });
};

function openFormModal(item) {
  const i = item || {};
  const formHtml = `
    <input type="hidden" name="id" value="${i.id || ''}">
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">Nombre de la Empresa *</label>
      <input type="text" name="nombre" value="${escapeHtml(i.nombre)}" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">NIT/RUT</label>
      <input type="text" name="nit" value="${escapeHtml(i.nit)}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">Teléfono de Contacto</label>
      <input type="text" name="contacto" value="${escapeHtml(i.contacto)}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
    </div>
  `;
  showFormModal(i.id ? "Editar Proveedor" : "Nuevo Proveedor", formHtml, async (form) => {
    const fd = getFormData(form);
    if(!fd.id) delete fd.id;
    const result = await saveEntity(RESOURCE, fd);
    showToast(i.id ? "Actualizado" : "Creado");
    
    const savedItem = result.data;
    if(i.id && savedItem?.id) {
        cacheData[cacheData.findIndex(x => x.id === savedItem.id)] = savedItem;
    } else if (savedItem) {
        cacheData.push(savedItem);
    } else {
        cacheData = await getEntities(RESOURCE);
    }
    renderTable(cacheData);
  });
}