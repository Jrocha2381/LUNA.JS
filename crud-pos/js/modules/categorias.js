import { getEntities, saveEntity, deleteEntity } from '../api.js';
import { getFormData, showConfirmModal, showFormModal, showToast, escapeHtml } from '../ui.js';

let containerElement;
let cacheData = [];
const RESOURCE = "categorias";

export async function init(container) {
  containerElement = container;
  try { cacheData = await getEntities(RESOURCE); } catch(e) { }
}

export function render() {
  containerElement.innerHTML = `
    <div style="margin-bottom: 20px;">
      <button class="btn btn-primary" id="btn-new-${RESOURCE}"><i class="ph ph-plus"></i> Nueva Categoría</button>
    </div>
    <table style="width: 100%; border-collapse: collapse; background: var(--bg-card); border-radius: var(--radius); overflow: hidden;">
      <thead style="background: var(--primary-light); text-align: left;">
        <tr><th style="padding: 12px;">ID</th><th style="padding: 12px;">Nombre</th><th style="padding: 12px; text-align: right;">Acciones</th></tr>
      </thead>
      <tbody id="tbl-${RESOURCE}-body"></tbody>
    </table>
  `;
  renderTable(cacheData);
  document.getElementById(`btn-new-${RESOURCE}`).addEventListener("click", () => openFormModal());
}

function renderTable(data) {
  const tbody = document.getElementById(`tbl-${RESOURCE}-body`);
  if(!data.length) return tbody.innerHTML = `<tr><td colspan="3" style="padding: 20px; text-align:center;">No hay categorías</td></tr>`;
  
  tbody.innerHTML = data.map(i => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px;">${escapeHtml(i.id)}</td>
      <td style="padding: 12px;"><strong>${escapeHtml(i.nombre)}</strong></td>
      <td style="padding: 12px; text-align: right;">
        <button class="btn btn-secondary btn-sm" onclick="window.appEditCategoria('${escapeHtml(i.id)}')" style="padding: 6px 10px;"><i class="ph ph-pencil-simple"></i></button>
        <button class="btn btn-danger btn-sm" onclick="window.appDeleteCategoria('${escapeHtml(i.id)}')" style="padding: 6px 10px;"><i class="ph ph-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

window.appEditCategoria = (id) => openFormModal(cacheData.find(x => String(x.id) === String(id)));
window.appDeleteCategoria = (id) => {
  showConfirmModal("Eliminar Categoría", "<p>¿Seguro?</p>", async () => {
    await deleteEntity(RESOURCE, id); showToast("Eliminado"); cacheData = cacheData.filter(x => String(x.id) !== String(id)); renderTable(cacheData);
  });
};

function openFormModal(item) {
  const i = item || {};
  const formHtml = `
    <input type="hidden" name="id" value="${i.id || ''}">
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">Nombre de la Categoría *</label>
      <input type="text" name="nombre" value="${escapeHtml(i.nombre)}" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
    </div>
  `;
  showFormModal(i.id ? "Editar Categoría" : "Nueva Categoría", formHtml, async (form) => {
    const fd = getFormData(form);
    if(!fd.id) delete fd.id;
    const result = await saveEntity(RESOURCE, fd);
    showToast(i.id ? "Actualizado" : "Creado");
    
    const savedItem = result.data;
    if(i.id && savedItem?.id) {
        cacheData[cacheData.findIndex(x => x.id === savedItem.id)] = savedItem;
    } else if(savedItem) {
        cacheData.push(savedItem);
    } else {
        cacheData = await getEntities(RESOURCE);
    }
    renderTable(cacheData);
  });
}