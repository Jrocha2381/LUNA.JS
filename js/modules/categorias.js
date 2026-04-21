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
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr><th style="padding: 12px;">ID</th><th style="padding: 12px;">Nombre</th><th style="padding: 12px; text-align: right;">Acciones</th></tr>
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
  if(!data.length) return tbody.innerHTML = `<tr><td colspan="3" style="padding: 20px; text-align:center;">No hay categorías</td></tr>`;
  
  tbody.innerHTML = data.map((i, idx) => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px;">${escapeHtml(i.id)}</td>
      <td style="padding: 12px;"><strong>${escapeHtml(i.nombre)}</strong></td>
      <td style="padding: 12px; text-align: right;">
        <div class="action-buttons">
          <button class="btn btn-secondary btn-sm" data-edit-id="${i.id}" style="padding: 6px 10px;"><i class="ph ph-pencil-simple"></i></button>
          <button class="btn btn-danger btn-sm" data-delete-id="${i.id}" style="padding: 6px 10px;"><i class="ph ph-trash"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
  
  // Agregar event listeners a los botones
  tbody.querySelectorAll('[data-edit-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-edit-id');
      const item = cacheData.find(x => String(x.id) === String(id));
      if(item) openFormModal(item);
    });
  });
  
  tbody.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-delete-id');
      showConfirmModal("Eliminar Categoría", "<p>¿Seguro?</p>", async () => {
        await deleteEntity(RESOURCE, id);
        showToast("Eliminado");
        cacheData = cacheData.filter(x => String(x.id) !== String(id));
        renderTable(cacheData);
      });
    });
  });
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
    const isNew = !fd.id;
    
    // Generar ID temporal ÚNICO con mayor precisión
    let tempId = null;
    if(isNew) {
      tempId = "temp-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
      fd.id = tempId;
      cacheData.push(fd);
    } else {
      const idx = cacheData.findIndex(x => String(x.id) === String(fd.id));
      if(idx > -1) cacheData[idx] = { ...cacheData[idx], ...fd };
    }
    renderTable(cacheData);
    showToast(isNew ? "Creando (en segundo plano)..." : "Actualizando (en segundo plano)...");
    
    // Guardar el tempId antes de borrarlo
    const tempIdToFind = tempId;
    if(isNew) delete fd.id; // Quitar ID temporal antes de enviar a Sheets
    
    // Guardar silenciosamente
    saveEntity(RESOURCE, fd).then(result => {
      const savedItem = result.data || fd;
      if(isNew) {
        // Buscar por el ID temporal EXACTO que creamos
        const tempIdx = cacheData.findIndex(x => String(x.id) === String(tempIdToFind));
        if(tempIdx > -1 && savedItem?.id) {
          // Reemplazar solo el elemento con ese ID temporal específico
          cacheData[tempIdx] = { ...savedItem };
        } else if(tempIdx > -1 && !savedItem.id) {
          cacheData[tempIdx].id = "ID-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
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