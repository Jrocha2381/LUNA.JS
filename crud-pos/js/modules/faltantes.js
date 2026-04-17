import { getEntities, saveEntity, deleteEntity } from '../api.js';
import { getFormData, showConfirmModal, showFormModal, showToast, escapeHtml } from '../ui.js';

let containerElement;
let cacheData = [];
const RESOURCE = "faltantes";

export async function init(container) {
  containerElement = container;
  try { cacheData = await getEntities(RESOURCE); } catch(e) { }
}

export function render() {
  containerElement.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
      <h2 style="color: var(--danger-color);"><i class="ph ph-clipboard-text"></i> Registro de Faltantes/Mermas</h2>
      <button class="btn btn-danger" id="btn-new-${RESOURCE}"><i class="ph ph-warning-circle"></i> Nuevo Faltante</button>
    </div>
    <div class="table-responsive">
      <table style="width: 100%; border-collapse: collapse; background: var(--bg-card); border-radius: var(--radius); overflow: hidden;">
        <thead style="background: var(--danger-light); text-align: left;">
          <tr>
            <th style="padding: 12px; color: var(--text-dark); white-space: nowrap;">Fecha</th>
            <th style="padding: 12px; color: var(--text-dark); white-space: nowrap;">Producto / Descripción</th>
            <th style="padding: 12px; color: var(--text-dark); white-space: nowrap;">Cantidad</th>
            <th style="padding: 12px; color: var(--text-dark); white-space: nowrap;">Motivo</th>
            <th style="padding: 12px; text-align: right; color: var(--text-dark); white-space: nowrap;">Acciones</th>
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
  if(!data || !data.length) return tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align:center; color: var(--text-muted);">No hay reportes de faltantes o mermas</td></tr>`;
  
  tbody.innerHTML = data.map(i => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px; color: var(--text-muted);">${escapeHtml(i.fecha || new Date().toLocaleDateString())}</td>
      <td style="padding: 12px; font-weight: 600; color: var(--text-dark);">${escapeHtml(i.producto || i.descripcion || '')}</td>
      <td style="padding: 12px; color: var(--text-dark);">
        <span style="background: var(--danger-light); color: var(--danger-color); padding: 4px 8px; border-radius: 4px; font-weight: bold;">
          -${escapeHtml(i.cantidad || '0')}
        </span>
      </td>
      <td style="padding: 12px; color: var(--text-dark);">${escapeHtml(i.motivo || 'No especificado')}</td>
      <td style="padding: 12px; text-align: right; white-space: nowrap;">
        <button class="btn btn-secondary btn-sm" onclick="window.appEditFaltante('${escapeHtml(i.id || '')}')" title="Editar"><i class="ph ph-pencil-simple"></i></button>
        <button class="btn btn-danger btn-sm" onclick="window.appDeleteFaltante('${escapeHtml(i.id || '')}')" title="Eliminar"><i class="ph ph-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

window.appEditFaltante = (id) => openFormModal(cacheData.find(x => String(x.id) === String(id)));
window.appDeleteFaltante = (id) => {
  showConfirmModal("Eliminar Reporte", "<p>¿Seguro que deseas eliminar este reporte de faltante?</p>", async () => {
    await deleteEntity(RESOURCE, id); 
    showToast("Reporte eliminado"); 
    cacheData = cacheData.filter(x => String(x.id) !== String(id)); 
    renderTable(cacheData);
  });
};

function openFormModal(item) {
  const i = item || {};
  const hoy = new Date().toISOString().split('T')[0];
  const formHtml = `
    <input type="hidden" name="id" value="${i.id || ''}">
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600; color: var(--text-dark);">Fecha *</label>
      <input type="date" name="fecha" value="${escapeHtml(i.fecha || hoy)}" required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius); background: var(--input-bg); color: var(--text-dark);">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600; color: var(--text-dark);">Producto/Descripción *</label>
      <input type="text" name="producto" value="${escapeHtml(i.producto || i.descripcion || '')}" placeholder="Nombre del producto o detalle..." required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius); background: var(--input-bg); color: var(--text-dark);">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600; color: var(--text-dark);">Cantidad de Merma/Faltante *</label>
      <input type="number" name="cantidad" min="1" step="0.01" value="${escapeHtml(i.cantidad || '')}" placeholder="Ej. 2" required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius); background: var(--input-bg); color: var(--text-dark);">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600; color: var(--text-dark);">Motivo de Ajuste *</label>
      <select name="motivo" style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius); background: var(--input-bg); color: var(--text-dark);">
        <option value="Dañado/Roto" ${i.motivo === 'Dañado/Roto' ? 'selected' : ''}>Producto Dañado/Roto</option>
        <option value="Caducado" ${i.motivo === 'Caducado' ? 'selected' : ''}>Caducado</option>
        <option value="Robo/Pérdida" ${i.motivo === 'Robo/Pérdida' ? 'selected' : ''}>Robo/Pérdida</option>
        <option value="Ajuste de Inventario" ${i.motivo === 'Ajuste de Inventario' ? 'selected' : ''}>Ajuste de Inventario</option>
        <option value="Uso Interno" ${i.motivo === 'Uso Interno' ? 'selected' : ''}>Uso Interno</option>
      </select>
    </div>
  `;
  showFormModal(i.id ? "Editar Reporte" : "Nuevo Faltante", formHtml, async (form) => {
    const fd = getFormData(form);
    if(!fd.id) delete fd.id;
    fd.cantidad = parseFloat(fd.cantidad) || 0;

    const result = await saveEntity(RESOURCE, fd);
    showToast(i.id ? "Reporte actualizado" : "Faltante registrado", "success");
    
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
