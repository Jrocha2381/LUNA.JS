﻿import { getEntities, saveEntity } from '../api.js';
import { escapeHtml, showConfirmModal, showToast } from '../ui.js';

let containerElement;
let cacheData = []; 

export async function init(container) {
  containerElement = container;
}

export async function render() {
  containerElement.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px;">Cargando historial...</div>`;
  
  try {
    cacheData = await getEntities("ventas");
    const closedSales = cacheData.filter(s => s.estado === "cerrada" || s.estado === "anulada" || s.estado === "reembolsada").sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
    
    if(!closedSales.length) {
      containerElement.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px;"><i class="ph ph-receipt" style="font-size:48px; margin-bottom:12px;"></i><br>No hay ventas registradas</div>`;
      return;
    }

    containerElement.innerHTML = `
      <div style="background: var(--bg-card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px;">
        <h2 style="margin-bottom: 20px; font-weight: 600; color: var(--primary-color);">Historial de Ventas</h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
             <thead style="background: var(--primary-light); text-align: left;">
               <tr>
                 <th style="padding: 12px; border-bottom: 2px solid var(--border-color);">ID Venta</th>
                 <th style="padding: 12px; border-bottom: 2px solid var(--border-color);">Fecha</th>
                 <th style="padding: 12px; border-bottom: 2px solid var(--border-color);">Método Pago</th>
                 <th style="padding: 12px; border-bottom: 2px solid var(--border-color); text-align: right;">Total</th>
                 <th style="padding: 12px; border-bottom: 2px solid var(--border-color); text-align: center;">Ticket / Acciones</th>
               </tr>
             </thead>
             <tbody>
               ` + closedSales.map(v => `
                 <tr style="border-bottom: 1px solid var(--border-color); ` + (v.estado === 'anulada' ? 'opacity:0.5;' : '') + `">
                   <td style="padding: 12px; font-family: monospace; color: var(--text-muted);">` + escapeHtml(v.id) + `</td>
                   <td style="padding: 12px;">` + new Date(v.fecha).toLocaleString() + `</td>
                   <td style="padding: 12px;">
                     <span style="background: var(--bg-solid); padding: 4px 8px; border-radius: 12px; font-size: 12px;">` + escapeHtml(v.metodoPago) + `</span>
                     <br><small style="font-weight: bold; color: ` + (v.estado === 'cerrada' ? 'var(--primary-color)' : 'var(--danger-color)') + `;">` + v.estado.toUpperCase() + `</small>
                   </td>
                   <td style="padding: 12px; text-align: right; font-weight: 600; color: var(--primary-color);">$` + Number(v.total).toFixed(2) + `</td>
                   <td style="padding: 12px; text-align: center; display: flex; gap: 8px; justify-content: center;">
                     <button class="btn btn-secondary btn-sm" onclick="window.posViewFactura('` + escapeHtml(v.id) + `')"><i class="ph ph-receipt"></i> Ver Factura</button>
                     ` + (v.estado === 'cerrada' ? `<button class="btn btn-danger btn-sm" onclick="window.posVoidVenta('` + escapeHtml(v.id) + `')"><i class="ph ph-x-circle"></i> Anular</button>` : '') + `
                   </td>
                 </tr>
               `).join('') + `
             </tbody>
          </table>
        </div>
      </div>
    `;
  } catch(e) {
    containerElement.innerHTML = `<div style="text-align: center; color: var(--danger-color); padding: 40px;">Error al cargar el historial</div>`;
  }
}

window.posViewFactura = (id) => {
  const v = cacheData.find(x => String(x.id) === String(id));
  if(!v) return;
  
  let itemsHtml = "";
  try {
    const items = JSON.parse(v.itemsJSON);
    itemsHtml = items.map(i => '<div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>' + i.cantidad + 'x ' + i.nombre + '</span><span>$' + (i.precio * i.cantidad).toFixed(2) + '</span></div>').join('');
  } catch(e) {}

  const html = `
    <div class="ticket-realistic">
      <h3 style="text-align: center; margin-bottom: 2px;">PAPEL & LUNA</h3>
      <p style="text-align: center; font-size: 12px; margin-bottom: 20px; color: #555;">Documento Tributario Equivalente<br>Ticket N° ` + v.id + `</p>
      
      <div style="font-size: 14px; margin-bottom: 15px;">
        <div style="display:flex; justify-content:space-between;"><span>Fecha:</span><span>` + new Date(v.fecha).toLocaleString() + `</span></div>
        <div style="display:flex; justify-content:space-between;"><span>Pago:</span><span>` + v.metodoPago + `</span></div>
        <div style="display:flex; justify-content:space-between;"><span>Estado:</span><span style="` + (v.estado==='anulada'?'color:red;':'') + `">` + v.estado.toUpperCase() + `</span></div>
      </div>

      <div style="border-top: 1px dashed var(--ticket-border); border-bottom: 1px dashed var(--ticket-border); padding: 15px 0; margin-bottom: 15px; font-size: 14px;">
        <div style="display:flex; justify-content:space-between; font-weight: bold; margin-bottom: 8px;"><span>Cant Desc</span><span>Monto</span></div>
        ` + itemsHtml + `
      </div>
      
      <div style="display:flex; justify-content:space-between; font-size: 18px; font-weight: bold;">
        <span>TOTAL:</span><span>$` + Number(v.total).toFixed(2) + `</span>
      </div>
      <p style="text-align: center; font-size: 12px; margin-top: 20px; color: #777;">Gracias por su compra</p>
    </div>
  `;
  showConfirmModal("Detalle de Venta", html, () => {});
};

window.posVoidVenta = (id) => {
  showConfirmModal("Anular Venta", "<b>Atención:</b> Anularás esta venta y el inventario de los productos se contemplará en el próximo refactor (RF-70 a RF-73).<br><br>¿Estás completamente seguro?", async () => {
    const v = cacheData.find(x => String(x.id) === String(id));
    if(!v) return;

    v.estado = "anulada";
    render();
    showToast("Anulando Venta en Sheets...");

    await saveEntity("ventas", v);
    showToast("Venta Anulada", "success");
  });
};
