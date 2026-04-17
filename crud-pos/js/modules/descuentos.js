import { getEntities, saveEntity, deleteEntity } from '../api.js';
import { getFormData, showConfirmModal, showFormModal, showToast, escapeHtml } from '../ui.js';

let containerElement;
let cacheData = [];
const RESOURCE = "descuentos";

export async function init(container) {
  containerElement = container;
  try { cacheData = await getEntities(RESOURCE); } catch(e) { }
}

export function render() {
  containerElement.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
      <h2 style="color: var(--primary-color);"><i class="ph ph-percent"></i> Gestión de Descuentos</h2>
      <button class="btn btn-primary" id="btn-new-${RESOURCE}"><i class="ph ph-plus"></i> Nuevo Descuento</button>
    </div>
    <div class="table-responsive">
      <table style="width: 100%; border-collapse: collapse; background: var(--bg-card); border-radius: var(--radius); overflow: hidden;">
        <thead style="background: var(--primary-light); text-align: left;">
          <tr>
            <th style="padding: 12px; white-space: nowrap;">ID</th>
            <th style="padding: 12px; white-space: nowrap;">Campaña / Motivo</th>
            <th style="padding: 12px; white-space: nowrap;">Porcentaje (%)</th>
            <th style="padding: 12px; white-space: nowrap;">Estado</th>
            <th style="padding: 12px; text-align: right; white-space: nowrap;">Acciones</th>
          </tr>
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
  if(!data || !data.length) return tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align:center; color: var(--text-muted);">No hay descuentos registrados</td></tr>`;
  
  tbody.innerHTML = data.map(i => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px; color: var(--text-muted);">${escapeHtml(i.id || '')}</td>
      <td style="padding: 12px; font-weight: 600; color: var(--text-dark);">${escapeHtml(i.nombre || '')}</td>
      <td style="padding: 12px; color: var(--text-dark);">${escapeHtml(i.porcentaje || '0')}%</td>
      <td style="padding: 12px;">
         <span style="background: ${i.estado === 'Inactivo' ? 'var(--input-bg)' : 'var(--primary-light)'}; color: ${i.estado === 'Inactivo' ? 'var(--text-muted)' : 'var(--primary-color)'}; padding: 4px 8px; border-radius: 12px; font-size: 12px; white-space: nowrap;">
           ${escapeHtml(i.estado || 'Activo')}
         </span>
      </td>
      <td style="padding: 12px; text-align: right; white-space: nowrap;">
        <button class="btn btn-secondary btn-sm" onclick="window.appEditDescuento('${escapeHtml(i.id || '')}')" title="Editar"><i class="ph ph-pencil-simple"></i></button>
        <button class="btn btn-danger btn-sm" onclick="window.appDeleteDescuento('${escapeHtml(i.id || '')}')" title="Eliminar"><i class="ph ph-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

window.appEditDescuento = (id) => openFormModal(cacheData.find(x => String(x.id) === String(id)));
window.appDeleteDescuento = (id) => {
  showConfirmModal("Eliminar Descuento", "<p>¿Seguro que deseas eliminar este descuento?</p>", async () => {
    await deleteEntity(RESOURCE, id); 
    showToast("Descuento eliminado"); 
    cacheData = cacheData.filter(x => String(x.id) !== String(id)); 
    renderTable(cacheData);
  });
};

function openFormModal(item) {
  const i = item || {};
  const formHtml = `
    <input type="hidden" name="id" value="${i.id || ''}">
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600; color: var(--text-dark);">Nombre de la Campaña *</label>
      <input type="text" name="nombre" value="${escapeHtml(i.nombre || '')}" placeholder="Ej. Black Friday, Temporada Escolar..." required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius); background: var(--input-bg); color: var(--text-dark);">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600; color: var(--text-dark);">Porcentaje de descuento (%) *</label>
      <input type="number" name="porcentaje" min="1" max="100" step="0.01" value="${escapeHtml(i.porcentaje || '')}" placeholder="Ej. 10" required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius); background: var(--input-bg); color: var(--text-dark);">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600; color: var(--text-dark);">Estado</label>
      <select name="estado" style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius); background: var(--input-bg); color: var(--text-dark);">
        <option value="Activo" ${i.estado === 'Activo' ? 'selected' : ''}>Activo</option>
        <option value="Inactivo" ${i.estado === 'Inactivo' ? 'selected' : ''}>Inactivo</option>
      </select>
    </div>
  `;
  showFormModal(i.id ? "Editar Descuento" : "Nuevo Descuento", formHtml, async (form) => {
    const fd = getFormData(form);
    if(!fd.id) delete fd.id;
    if(!fd.estado) fd.estado = 'Activo';
    fd.porcentaje = parseFloat(fd.porcentaje) || 0;

    const result = await saveEntity(RESOURCE, fd);
    showToast(i.id ? "Descuento actualizado" : "Descuento creado", "success");
    
    const savedItem = result.data || result;
    if(i.id && savedItem?.id) {
        cacheData[cacheData.findIndex(x => String(x.id) === String(savedItem.id))] = savedItem;
    } else if(savedItem) {
        cacheData.push(savedItem);
    } else {
        cacheData = await getEntities(RESOURCE);
    }
    renderTable(cacheData);
  });
}
