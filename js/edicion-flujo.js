// js/edicion-flujo.js
/**
 * Módulo de Edición Rápida en Flujo de Venta.
 * Permite modificar productos sin salir de la interfaz de compra o catálogo.
 */
(function () {
    // 1. Estilos del modal de edición rápida
    const css = `
        #modal-ef { display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:10000; justify-content:center; align-items:center; }
        .modal-ef-content { background:white; padding:25px; border-radius:15px; width:350px; font-family: 'Segoe UI', sans-serif; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }
        .modal-ef-content h2 { margin:0 0 5px; font-size:1.2rem; color:#333; }
        .modal-ef-content p { margin:0 0 20px; font-size:0.85rem; color:#666; }
        .modal-ef-content label { display:block; font-size:0.75rem; font-weight:700; color:#8a9b2f; margin-bottom:5px; }
        .modal-ef-content input { width:100%; padding:10px; margin-bottom:15px; border:1px solid #ddd; border-radius:8px; box-sizing:border-box; font-size:1rem; }
        .modal-ef-actions { display:flex; gap:10px; }
        .btn-ef-save { flex:1; padding:12px; background:#8a9b2f; color:white; border:none; border-radius:8px; font-weight:700; cursor:pointer; }
        .btn-ef-cancel { flex:1; padding:12px; background:#f5f5f5; color:#333; border:none; border-radius:8px; font-weight:700; cursor:pointer; }
    `;
    const style = document.createElement('style'); style.innerHTML = css; document.head.appendChild(style);

    // 2. Estructura del Modal
    const html = `
        <div id="modal-ef">
            <div class="modal-ef-content">
                <h2>Edición Rápida</h2>
                <p>Modifica el producto en tiempo real.</p>
                <input type="hidden" id="ef-id">
                <label>NOMBRE</label>
                <input type="text" id="ef-nombre">
                <label>PRECIO DE VENTA ($)</label>
                <input type="number" id="ef-precio">
                <label>STOCK DISPONIBLE</label>
                <input type="number" id="ef-stock">
                <div class="modal-ef-actions">
                    <button id="ef-cancel" class="btn-ef-cancel">Cerrar</button>
                    <button id="ef-save" class="btn-ef-save">Actualizar</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', html);

    const modal = document.getElementById('modal-ef');
    const fId = document.getElementById('ef-id'), fNombre = document.getElementById('ef-nombre'),
        fPrecio = document.getElementById('ef-precio'), fStock = document.getElementById('ef-stock');

    // 3. Función Global para abrir el editor
    window.abrirEditorFlujo = function (id) {
        const prod = window.obtenerProductos().find(p => p.id == id);
        if (!prod) return;
        fId.value = prod.id; fNombre.value = prod.nombre;
        fPrecio.value = prod.precioVenta; fStock.value = prod.stock;
        modal.style.display = 'flex';
    };

    document.getElementById('ef-cancel').onclick = () => modal.style.display = 'none';

    document.getElementById('ef-save').onclick = function () {
        const cambios = {
            nombre: fNombre.value,
            precioVenta: parseFloat(fPrecio.value),
            stock: parseInt(fStock.value)
        };

        const result = window.actualizarProducto(fId.value, cambios);
        if (result.ok) {
            modal.style.display = 'none';
            if (window.mostrarToast) window.mostrarToast("success", "Éxito", "Producto actualizado correctamente.");

            // Reflejo inmediato: Llamamos a las funciones de renderizado si existen en la página actual
            if (typeof window.renderizarProductos === 'function') window.renderizarProductos();
            if (typeof window.renderCarrito === 'function') window.renderCarrito();

            // Si no hay funciones de renderizado (ej. buscador), recargamos para asegurar consistencia
            if (typeof window.renderizarProductos !== 'function' && typeof window.renderCarrito !== 'function') {
                location.reload();
            }
        } else {
            if (window.mostrarToast) window.mostrarToast("error", "Error de Validación", result.errores.join("<br>"));
            else console.error(result.errores.join("\n"));
        }
    };

    // 4. Atajo: Ctrl + Clic en cualquier tarjeta de producto para editar
    document.addEventListener('click', (e) => {
        if (e.ctrlKey) {
            const card = e.target.closest('.card') || e.target.closest('.resultado-card') || e.target.closest('tr');
            if (card) {
                const id = card.dataset.id || card.querySelector('[data-id]')?.dataset.id || card.innerText.match(/\d+/)?.[0];
                if (id) window.abrirEditorFlujo(id);
            }
        }
    });
})();