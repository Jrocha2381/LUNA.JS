import { getEntities, saveEntity, deleteEntity } from '../api.js';
import { getFormData, showConfirmModal, showFormModal, showToast, escapeHtml } from '../ui.js';

let containerElement;
let cacheData = [];
// Cargar categorías y proveedores para los selectores del producto
let cacheCats = [];
let cacheProv = [];

export async function init(container) {
  containerElement = container;
  try {
    cacheData = await getEntities("productos");
    // Load dependencies silently
    getEntities("categorias").then(res => cacheCats = res).catch(() => {});
    getEntities("proveedores").then(res => cacheProv = res).catch(() => {});
  } catch(e) {
    showToast("Error cargando productos", "error");
  }
}

export function render() {
  let html = `
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <input type="text" id="search-productos" placeholder="Buscar por nombre o código..." style="padding: 10px; width: 300px; border: 1px solid var(--border-color); border-radius: var(--radius);">
      <button class="btn btn-primary" id="btn-new-producto"><i class="ph ph-plus"></i> Nuevo Producto</button>
    </div>
  `;
  
  html += `<table class="data-table" style="width: 100%; border-collapse: collapse; background: var(--bg-card); box-shadow: var(--shadow); border-radius: var(--radius); overflow: hidden;">
    <thead style="background: var(--primary-light); text-align: left;">
      <tr>
        <th style="padding: 12px; border-bottom: 2px solid var(--border-color);">Código / Nombre</th>
        <th style="padding: 12px; border-bottom: 2px solid var(--border-color);">Categoría</th>
        <th style="padding: 12px; border-bottom: 2px solid var(--border-color);">Precios (C/V)</th>
        <th style="padding: 12px; border-bottom: 2px solid var(--border-color);">Inventario (Stock)</th>
        <th style="padding: 12px; border-bottom: 2px solid var(--border-color); text-align: right;">Acciones</th>
      </tr>
    </thead>
    <tbody id="tbl-productos-body">
    </tbody>
  </table>`;
  
  containerElement.innerHTML = html;
  
  renderTable(cacheData);

  document.getElementById("btn-new-producto").addEventListener("click", () => openFormModal(null));
  document.getElementById("search-productos").addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = cacheData.filter(p => (p.nombre || '').toLowerCase().includes(term) || (p.codigo || '').toLowerCase().includes(term));
    renderTable(filtered);
  });
}

function renderTable(data) {
  const tbody = document.getElementById("tbl-productos-body");    if (!tbody) return;  if(data.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--text-muted);">No hay productos registrados.</td></tr>`;
    return;
  }
  
  tbody.innerHTML = data.map(p => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px;"><strong>${escapeHtml(p.nombre)}</strong><br><small style="color: var(--text-muted);">${escapeHtml(p.codigo || p.id)}</small></td>
      <td style="padding: 12px;"><span style="background: var(--bg-color); padding: 4px 8px; border-radius: 12px; font-size: 12px;">${escapeHtml(p.categoria || 'General')}</span></td>
      <td style="padding: 12px;">C$: ${p.costo || 0}<br>V$: ${p.precio || 0}</td>
      <td style="padding: 12px;">
        ${p.segimientoInventario === true || p.segimientoInventario === "TRUE" || p.segimientoInventario === "true" ? `<span style="color: ${p.stock <= 5 ? 'var(--danger-color)' : 'var(--primary-color)'}; font-weight: bold;">${p.stock || 0}</span>` : `<span style="color: var(--text-muted);">Sin seguimiento</span>`}
      </td>
      <td style="padding: 12px; text-align: right;">
        <button class="btn btn-secondary btn-sm" onclick="window.appEditProducto('${escapeHtml(p.id)}')" style="padding: 6px 10px; margin-right: 4px;"><i class="ph ph-pencil-simple"></i></button>
        <button class="btn btn-danger btn-sm" onclick="window.appDeleteProducto('${escapeHtml(p.id)}')" style="padding: 6px 10px;"><i class="ph ph-trash"></i></button>
      </td>
    </tr>
  `).join('');
}

// Binds globales para botones en la tabla generada dinámicamente
window.appEditProducto = (id) => {
  const prod = cacheData.find(p => String(p.id) === String(id));
  if(prod) openFormModal(prod);
};

window.appDeleteProducto = (id) => {
  showConfirmModal("Confirmar Eliminación", "<p>¿Seguro que deseas eliminar este producto? Esta acción no se puede deshacer.</p>", async () => {
    // 1. Eliminación Optimista 0 ms
    cacheData = cacheData.filter(p => String(p.id) !== String(id));
    renderTable(document.getElementById("search-productos")?.value ? cacheData.filter(x => x.nombre.includes(document.getElementById("search-productos").value)) : cacheData);
    showToast("Eliminando (en segundo plano)...");
    window.dispatchEvent(new CustomEvent('cambioCatalogo', { detail: cacheData }));
    
    // 2. Eliminación DB silenciosa
    deleteEntity("productos", id).then(() => {
       showToast("Producto eliminado de Sheets", "success");
    }).catch(() => showToast("Error borrando en la nube. Refresca la ventana.", "error"));
  });
};

export function openFormModal(prod, onChangeCallback = null) {
  const isEditing = !!prod;
  const p = prod || {};
  
  const catOptions = cacheCats.map(c => `<option value="${escapeHtml(c.nombre)}" ${c.nombre === p.categoria ? 'selected' : ''}>${escapeHtml(c.nombre)}</option>`).join('');
  const provOptions = cacheProv.map(pr => `<option value="${escapeHtml(pr.id)}" ${pr.id === p.proveedorId ? 'selected' : ''}>${escapeHtml(pr.nombre)}</option>`).join('');

  const formHtml = `
    <input type="hidden" name="id" value="${p.id || ''}">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div>
        <label style="display:block; margin-bottom:4px; font-weight:600;">Nombre del Producto *</label>
        <input type="text" name="nombre" value="${escapeHtml(p.nombre)}" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
      </div>
      <div>
        <label style="display:block; margin-bottom:4px; font-weight:600;">Código (Interno/Barras)</label>
        <input type="text" name="codigo" value="${escapeHtml(p.codigo)}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
      </div>
      <div>
        <label style="display:block; margin-bottom:4px; font-weight:600;">Categoría</label>
        <select name="categoria" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
          <option value="">Seleccionar...</option>
          ${catOptions}
        </select>
      </div>
      <div>
        <label style="display:block; margin-bottom:4px; font-weight:600;">Proveedor Habitual</label>
        <select name="proveedorId" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
          <option value="">Seleccionar...</option>
          ${provOptions}
        </select>
      </div>
      <div>
        <label style="display:block; margin-bottom:4px; font-weight:600;">Unidad de Venta</label>
        <select name="unidadVenta" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
          <option value="unidad" ${p.unidadVenta === 'unidad' ? 'selected' : ''}>Por Unidad</option>
          <option value="medida" ${p.unidadVenta === 'medida' ? 'selected' : ''}>Por Medida (Peso/Longitud)</option>
        </select>
      </div>
      <div>
        <label style="display:block; margin-bottom:4px; font-weight:600;">Seguimiento de Inventario</label>
        <select name="segimientoInventario" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
          <option value="si" ${p.segimientoInventario === true || p.segimientoInventario === "si" ? 'selected' : ''}>Sí</option>
          <option value="no" ${p.segimientoInventario === false || p.segimientoInventario === "no" ? 'selected' : ''}>No</option>
        </select>
      </div>
      <div>
        <label style="display:block; margin-bottom:4px; font-weight:600;">Costo ($)</label>
        <input type="number" name="costo" step="0.01" value="${p.costo || ''}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
      </div>
      <div>
        <label style="display:block; margin-bottom:4px; font-weight:600;">Precio Venta ($)</label>
        <input type="number" name="precio" step="0.01" value="${p.precio || ''}" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
      </div>
      <div>
        <label style="display:block; margin-bottom:4px; font-weight:600;">Stock Actual</label>
        <input type="number" name="stock" value="${p.stock || 0}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
      </div>

    </div>
  `;

  showFormModal(isEditing ? "Editar Producto" : "Nuevo Producto", formHtml, async (form) => {
    // Extraer datos del formulario
    const currentData = getFormData(form);
    const isNew = !currentData.id;
    
    // --- 1. TIEMPO REAL: ACTUALIZACIÓN OPTIMISTA AL INSTANTE ---
    if(isNew) {
      currentData.id = "temp-" + Date.now(); // ID Temporal para la UI
      cacheData.push(currentData);
    } else {
      const idx = cacheData.findIndex(x => String(x.id) === String(currentData.id));
      if(idx > -1) cacheData[idx] = { ...cacheData[idx], ...currentData };
    }
    
    // Refrescar la tabla en 0 milisegundos sin esperar
    renderTable(document.getElementById("search-productos")?.value ? cacheData.filter(x => x.nombre.includes(document.getElementById("search-productos").value)) : cacheData);
    showToast(isEditing ? "Actualizando (en segundo plano)..." : "Creando (en segundo plano)...");
    
    // Avisar a Ventas.js y otros módulos que hubo cambio al instante
    window.dispatchEvent(new CustomEvent('cambioCatalogo', { detail: cacheData }));
    
    if(isNew) delete currentData.id; // Quitar el id temporal para Sheets
    
    // --- 2. GUARDADO SILENCIOSO EN SEGUNDO PLANO ---
    saveEntity("productos", currentData).then(result => {
      const savedItem = result.data;
      if(isNew && savedItem?.id) {
        // Reemplazar el producto temporal por el oficial validado por la DB
        const tempIdx = cacheData.findIndex(x => String(x.id).startsWith("temp-"));
        if(tempIdx > -1) cacheData[tempIdx] = savedItem;
      } else if (!isNew && savedItem) {
        const idx = cacheData.findIndex(x => String(x.id) === String(savedItem.id));
        if(idx > -1) cacheData[idx] = savedItem;
      }
      
      // Micro-re-render por si el ID real o fórmulas cambiaron
      renderTable(document.getElementById("search-productos")?.value ? cacheData.filter(x => x.nombre.includes(document.getElementById("search-productos").value)) : cacheData);
      window.dispatchEvent(new CustomEvent('cambioCatalogo', { detail: cacheData }));
      
      if(onChangeCallback && savedItem) onChangeCallback(savedItem);
    }).catch(err => {
      showToast("Error guardando en la Nube. Refresca la pestaña.", "error");
    });
  });
}
