import { getEntities, saveEntity } from '../api.js';
import { showFormModal, showToast, escapeHtml, getFormData } from '../ui.js';

const RESOURCE = 'compras';
let containerElement;
let currentPurchase = [];
let catalog = [];
let providers = [];

export async function init(container) {
  containerElement = container;
  try {
    catalog = await getEntities('productos');
    providers = await getEntities('proveedores');
  } catch (e) {}
}

export function render() {
  containerElement.innerHTML = `
    <div style="display: flex; flex-direction: column; height: 100%; gap: 0;">

      <!-- Header -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 style="font-size: 20px; font-weight: 700; color: var(--primary-color); margin: 0;">
            <i class="ph ph-truck"></i> Orden de Compra
          </h2>
          <p style="margin: 4px 0 0; font-size: 13px; color: var(--text-muted);">Registra el reabastecimiento de productos</p>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <button class="btn btn-secondary btn-sm" id="btn-clear-compra">
            <i class="ph ph-trash"></i> Limpiar orden
          </button>
          <button class="btn btn-primary" id="btn-nueva-compra">
            <i class="ph ph-plus-circle"></i> Nueva Compra
          </button>
        </div>
      </div>

      <!-- Proveedor -->
      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 16px; margin-bottom: 16px;">
        <label style="display: block; margin-bottom: 8px; font-weight: 600; font-size: 14px; color: var(--text-dark);">
          <i class="ph ph-buildings"></i> Proveedor *
        </label>
        <select id="compra-proveedor" style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius); background: var(--input-bg); color: var(--text-dark); font-size: 14px;">
          <option value="">Seleccionar proveedor...</option>
          ${providers.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nombre)}</option>`).join('')}
        </select>
      </div>

      <!-- Tabla de productos en la orden -->
      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius); flex: 1; overflow: hidden; margin-bottom: 16px;">
        <div style="padding: 14px 16px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
          <span style="font-weight: 600; font-size: 14px;">Productos a reponer</span>
          <span id="compra-count" style="font-size: 13px; color: var(--text-muted);">0 productos</span>
        </div>
        <div id="compra-items-container" style="overflow-y: auto; max-height: 340px;">
          <!-- Items renderizados dinámicamente -->
        </div>
      </div>

      <!-- Footer: total + botón -->
      <div style="background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 16px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
          <span style="font-size: 18px; font-weight: 700; color: var(--text-dark);">TOTAL COSTO:</span>
          <span id="compra-total" style="font-size: 22px; font-weight: 700; color: var(--primary-color);">$0.00</span>
        </div>
        <button class="btn btn-primary" style="width: 100%; justify-content: center; padding: 14px;" onclick="window.compraCheckout()">
          <i class="ph ph-check-square"></i> Registrar Compra
        </button>
      </div>
    </div>
  `;

  document.getElementById('btn-nueva-compra').addEventListener('click', openProductoModal);
  document.getElementById('btn-clear-compra').addEventListener('click', () => {
    currentPurchase = [];
    renderCart();
    showToast('Orden limpiada');
  });

  renderCart();
}

// ──────────────────────────────────────────────
// MODAL DE SELECCIÓN DE PRODUCTOS (overlay propio)
// ──────────────────────────────────────────────
function openProductoModal() {
  // Crear overlay independiente para no interferir con ui.js
  const overlay = document.createElement('div');
  overlay.id = 'compra-producto-overlay';
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 1100;
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(4px); animation: fadeIn 0.2s ease;
  `;

  overlay.innerHTML = `
    <div style="
      background: var(--bg-card); width: 92%; max-width: 640px;
      border-radius: var(--radius); box-shadow: var(--shadow);
      border: 1px solid var(--border-color); display: flex; flex-direction: column;
      max-height: 90vh;
    ">
      <!-- Header -->
      <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-shrink: 0;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: var(--text-dark);">
          <i class="ph ph-package"></i> Seleccionar Productos
        </h3>
        <button id="compra-overlay-close" style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-muted); line-height: 1;">
          <i class="ph ph-x"></i>
        </button>
      </div>
      <!-- Body scrollable -->
      <div id="compra-overlay-body" style="padding: 16px 20px; overflow-y: auto; flex: 1;">
        ${buildProductModalContent()}
      </div>
      <!-- Footer -->
      <div style="padding: 12px 20px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; flex-shrink: 0;">
        <button class="btn btn-primary" id="compra-overlay-done">
          <i class="ph ph-check"></i> Listo
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const body = overlay.querySelector('#compra-overlay-body');
  const close = () => overlay.remove();

  overlay.querySelector('#compra-overlay-close').addEventListener('click', close);
  overlay.querySelector('#compra-overlay-done').addEventListener('click', close);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // Buscador
  const searchInput = body.querySelector('#modal-producto-search');
  searchInput.addEventListener('input', (e) => {
    renderModalProductList(body, e.target.value.toLowerCase());
  });

  // Botón crear producto inline
  body.querySelector('#btn-crear-producto-en-compra').addEventListener('click', () => {
    openInlineProductForm(body);
  });

  renderModalProductList(body, '');
  searchInput.focus();
}

function buildProductModalContent() {
  return `
    <div style="display: flex; flex-direction: column; gap: 12px;">
      <!-- Barra de herramientas del modal -->
      <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
        <div style="flex: 1; position: relative; min-width: 200px;">
          <i class="ph ph-magnifying-glass" style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted);"></i>
          <input
            type="text"
            id="modal-producto-search"
            placeholder="Buscar producto..."
            style="width: 100%; padding: 9px 12px 9px 34px; border: 1px solid var(--border-color); border-radius: var(--radius); background: var(--input-bg); color: var(--text-dark); font-size: 14px; box-sizing: border-box;"
          />
        </div>
        <button class="btn btn-primary btn-sm" id="btn-crear-producto-en-compra">
          <i class="ph ph-plus"></i> Crear nuevo producto
        </button>
      </div>

      <!-- Formulario inline de nuevo producto (oculto por defecto) -->
      <div id="inline-product-form" style="display: none; background: var(--primary-light); border: 1px solid var(--border-color); border-radius: var(--radius); padding: 14px;">
        <h4 style="margin: 0 0 12px; font-size: 14px; color: var(--primary-color);">
          <i class="ph ph-package"></i> Crear Producto Nuevo
        </h4>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text-dark); display: block; margin-bottom: 4px;">Nombre *</label>
            <input type="text" id="np-nombre" placeholder="Nombre del producto" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-dark); box-sizing: border-box;">
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text-dark); display: block; margin-bottom: 4px;">Código (SKU)</label>
            <input type="text" id="np-codigo" placeholder="Opcional" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-dark); box-sizing: border-box;">
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text-dark); display: block; margin-bottom: 4px;">Costo $</label>
            <input type="number" id="np-costo" value="0" min="0" step="0.01" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-dark); box-sizing: border-box;">
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text-dark); display: block; margin-bottom: 4px;">Precio Venta $</label>
            <input type="number" id="np-precio" value="0" min="0" step="0.01" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-dark); box-sizing: border-box;">
          </div>
          <div>
            <label style="font-size: 12px; font-weight: 600; color: var(--text-dark); display: block; margin-bottom: 4px;">Stock inicial</label>
            <input type="number" id="np-stock" value="0" min="0" style="width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-dark); box-sizing: border-box;">
          </div>
          <div style="display: flex; align-items: flex-end; gap: 8px;">
            <button class="btn btn-primary btn-sm" style="flex: 1; justify-content: center;" id="btn-guardar-nuevo-producto">
              <i class="ph ph-floppy-disk"></i> Guardar y agregar
            </button>
            <button class="btn btn-secondary btn-sm" id="btn-cancelar-nuevo-producto">
              <i class="ph ph-x"></i>
            </button>
          </div>
        </div>
      </div>

      <!-- Lista de productos -->
      <div id="modal-product-list" style="max-height: 380px; overflow-y: auto; display: flex; flex-direction: column; gap: 6px;">
        <!-- Se llena dinámicamente -->
      </div>
    </div>
  `;
}

function renderModalProductList(modalBody, filter) {
  const list = modalBody.querySelector('#modal-product-list');
  if (!list) return;

  const filtered = catalog.filter(p =>
    (p.nombre || '').toLowerCase().includes(filter) ||
    (p.codigo || '').toLowerCase().includes(filter)
  );

  if (!filtered.length) {
    list.innerHTML = `
      <div style="text-align: center; padding: 30px; color: var(--text-muted);">
        <i class="ph ph-magnifying-glass" style="font-size: 32px; display: block; margin-bottom: 8px;"></i>
        Sin productos. Puedes crear uno con el botón de arriba.
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.map(p => {
    const enOrden = currentPurchase.find(x => String(x.id) === String(p.id));
    return `
      <div style="display: flex; align-items: center; gap: 12px; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: var(--radius); background: var(--bg-card);">
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; font-size: 14px; color: var(--text-dark); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(p.nombre)}</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">
            Costo: $${p.costo || 0} &nbsp;·&nbsp; Stock: ${p.stock !== undefined ? p.stock : '∞'}
            ${p.codigo ? `&nbsp;·&nbsp; ${escapeHtml(p.codigo)}` : ''}
          </div>
        </div>
        ${enOrden
          ? `<span style="font-size: 12px; color: var(--primary-color); font-weight: 600; white-space: nowrap;"><i class="ph ph-check-circle"></i> x${enOrden.cantidad}</span>`
          : ''
        }
        <button
          class="btn ${enOrden ? 'btn-secondary' : 'btn-primary'} btn-sm btn-add-to-compra"
          data-id="${escapeHtml(p.id)}"
          style="white-space: nowrap; flex-shrink: 0;"
        >
          <i class="ph ph-${enOrden ? 'plus' : 'plus-circle'}"></i> ${enOrden ? '+1' : 'Agregar'}
        </button>
      </div>
    `;
  }).join('');

  // Listeners en botones de agregar
  list.querySelectorAll('.btn-add-to-compra').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.dataset.id;
      const prod = catalog.find(p => String(p.id) === String(id));
      if (!prod) return;
      addToCompra(prod);
      renderModalProductList(modalBody, modalBody.querySelector('#modal-producto-search')?.value.toLowerCase() || '');
    });
  });
}

function openInlineProductForm(modalBody) {
  const form = modalBody.querySelector('#inline-product-form');
  if (!form) return;
  form.style.display = form.style.display === 'none' ? 'block' : 'none';
  if (form.style.display === 'block') {
    modalBody.querySelector('#np-nombre')?.focus();

    const btnGuardar = modalBody.querySelector('#btn-guardar-nuevo-producto');
    const btnCancelar = modalBody.querySelector('#btn-cancelar-nuevo-producto');

    btnGuardar.onclick = async () => {
      const nombre = (modalBody.querySelector('#np-nombre')?.value || '').trim();
      if (!nombre) { showToast('El nombre es requerido', 'error'); return; }

      const newProd = {
        nombre,
        codigo: modalBody.querySelector('#np-codigo')?.value || '',
        costo: Number(modalBody.querySelector('#np-costo')?.value) || 0,
        precio: Number(modalBody.querySelector('#np-precio')?.value) || 0,
        stock: Number(modalBody.querySelector('#np-stock')?.value) || 0,
        categoria: 'Sin categoría',
        segimientoInventario: false
      };

      const tempId = 'temp-' + Date.now();
      newProd.id = tempId;
      catalog.push(newProd);
      addToCompra(newProd);

      showToast('Producto creado y agregado a la orden', 'success');
      form.style.display = 'none';
      modalBody.querySelector('#np-nombre').value = '';

      // Guardar en background
      saveEntity('productos', { ...newProd }).then(res => {
        const saved = res.data || newProd;
        if (saved?.id && saved.id !== tempId) {
          const idx = catalog.findIndex(p => p.id === tempId);
          if (idx > -1) catalog[idx] = saved;
          const cartIdx = currentPurchase.findIndex(p => p.id === tempId);
          if (cartIdx > -1) currentPurchase[cartIdx].id = saved.id;
        }
      }).catch(() => {});

      renderModalProductList(modalBody, modalBody.querySelector('#modal-producto-search')?.value.toLowerCase() || '');
    };

    btnCancelar.onclick = () => { form.style.display = 'none'; };
  }
}

function addToCompra(prod) {
  const existing = currentPurchase.findIndex(x => String(x.id) === String(prod.id));
  if (existing > -1) {
    currentPurchase[existing].cantidad++;
  } else {
    currentPurchase.push({
      id: prod.id,
      nombre: prod.nombre,
      costoNuevo: Number(prod.costo || 0),
      cantidad: 1
    });
  }
  renderCart();
}

// ──────────────────────────────────────────────
// CARRITO / ORDEN
// ──────────────────────────────────────────────
function renderCart() {
  const container = document.getElementById('compra-items-container');
  const totalEl = document.getElementById('compra-total');
  const countEl = document.getElementById('compra-count');
  if (!container) return;

  if (!currentPurchase.length) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: var(--text-muted);">
        <i class="ph ph-package" style="font-size: 40px; display: block; margin-bottom: 10px;"></i>
        Haz clic en <strong>Nueva Compra</strong> para agregar productos
      </div>
    `;
    if (totalEl) totalEl.textContent = '$0.00';
    if (countEl) countEl.textContent = '0 productos';
    return;
  }

  let total = 0;
  container.innerHTML = currentPurchase.map((item, idx) => {
    const sub = item.cantidad * item.costoNuevo;
    total += sub;
    return `
      <div style="display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--border-color);">
        <div style="flex: 1; min-width: 0;">
          <div style="font-weight: 600; font-size: 14px; color: var(--text-dark);">${escapeHtml(item.nombre)}</div>
          <div style="font-size: 12px; color: var(--text-muted); margin-top: 3px; display: flex; gap: 12px; flex-wrap: wrap;">
            <span>
              Cant:
              <input type="number" min="1" value="${item.cantidad}"
                onchange="window.compraUpdateQty(${idx}, this.value)"
                style="width: 52px; padding: 2px 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-dark); text-align: center;">
            </span>
            <span>
              Costo $:
              <input type="number" step="0.01" min="0" value="${item.costoNuevo}"
                onchange="window.compraUpdateCosto(${idx}, this.value)"
                style="width: 70px; padding: 2px 6px; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-dark); text-align: center;">
            </span>
          </div>
        </div>
        <div style="text-align: right; flex-shrink: 0;">
          <div style="font-weight: 700; font-size: 15px; color: var(--primary-color);">$${sub.toFixed(2)}</div>
          <button onclick="window.compraRemoveFromCart(${idx})"
            style="background: none; border: none; color: var(--danger-color); cursor: pointer; font-size: 12px; margin-top: 4px; padding: 0;">
            <i class="ph ph-trash"></i> Quitar
          </button>
        </div>
      </div>
    `;
  }).join('');

  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  if (countEl) countEl.textContent = `${currentPurchase.length} producto${currentPurchase.length !== 1 ? 's' : ''}`;
}

window.compraUpdateQty = (idx, value) => {
  const v = parseInt(value);
  if (v < 1) return;
  currentPurchase[idx].cantidad = v;
  renderCart();
};

window.compraUpdateCosto = (idx, value) => {
  const v = parseFloat(value);
  if (v < 0) return;
  currentPurchase[idx].costoNuevo = v;
  renderCart();
};

window.compraRemoveFromCart = (idx) => {
  currentPurchase.splice(idx, 1);
  renderCart();
};

// ──────────────────────────────────────────────
// CHECKOUT
// ──────────────────────────────────────────────
window.compraCheckout = () => {
  const providerId = document.getElementById('compra-proveedor')?.value;
  if (!providerId) return showToast('Debes seleccionar un proveedor', 'error');
  if (!currentPurchase.length) return showToast('La orden está vacía', 'error');

  const total = currentPurchase.reduce((acc, i) => acc + (i.costoNuevo * i.cantidad), 0);

  const formHtml = `
    <div style="margin-bottom: 16px; text-align: center;">
      <div style="font-size: 28px; font-weight: 700; color: var(--primary-color);">$${total.toFixed(2)}</div>
      <div style="font-size: 13px; color: var(--text-muted);">Total de la compra · ${currentPurchase.length} producto${currentPurchase.length !== 1 ? 's' : ''}</div>
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 6px; font-weight: 600;">Método de Pago *</label>
      <select name="metodoPago" required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius); background: var(--input-bg); color: var(--text-dark);">
        <option value="Efectivo">Efectivo</option>
        <option value="Transferencia">Transferencia / Nequi</option>
        <option value="En Consignacion">En Consignación</option>
        <option value="Crédito">Crédito</option>
      </select>
    </div>
  `;

  showFormModal('Confirmar Compra', formHtml, async (form) => {
    const fd = getFormData(form);
    const provider = providers.find(p => p.id === providerId);

    const compraObj = {
      fecha: new Date().toISOString(),
      proveedor: provider ? provider.nombre : providerId,
      metodoPago: fd.metodoPago,
      total,
      itemsJSON: JSON.stringify(currentPurchase)
    };

    await saveEntity(RESOURCE, compraObj);

    for (const item of currentPurchase) {
      const p = catalog.find(x => x.id === item.id);
      if (p) {
        p.costo = item.costoNuevo;
        if (p.segimientoInventario === true || p.segimientoInventario === 'si' || p.segimientoInventario === 'true') {
          p.stock = Number(p.stock || 0) + item.cantidad;
        }
        await saveEntity('productos', p);
      }
    }

    showToast('Compra registrada correctamente', 'success');
    currentPurchase = [];
    renderCart();
  });
};
