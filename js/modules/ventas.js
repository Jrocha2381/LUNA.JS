import { getEntities, saveEntity, deleteEntity } from '../api.js';
import { showConfirmModal, showFormModal, showToast, escapeHtml } from '../ui.js';
import { openFormModal as editProductModal } from './productos.js';

let containerElement;
let currentCart = [];
let openSales = [];
let catalog = [];
let clients = [];
let currentSaleId = null;

// Escuchamos si Productos crea o elimina un item para actualizar nuestro POS automáticamente a 0ms
window.addEventListener('cambioCatalogo', (e) => {
  catalog = e.detail;
  renderCatalog();
});

export async function init(container) {
  containerElement = container;
  try {
    catalog = await getEntities("productos");
    clients = await getEntities("clientes");
    
    // Load existing open sales
    const allSales = await getEntities("ventas");
    openSales = allSales.filter(s => s.estado === "abierta");
  } catch(e) { }
}

export function render() {
  containerElement.innerHTML = `
    <div class="dual-pane-container">
      <!-- Pane Izquierdo: Catálogo y Buscador -->
      <div class="dual-pane-left">
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
           <h2 style="font-size: 18px; font-weight: 600;">Productos</h2>
           <button class="btn btn-secondary btn-sm" id="btn-load-open"><i class="ph ph-folder-open"></i> Ventas en Espera (${openSales.length})</button>
        </div>

        <input type="text" id="pos-search" placeholder="Buscar producto por nombre o código..." style="background: var(--input-bg); color: var(--text-dark); padding: 12px; width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius); margin-bottom: 20px; font-size: 16px;">
        
        <div id="pos-catalog-grid" class="product-grid">
           <!-- Se llena dinámicamente -->
        </div>
      </div>

      <!-- Pane Derecho: Carrito / Ticket -->
      <div class="dual-pane-right">
        <div style="padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
           <h2 style="font-size: 18px; font-weight: 600;" id="cart-title">Ticket Actual</h2>
           <button class="btn btn-secondary btn-sm" onclick="window.posClearCart()"><i class="ph ph-trash"></i></button>
        </div>
        
        <div id="pos-cart-items" class="cart-container">
           <!-- Items del Carrito -->
        </div>

        <div class="cart-footer">
           <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 20px; font-weight: 700; color: var(--primary-color);">
             <span>TOTAL:</span>
             <span id="pos-total">$0.00</span>
           </div>
           <div style="display: flex; gap: 8px; flex-direction: column;">
             <button class="btn btn-secondary" style="flex:1" onclick="window.posHoldSale()"><i class="ph ph-pause"></i> Pausar</button>
             <button class="btn btn-primary" style="flex:1" onclick="window.posCheckout()"><i class="ph ph-check-square"></i> Cobrar</button>
           </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("pos-search").addEventListener("input", (e) => {
    renderCatalog(e.target.value.toLowerCase());
  });

  document.getElementById("btn-load-open").addEventListener("click", showOpenSalesModal);

  renderCatalog();
  renderCart();
}

function renderCatalog(filter = "") {
  const grid = document.getElementById("pos-catalog-grid");
  const filtered = catalog.filter(p => p.nombre.toLowerCase().includes(filter) || (p.codigo && p.codigo.toLowerCase().includes(filter)));
  
  if(!filtered.length) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">Sin resultados</div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => `
    <div style="border: 1px solid var(--border-color); background: var(--bg-solid); border-radius: var(--radius); padding: 12px; text-align: center; position: relative; transition: all 0.3s ease; box-shadow: var(--shadow);" class="product-card" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='var(--primary-color)'" onmouseout="this.style.transform='none'; this.style.borderColor='var(--border-color)'">
      <button onclick="window.posEditProduct('${escapeHtml(p.id)}')" style="position: absolute; top: 8px; right: 8px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px; cursor: pointer; color: var(--text-muted); transition: 0.2s;" onmouseover="this.style.color='var(--primary-color)'" onmouseout="this.style.color='var(--text-muted)'"><i class="ph ph-pencil-simple"></i></button>
      
      <div onclick="window.posAddToCart('${escapeHtml(p.id)}')" style="cursor:pointer; display: flex; flex-direction: column; justify-content: center; height: 100%;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: var(--text-dark); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; padding-top: 20px;">${escapeHtml(p.nombre)}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
          <div style="color: var(--primary-color); font-weight: bold; font-size: 16px;">$${p.precio || 0}</div>
          <div style="font-size: 12px; color: var(--text-muted); background: var(--input-bg); padding: 2px 6px; border-radius: 4px;" title="Stock"><i class="ph ph-package"></i> ${p.segimientoInventario ? p.stock : '∞'}</div>
        </div>
      </div>
    </div>
  `).join('');
}

function renderCart() {
  const container = document.getElementById("pos-cart-items");
  const totalEl = document.getElementById("pos-total");
  const titleEl = document.getElementById("cart-title");

  titleEl.textContent = currentSaleId ? "Retomando Venta" : "Ticket Actual";

  if (!currentCart.length) {
    container.innerHTML = `<div style="text-align:center; color: var(--text-muted); margin-top: 40px;">Carrito vacío</div>`;
    totalEl.textContent = `$0.00`;
    return;
  }

  let total = 0;
  container.innerHTML = currentCart.map((item, idx) => {
    const sub = item.cantidad * item.precio;
    total += sub;
    return `
      <div style="display: flex; gap: 12px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; margin-bottom: 12px;">
         <div style="flex: 1;">
            <div style="font-weight: 600; font-size: 14px; line-height:1.2; color: var(--text-dark);">${escapeHtml(item.nombre)}</div>
            <div style="color: var(--text-muted); font-size: 13px; margin-top:4px;">$${item.precio} x 
              <input type="number" min="1" value="${item.cantidad}" onchange="window.posUpdateQty(${idx}, this.value)" style="width: 50px; padding: 2px; text-align: center; border: 1px solid var(--border-color); border-radius: 4px; background: var(--input-bg); color: var(--text-dark);">
            </div>
         </div>
         <div style="text-align: right;">
            <div style="font-weight: bold; margin-bottom: 8px; color: var(--text-dark);">$${sub.toFixed(2)}</div>
            <button onclick="window.posRemoveFromCart(${idx})" style="background: none; border: none; color: var(--danger-color); cursor: pointer; transition: 0.2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'"><i class="ph ph-trash"></i> Quitar</button>
         </div>
      </div>
    `;
  }).join('');

  totalEl.textContent = `$${total.toFixed(2)}`;
}

window.posAddToCart = (productId) => {
    const prod = catalog.find(p => String(p.id) === String(productId));

  const existingIdx = currentCart.findIndex(item => String(item.id) === String(productId));
  if (existingIdx > -1) {
    currentCart[existingIdx].cantidad++;
  } else {
    currentCart.push({
      id: prod.id, nombre: prod.nombre, precio: Number(prod.precio), costo: Number(prod.costo), cantidad: 1
    });
  }
  renderCart();
  showToast("Producto agregado");
};

window.posUpdateQty = (idx, value) => {
  const v = parseInt(value);
  if(v < 1) return;
  currentCart[idx].cantidad = v;
  renderCart();
};

window.posRemoveFromCart = (idx) => {
  currentCart.splice(idx, 1);
  renderCart();
};

window.posClearCart = () => {
  currentCart = [];
  currentSaleId = null;
  renderCart();
};

// --- Requerimiento: Editar Producto En Caliente ---
window.posEditProduct = (productId) => {
    const prod = catalog.find(p => String(p.id) === String(productId));
  editProductModal(prod, (updatedProd) => {
     // Reemplazar local
     const idx = catalog.findIndex(x => x.id === updatedProd.id);
     if(idx > -1) catalog[idx] = updatedProd;
     // Actualizar carrito si está adentro
     const cartIdx = currentCart.findIndex(x => x.id === updatedProd.id);
     if(cartIdx > -1) {
       currentCart[cartIdx].nombre = updatedProd.nombre;
       currentCart[cartIdx].precio = Number(updatedProd.precio);
       renderCart();
     }
     renderCatalog(document.getElementById("pos-search").value);
  });
};

// --- Requerimiento: "Hold" Venta Abierta ---
window.posHoldSale = async () => {
  if(!currentCart.length) return showToast("El carrito está vacío", "error");

  const total = currentCart.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
  const saleObj = {
    id: currentSaleId || "",
    fecha: new Date().toISOString(),
    clienteId: "",
    metodoPago: "",
    estado: "abierta",
    total: total,
    itemsJSON: JSON.stringify(currentCart)
  };

  await saveEntity("ventas", saleObj);
  showToast("Venta guardada en espera");
  
  if(!currentSaleId) openSales.push(saleObj);
  else {
    const ix = openSales.findIndex(x => x.id === currentSaleId);
    if(ix > -1) openSales[ix] = saleObj;
  }
  
  document.getElementById("btn-load-open").innerHTML = `<i class="ph ph-folder-open"></i> Ventas en Espera (${openSales.length})`;
  window.posClearCart();
};

function showOpenSalesModal() {
  if(!openSales.length) return showToast("No hay ventas abiertas", "error");

  let html = `<ul style="list-style: none; padding: 0;">`;
  html += openSales.map(v => `
    <li style="padding: 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>Venta Abierta</strong> <br>
        <small style="color: var(--text-muted);">${new Date(v.fecha).toLocaleString()} - $${v.total}</small>
      </div>
      <button class="btn btn-primary btn-sm" onclick="window.posResumeSale('${escapeHtml(v.id)}')">Retomar</button>
    </li>
  `).join('');
  html += `</ul>`;

  showConfirmModal("Ventas en Espera", html, () => {
     // Callback does nothing special, closes modal
  });
}

window.posResumeSale = (saleId) => {
  const sale = openSales.find(s => s.id === saleId);
  if(sale) {
    currentSaleId = sale.id;
    currentCart = JSON.parse(sale.itemsJSON);
    renderCart();
    
    // Close overlapping modals using DOM direct to mock standard cancel
    document.getElementById("modal-btn-cancel").click(); 
  }
};

// --- Requerimiento: Cobrar Venta Cierre ---
window.posCheckout = () => {
  if(!currentCart.length) return showToast("El carrito está vacío", "error");
  
  const total = currentCart.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
  
  const clientOptions = clients.map(c => `<option value="${escapeHtml(c.id)}">${escapeHtml(c.nombre)}</option>`).join('');

  const formHtml = `
    <div style="margin-bottom: 15px; text-align: center;">
      <h3 style="font-size: 24px; color: var(--primary-color);">Total a pagar: $${total.toFixed(2)}</h3>
    </div>
    
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">Método de Pago *</label>
      <select name="metodoPago" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
        <option value="Efectivo">Efectivo</option>
        <option value="Nequi">Nequi</option>
        <option value="Debe">Debe (Cuenta por Cobrar)</option>
      </select>
    </div>
    
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">Cliente Asociado (Opcional o si Debe)</label>
      <select name="clienteId" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
        <option value="">Consumidor Final</option>
        ${clientOptions}
      </select>
    </div>
  `;

  showFormModal("Cerrar Venta", formHtml, async (form) => {
     const fd = new FormData(form);
     const method = fd.get("metodoPago");
     const client = fd.get("clienteId");
     
     if (method === "Debe" && !client) {
       throw new Error("Debe asociar un cliente si el pago es 'Debe'");
     }

     const saleObj = {
       id: currentSaleId || "",
       fecha: new Date().toISOString(),
       clienteId: client,
       metodoPago: method,
       estado: "cerrada",
       total: total,
       itemsJSON: JSON.stringify(currentCart)
     };

     // 1. Guardar o actualizar la venta
     await saveEntity("ventas", saleObj);
     
     // 2. Descontar Stock de Productos en el catálogo. Peticiones concurrentes limitadas
     for(let item of currentCart) {
        const p = catalog.find(x => x.id === item.id);
        if(p && (p.segimientoInventario === true || p.segimientoInventario === "si" || p.segimientoInventario === "true")) {
           p.stock = Number(p.stock || 0) - item.cantidad;
           await saveEntity("productos", p); // Update Stock
        }
     }

     // Remove from openSales if it was resumed
     if(currentSaleId) {
        openSales = openSales.filter(x => x.id !== currentSaleId);
     }
     
     showToast("Venta Exitosa y Cerrada 🥳");
     window.posClearCart();
     // Re-render catalogue to show updated stock
     renderCatalog(document.getElementById("pos-search").value);
  });
};
