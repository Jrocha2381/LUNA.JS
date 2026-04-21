/**
 * MÓDULO DE CATEGORÍAS
 */

import { state, updateState, saveStateToLocalStorage } from '../state.js';
import { showToast, showFormModal, showConfirmModal } from '../ui.js';
import { saveItem, deleteItem } from '../apiV2.js';

const CACHE_KEY = 'cpos_cache_categorias';
let categoriesContainer = null;

export function renderCategoriesTable(container) {
  if (!container) return;

  const categories = state.categorias || [];

  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3 style="font-weight: 600; color: var(--primary-color);">
        <i class="ph ph-tag"></i> Gestión de Categorías
      </h3>
      <button id="btn-create-category" class="btn btn-primary btn-sm">
        <i class="ph ph-plus"></i> Nueva Categoría
      </button>
    </div>
  `;

  if (categories.length === 0) {
    html += `
      <div class="empty-state">
        <i class="ph ph-folder-open" style="font-size: 56px;"></i>
        <p>No hay categorías registradas</p>
        <button class="btn btn-primary btn-sm" id="btn-create-category-empty">
          <i class="ph ph-plus"></i> Crear primera categoría
        </button>
      </div>
    `;
  } else {
    html += `
      <div style="background: var(--bg-card); border-radius: var(--radius); box-shadow: var(--shadow); overflow: hidden;">
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: var(--primary-light);">
              <th style="padding: 14px 16px; text-align: left; font-weight: 600; color: var(--primary-color); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Nombre</th>
              <th style="padding: 14px 16px; text-align: left; font-weight: 600; color: var(--primary-color); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Descripción</th>
              <th style="padding: 14px 16px; text-align: right; font-weight: 600; color: var(--primary-color); font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Acciones</th>
            </tr>
          </thead>
          <tbody>
    `;

    categories.forEach(cat => {
      html += `
        <tr style="border-bottom: 1px solid var(--border-color); transition: background 0.2s;" onmouseover="this.style.background='var(--primary-light)'" onmouseout="this.style.background=''">
          <td style="padding: 14px 16px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 34px; height: 34px; border-radius: 8px; background: var(--primary-light); display: flex; align-items: center; justify-content: center; color: var(--primary-color); font-size: 16px; flex-shrink: 0;">
                <i class="ph ph-tag"></i>
              </div>
              <span style="font-weight: 600; color: var(--text-dark);">${escapeHtml(cat.nombre)}</span>
            </div>
          </td>
          <td style="padding: 14px 16px; color: var(--text-muted);">${escapeHtml(cat.descripcion || '—')}</td>
          <td style="padding: 14px 16px; text-align: right;">
            <div style="display: flex; gap: 8px; justify-content: flex-end;">
              <button
                class="btn btn-secondary btn-sm btn-edit"
                data-id="${cat.id}"
                title="Editar categoría"
                style="gap: 6px;"
              >
                <i class="ph ph-pencil-simple"></i> Editar
              </button>
              <button
                class="btn btn-danger btn-sm btn-delete"
                data-id="${cat.id}"
                title="Eliminar categoría"
                style="gap: 6px;"
              >
                <i class="ph ph-trash"></i> Eliminar
              </button>
            </div>
          </td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
      <p style="margin-top: 12px; font-size: 12px; color: var(--text-muted); text-align: right;">
        ${categories.length} categoría${categories.length !== 1 ? 's' : ''} registrada${categories.length !== 1 ? 's' : ''}
      </p>
    `;
  }

  container.innerHTML = html;
  setupEventListeners(container);
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function setupEventListeners(container) {
  const btnCreate = container.querySelector('#btn-create-category');
  if (btnCreate) btnCreate.addEventListener('click', () => openCategoryModal(null));

  const btnCreateEmpty = container.querySelector('#btn-create-category-empty');
  if (btnCreateEmpty) btnCreateEmpty.addEventListener('click', () => openCategoryModal(null));

  container.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const cat = (state.categorias || []).find(c => c.id === id);
      if (cat) openCategoryModal(cat);
    });
  });

  container.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const cat = (state.categorias || []).find(c => c.id === id);
      if (!cat) return;
      showConfirmModal(
        'Eliminar Categoría',
        `<p>¿Estás seguro de que deseas eliminar <strong>"${escapeHtml(cat.nombre)}"</strong>?</p><p style="color: var(--text-muted); font-size: 14px; margin-top: 8px;">Esta acción no se puede deshacer.</p>`,
        async () => {
          await deleteCategory(id);
        }
      );
    });
  });
}

function openCategoryModal(category = null) {
  const isEdit = !!category;

  const formHtml = `
    <input type="hidden" name="id" value="${category?.id || ''}">
    <div class="form-group" style="margin-bottom: 16px;">
      <label style="display: block; margin-bottom: 6px; font-weight: 600; color: var(--text-dark);">Nombre *</label>
      <input
        type="text"
        name="nombre"
        placeholder="Ej: Útiles escolares, Papelería..."
        value="${escapeHtml(category?.nombre || '')}"
        required
        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius); background: var(--input-bg); color: var(--text-dark); font-size: 15px; box-sizing: border-box;"
      />
    </div>
    <div class="form-group">
      <label style="display: block; margin-bottom: 6px; font-weight: 600; color: var(--text-dark);">Descripción</label>
      <textarea
        name="descripcion"
        placeholder="Descripción opcional..."
        rows="3"
        style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius); background: var(--input-bg); color: var(--text-dark); font-size: 15px; box-sizing: border-box; resize: vertical;"
      >${escapeHtml(category?.descripcion || '')}</textarea>
    </div>
  `;

  showFormModal(isEdit ? 'Editar Categoría' : 'Nueva Categoría', formHtml, async (form) => {
    const fd = new FormData(form);
    const nombre = (fd.get('nombre') || '').trim();
    const descripcion = (fd.get('descripcion') || '').trim();

    if (!nombre) {
      showToast('El nombre es requerido', 'error');
      return false;
    }

    if (isEdit) {
      await updateCategory(category.id, { nombre, descripcion });
    } else {
      await createCategory({ nombre, descripcion });
    }

    if (categoriesContainer) renderCategoriesTable(categoriesContainer);
  });
}

async function createCategory(data) {
  const id = `CAT-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  const category = {
    id,
    nombre: data.nombre,
    descripcion: data.descripcion || '',
    created: new Date().toISOString()
  };

  try {
    const cats = [category, ...(state.categorias || [])];
    updateState('categorias', cats);
    saveStateToLocalStorage();
    localStorage.setItem(CACHE_KEY, JSON.stringify(cats));

    // Sincronizar con Google Sheets en background
    saveItem('categorias', category).then(res => {
      if (res.remoteSaved) console.log('☁️ Categoría guardada en Sheets');
    }).catch(() => {});

    showToast('Categoría creada', 'success');
    return true;
  } catch (error) {
    console.error('Error:', error);
    showToast('Error al crear categoría', 'error');
    return false;
  }
}

async function updateCategory(id, data) {
  try {
    const cats = state.categorias || [];
    const idx = cats.findIndex(c => c.id === id);

    if (idx === -1) {
      showToast('Categoría no encontrada', 'error');
      return false;
    }

    cats[idx] = { ...cats[idx], ...data, updated: new Date().toISOString() };
    updateState('categorias', cats);
    saveStateToLocalStorage();
    localStorage.setItem(CACHE_KEY, JSON.stringify(cats));

    saveItem('categorias', cats[idx]).then(res => {
      if (res.remoteSaved) console.log('☁️ Categoría actualizada en Sheets');
    }).catch(() => {});

    showToast('Categoría actualizada', 'success');
    return true;
  } catch (error) {
    console.error('Error:', error);
    showToast('Error al actualizar', 'error');
    return false;
  }
}

async function deleteCategory(id) {
  try {
    const cats = (state.categorias || []).filter(c => c.id !== id);
    updateState('categorias', cats);
    saveStateToLocalStorage();
    localStorage.setItem(CACHE_KEY, JSON.stringify(cats));

    deleteItem('categorias', id).then(() => {
      console.log('☁️ Categoría eliminada en Sheets');
    }).catch(() => {});

    showToast('Categoría eliminada', 'success');

    if (categoriesContainer) renderCategoriesTable(categoriesContainer);
    return true;
  } catch (error) {
    console.error('Error:', error);
    showToast('Error al eliminar', 'error');
    return false;
  }
}

export function initCategories(container) {
  categoriesContainer = container;

  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      updateState('categorias', JSON.parse(cached));
    } catch (e) {
      console.error('Error parseando cache de categorías:', e);
    }
  }

  renderCategoriesTable(container);
}
