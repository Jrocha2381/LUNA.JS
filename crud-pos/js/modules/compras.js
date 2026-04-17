import { getEntities, saveEntity } from '../api.js';
import { showFormModal, showToast, escapeHtml, getFormData } from '../ui.js';

const RESOURCE = "compras";
let containerElement;
let currentPurchase = [];
let catalog = [];
let providers = [];

export async function init(container) {
  containerElement = container;
  try {
    catalog = await getEntities("productos");
    providers = await getEntities("proveedores");
  } catch(e) { }
}

export function render() {
  containerElement.innerHTML = `
    <div style="display: flex; gap: 24px; height: calc(100vh - 120px);">
      <!-- Pane Izquierdo: Catálogo y Buscador -->
      <div style="flex: 2; display: flex; flex-direction: column; background: var(--bg-card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px; overflow-y: auto;">
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
           <h2 style="font-size: 18px; font-weight: 600;">Productos para Comprar (Reabastecer)</h2>
        </div>

        <input type="text" id="compra-search" placeholder="Buscar producto existente..." style="padding: 12px; width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius); margin-bottom: 20px; font-size: 16px;">
        
        <div id="compra-catalog-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; overflow-y: auto;">
           <!-- Se llena dinámicamente -->
        </div>
      </div>

      <!-- Pane Derecho: Orden de Compra -->
      <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; background: var(--bg-card); border-radius: var(--radius); box-shadow: var(--shadow);">
        <div style="padding: 20px; border-bottom: 1px solid var(--border-color);">
           <h2 style="font-size: 18px; font-weight: 600;">Orden de Compra</h2>
           <div style="margin-top: 10px;">
             <label style="display:block; margin-bottom:4px; font-weight:600; font-size:14px;">Proveedor *</label>
             <select id="compra-proveedor" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
               <option value="">Seleccionar Proveedor...</option>
               ${providers.map(p => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nombre)}</option>`).join('')}
             </select>
           </div>
        </div>
        
        <div id="compra-cart-items" style="flex: 1; overflow-y: auto; padding: 20px;">
           <!-- Items de la Compra -->
        </div>

        <div style="padding: 20px; background: var(--primary-light); border-top: 1px solid var(--border-color);">
           <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 20px; font-weight: 700; color: var(--primary-color);">
             <span>TOTAL COSTO:</span>
             <span id="compra-total">$0.00</span>
           </div>
           <div>
             <button class="btn btn-primary" style="width: 100%; justify-content: center;" onclick="window.compraCheckout()"><i class="ph ph-check-square"></i> Registrar Compra</button>
           </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("compra-search").addEventListener("input", (e) => {
    renderCatalog(e.target.value.toLowerCase());
  });

  renderCatalog();
  renderCart();
}

function renderCatalog(filter = "") {
  const grid = document.getElementById("compra-catalog-grid");
  const filtered = catalog.filter(p => p.nombre.toLowerCase().includes(filter) || (p.codigo && p.codigo.toLowerCase().includes(filter)));
  
  if(!filtered.length) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">Sin resultados. Ve a Productos para añadirlo primero.</div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div style="border: 1px solid var(--border-color); border-radius: var(--radius); padding: 12px; text-align: center; cursor: pointer;" onclick="window.compraAddToCart('${escapeHtml(p.id)}')">
      <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${escapeHtml(p.nombre)}</div>
      <div style="color: var(--text-muted); font-size: 12px;">Costo act: $${p.costo || 0}</div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Stock: ${p.stock || 0}</div>
    </div>
  `).join('');
}

function renderCart() {
  const container = document.getElementById("compra-cart-items");
  const totalEl = document.getElementById("compra-total");

  if (!currentPurchase.length) {
    container.innerHTML = `<div style="text-align:center; color: var(--text-muted); margin-top: 40px;">No has agregado productos a reabastecer</div>`;
    totalEl.textContent = `$0.00`;
    return;
  }

  let total = 0;
  container.innerHTML = currentPurchase.map((item, idx) => {
    const sub = item.cantidad * item.costoNuevo;
    total += sub;
    return `
      <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 12px;">
         <div style="font-weight: 600; font-size: 14px; line-height:1.2; margin-bottom: 6px;">${escapeHtml(item.nombre)}</div>
         <div style="display: flex; gap: 8px; margin-bottom: 6px;">
           <label style="font-size:12px; color:var(--text-muted);">Q: 
             <input type="number" min="1" value="${item.cantidad}" onchange="window.compraUpdateQty(${idx}, this.value)" style="width: 50px; padding: 2px;">
           </label>
           <label style="font-size:12px; color:var(--text-muted);">Costo $: 
             <input type="number" step="0.01" min="0" value="${item.costoNuevo}" onchange="window.compraUpdateCosto(${idx}, this.value)" style="width: 70px; padding: 2px;">
           </label>
         </div>
         <div style="display: flex; justify-content: space-between; align-items: center;">
            <button onclick="window.compraRemoveFromCart(${idx})" style="background: none; border: none; color: var(--danger-color); cursor: pointer; font-size: 12px;"><i class="ph ph-trash"></i> Quitar</button>
            <div style="font-weight: bold; font-size: 14px;">$${sub.toFixed(2)}</div>
         </div>
      </div>
    `;
  }).join('');

  totalEl.textContent = `$${total.toFixed(2)}`;
}

window.compraAddToCart = (productId) => {
  const prod = catalog.find(p => p.id === productId);
  if (!prod) return;

  const existingIdx = currentPurchase.findIndex(item => item.id === productId);
  if (existingIdx > -1) {
    currentPurchase[existingIdx].cantidad++;
  } else {
    currentPurchase.push({
      id: prod.id, nombre: prod.nombre, costoNuevo: Number(prod.costo || 0), cantidad: 1
    });
  }
  renderCart();
  showToast("Producto añadido a la orden");
};

window.compraUpdateQty = (idx, value) => {
  const v = parseInt(value);
  if(v < 1) return;
  currentPurchase[idx].cantidad = v;
  renderCart();
};

window.compraUpdateCosto = (idx, value) => {
  const v = parseFloat(value);
  if(v < 0) return;
  currentPurchase[idx].costoNuevo = v;
  renderCart();
};

window.compraRemoveFromCart = (idx) => {
  currentPurchase.splice(idx, 1);
  renderCart();
};

window.compraCheckout = () => {
  const providerId = document.getElementById("compra-proveedor").value;
  
  if(!providerId) return showToast("Debes seleccionar un proveedor", "error");
  if(!currentPurchase.length) return showToast("La orden está vacía", "error");
  
  const total = currentPurchase.reduce((acc, i) => acc + (i.costoNuevo * i.cantidad), 0);
  
  const formHtml = `
    <div style="margin-bottom: 15px; text-align: center;">
      <h3 style="font-size: 24px; color: var(--primary-color);">Costo Total: $${total.toFixed(2)}</h3>
    </div>
    
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">Método de Pago (Compra) *</label>
      <select name="metodoPago" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
        <option value="Efectivo">Efectivo</option>
        <option value="Nequi">Credito / Nequi</option>
        <option value="En Consignacion">En Consignación</option>
      </select>
    </div>
  `;

  showFormModal("Confirmar Registro de Compra", formHtml, async (form) => {
     const fd = getFormData(form);
     
     const compraObj = {
       id: "",
       fecha: new Date().toISOString(),
       proveedorId: providerId,
       metodoPago: fd.metodoPago,
       total: total,
       itemsJson: JSON.stringify(currentPurchase)
     };

     // 1. Guardar Compra
     await saveEntity(RESOURCE, compraObj);
     
     // 2. Sumar Stock de Productos + Actualizar su Costo si cambió
     for(let item of currentPurchase) {
        const p = catalog.find(x => x.id === item.id);
        if(p) {
           p.costo = item.costoNuevo; // Actualizar costo
           if(p.segimientoInventario === true || p.segimientoInventario === "si" || p.segimientoInventario === "true") {
              p.stock = Number(p.stock || 0) + item.cantidad; // Sumar inventario
           }
           await saveEntity("productos", p); // Subir a sheet
        }
     }
     
     showToast("Compra Registrada Correctamente 📦");
     currentPurchase = [];
     renderCart();
     // Reset catalog view
     renderCatalog(document.getElementById("compra-search").value);
  });
};
