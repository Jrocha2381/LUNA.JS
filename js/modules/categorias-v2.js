/**
 * MÓDULO DE CATEGORÍAS - Versión Correcta
 * Usa estado global + API offline-first
 */

import { state, updateState } from '../state.js';
import { saveItem, deleteItem } from '../apiV2.js';
import { showFormModal, showConfirmModal, showToast, escapeHtml, getFormData } from '../ui.js';

/**
 * CREAR CATEGORÍA
 * @param {Object} data - {nombre, descripcion}
 * @returns {Promise<boolean>}
 */
export async function createCategory(data) {
  if (!data?.nombre || !data.nombre.trim()) {
    showToast('Nombre de categoría es requerido', 'error');
    return false;
  }

  try {
    // Generar ID único
    const category = {
      id: `CAT-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
      nombre: data.nombre.trim(),
      descripcion: data.descripcion?.trim() || '',
      fechaCreacion: new Date().toISOString()
    };

    // Guardar usando API offline-first
    const result = await saveItem('categorias', category);
    
    if (result.success) {
      showToast(result.message, 'success');
      return true;
    } else {
      showToast('Error al guardar categoría', 'error');
      return false;
    }

  } catch (error) {
    console.error('Error creando categoría:', error);
    showToast('Error al crear categoría', 'error');
    return false;
  }
}

/**
 * ACTUALIZAR CATEGORÍA
 * @param {string} id - ID de categoría
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<boolean>}
 */
export async function updateCategory(id, data) {
  if (!id) return false;

  try {
    const existingIdx = state.categorias.findIndex(x => String(x.id) === String(id));
    if (existingIdx === -1) {
      showToast('Categoría no encontrada', 'error');
      return false;
    }

    const updated = {
      ...state.categorias[existingIdx],
      ...data,
      nombre: data.nombre?.trim() || state.categorias[existingIdx].nombre
    };

    const result = await saveItem('categorias', updated);
    
    if (result.success) {
      showToast(result.message, 'success');
      return true;
    }

    return false;

  } catch (error) {
    console.error('Error actualizando categoría:', error);
    showToast('Error al actualizar', 'error');
    return false;
  }
}

/**
 * ELIMINAR CATEGORÍA
 * @param {string} id - ID de categoría
 * @returns {Promise<boolean>}
 */
export async function deleteCategory(id) {
  try {
    const result = await deleteItem('categorias', id);
    if (result) {
      showToast('Categoría eliminada', 'success');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error eliminando categoría:', error);
    showToast('Error al eliminar', 'error');
    return false;
  }
}

/**
 * OBTENER TODAS LAS CATEGORÍAS
 * @returns {Array}
 */
export function getCategories() {
  return state.categorias || [];
}

/**
 * RENDERIZAR TABLA DE CATEGORÍAS
 * @param {HTMLElement} container - Contenedor donde renderizar
 */
export function renderCategoriesTable(container) {
  if (!container) return;

  const categories = getCategories();

  let html = `
    <div style="margin-bottom: 20px;">
      <button class="btn btn-primary" id="btn-new-categoria">
        <i class="ph ph-plus"></i> Nueva Categoría
      </button>
    </div>
    <table class="data-table" style="width: 100%;">
      <thead>
        <tr>
          <th style="padding: 12px;">ID</th>
          <th style="padding: 12px;">Nombre</th>
          <th style="padding: 12px;">Descripción</th>
          <th style="padding: 12px; text-align: right;">Acciones</th>
        </tr>
      </thead>
      <tbody id="categories-tbody">
  `;

  if (categories.length === 0) {
    html += `<tr><td colspan="4" style="padding: 20px; text-align: center; color: var(--text-muted);">
      No hay categorías. Crea una nueva →
    </td></tr>`;
  } else {
    categories.forEach(cat => {
      html += `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 12px; font-size: 12px; color: var(--text-muted);">${escapeHtml(cat.id)}</td>
          <td style="padding: 12px; font-weight: 600;">${escapeHtml(cat.nombre)}</td>
          <td style="padding: 12px; font-size: 14px;">${escapeHtml(cat.descripcion || '-')}</td>
          <td style="padding: 12px; text-align: right;">
            <button class="btn btn-secondary btn-sm edit-category" data-id="${cat.id}" style="padding: 6px 10px;">
              <i class="ph ph-pencil-simple"></i>
            </button>
            <button class="btn btn-danger btn-sm delete-category" data-id="${cat.id}" style="padding: 6px 10px;">
              <i class="ph ph-trash"></i>
            </button>
          </td>
        </tr>
      `;
    });
  }

  html += `</tbody></table>`;
  container.innerHTML = html;

  // Event listeners
  const btnNew = document.getElementById('btn-new-categoria');
  if (btnNew) {
    btnNew.addEventListener('click', () => openCategoryModal());
  }

  document.querySelectorAll('.edit-category').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const category = state.categorias.find(x => String(x.id) === String(id));
      if (category) {
        openCategoryModal(category);
      }
    });
  });

  document.querySelectorAll('.delete-category').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = btn.getAttribute('data-id');
      const category = state.categorias.find(x => String(x.id) === String(id));
      if (category) {
        showConfirmModal(
          'Eliminar Categoría',
          `¿Eliminar "${escapeHtml(category.nombre)}"?`,
          async () => {
            await deleteCategory(id);
            renderCategoriesTable(container); // Re-renderizar
          }
        );
      }
    });
  });
}

/**
 * ABRIR MODAL DE CATEGORÍA (crear/editar)
 * @param {Object} category - Categoría a editar (null = crear nueva)
 */
function openCategoryModal(category = null) {
  const isNew = !category;
  
  const formHtml = `
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 4px; font-weight: 600;">Nombre *</label>
      <input 
        type="text" 
        name="nombre" 
        value="${escapeHtml(category?.nombre || '')}" 
        required 
        placeholder="Ej: Papelería"
        style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px;"
      />
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 4px; font-weight: 600;">Descripción</label>
      <textarea 
        name="descripcion" 
        placeholder="Descripción opcional"
        style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; resize: vertical; min-height: 60px;"
      >${escapeHtml(category?.descripcion || '')}</textarea>
    </div>
  `;

  showFormModal(
    isNew ? 'Nueva Categoría' : 'Editar Categoría',
    formHtml,
    async (form) => {
      const data = getFormData(form);
      
      if (isNew) {
        return await createCategory(data);
      } else {
        const success = await updateCategory(category.id, data);
        if (success) {
          // Re-renderizar tabla después de actualizar
          const tbody = document.querySelector('#categories-tbody');
          if (tbody?.parentElement?.parentElement) {
            renderCategoriesTable(tbody.parentElement.parentElement);
          }
        }
        return success;
      }
    }
  );
}

/**
 * INICIALIZAR módulo de categorías
 * Llamar esto cuando se cargue la vista
 * @param {HTMLElement} container
 */
export function initCategories(container) {
  console.log('📂 Inicializando módulo de categorías...');
  renderCategoriesTable(container);
}
