(() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) =>
    function __init() {
      return (fn && (res = (0, fn[__getOwnPropNames(fn)[0]])((fn = 0))), res);
    };
  var __commonJS = (cb, mod) =>
    function __require() {
      return (
        mod ||
          (0, cb[__getOwnPropNames(cb)[0]])(
            (mod = { exports: {} }).exports,
            mod,
          ),
        mod.exports
      );
    };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };

  // js/ui.js
  function showToast(message, type = "success") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    const icon =
      type === "success"
        ? '<i class="ph-fill ph-check-circle"></i>'
        : '<i class="ph-fill ph-warning-circle"></i>';
    toast.innerHTML = `${icon} <span>${message}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add("show"));
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }
  function showError(msg) {
    showToast(msg, "error");
  }
  function closeModal() {
    modalOverlay.classList.remove("show");
    onConfirmCallback = null;
  }
  function showConfirmModal(title, msgHtml, onConfirm) {
    modalTitle.textContent = title;
    modalBody.innerHTML = msgHtml;
    btnConfirm.textContent = "S\xED, Confirmar";
    btnConfirm.className = "btn btn-danger";
    onConfirmCallback = onConfirm;
    modalOverlay.classList.add("show");
  }
  function showFormModal(title, formHtml, onSave) {
    modalTitle.textContent = title;
    modalBody.innerHTML = `<form id="dynamic-form" autocomplete="off">${formHtml}</form>`;
    btnConfirm.textContent = "Guardar";
    btnConfirm.className = "btn btn-primary";
    onConfirmCallback = async () => {
      const form = document.getElementById("dynamic-form");
      if (!form.reportValidity()) return false;
      return await onSave(form);
    };
    modalOverlay.classList.add("show");
  }
  function getFormData(form) {
    const formData = new FormData(form);
    const payload = {};
    formData.forEach((value, key) => {
      let cleanVal = typeof value === "string" ? value.trim() : value;
      if (key === "segimientoInventario") {
        cleanVal =
          cleanVal.toLowerCase() === "si" || cleanVal.toLowerCase() === "true";
      }
      if (
        ["precio", "costo", "stock", "cantidad"].includes(key) &&
        cleanVal !== ""
      ) {
        cleanVal = Number(cleanVal);
      }
      payload[key] = cleanVal;
    });
    return payload;
  }
  function escapeHtml(str) {
    if (str === null || str === void 0) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
  var modalOverlay,
    modalTitle,
    modalBody,
    btnCancel,
    btnConfirm,
    btnClose,
    onConfirmCallback;
  var init_ui = __esm({
    "js/ui.js"() {
      modalOverlay = document.getElementById("main-modal");
      modalTitle = document.getElementById("modal-title");
      modalBody = document.getElementById("modal-body");
      btnCancel = document.getElementById("modal-btn-cancel");
      btnConfirm = document.getElementById("modal-btn-confirm");
      btnClose = document.getElementById("modal-close");
      onConfirmCallback = null;
      btnCancel.addEventListener("click", closeModal);
      btnClose.addEventListener("click", closeModal);
      btnConfirm.addEventListener("click", async () => {
        if (typeof onConfirmCallback === "function") {
          const originalText = btnConfirm.textContent;
          btnConfirm.disabled = true;
          btnConfirm.textContent = "Procesando...";
          try {
            const closeAfter = await onConfirmCallback();
            if (closeAfter !== false) {
              closeModal();
            }
          } catch (err) {
            showError(err.message || "Ocurri\xF3 un error.");
          } finally {
            btnConfirm.disabled = false;
            btnConfirm.textContent = originalText;
          }
        } else {
          closeModal();
        }
      });
    },
  });

  // js/api.js
  async function getEntities(resource) {
    const cacheKey = "cpos_cache_" + resource;
    const localCache = localStorage.getItem(cacheKey);
    const fetchPromise = fetch(
      `${BASE_API}?resource=${resource}&_t=${Date.now()}`,
    )
      .then(async (res) => {
        if (!res.ok) throw new Error("Error HTTP " + res.status);
        const json = await res.json();
        if (!json.success) throw new Error(json.message);
        const freshData = json.data || [];
        localStorage.setItem(cacheKey, JSON.stringify(freshData));
        window.dispatchEvent(
          new CustomEvent("sync_" + resource, { detail: freshData }),
        );
        if (resource === "productos") {
          window.dispatchEvent(
            new CustomEvent("cambioCatalogo", { detail: freshData }),
          );
        }
        return freshData;
      })
      .catch((error) => {
        console.warn(
          "Aviso de red o hoja no encontrada para " +
            resource +
            ", usando local.",
        );
        let existingLocal = localStorage.getItem(cacheKey);
        if (!existingLocal) {
          localStorage.setItem(
            cacheKey,
            JSON.stringify(localDB[resource] || []),
          );
          return localDB[resource] || [];
        }
        return JSON.parse(existingLocal);
      });
    if (localCache) {
      fetchPromise.catch((e) => console.warn(e));
      return JSON.parse(localCache);
    }
    return await fetchPromise;
  }
  async function saveEntity(resource, dataObj, action = "upsert") {
    try {
      const cacheKey = "cpos_cache_" + resource;
      let localStr = localStorage.getItem(cacheKey);
      let dataArr = localStr ? JSON.parse(localStr) : localDB[resource] || [];
      if (action === "delete") {
        dataArr = dataArr.filter((x) => String(x.id) !== String(dataObj.id));
      } else {
        const idx = dataArr.findIndex(
          (x) => String(x.id) === String(dataObj.id),
        );
        if (idx > -1) dataArr[idx] = { ...dataArr[idx], ...dataObj };
        else dataArr.unshift(dataObj);
      }
      localStorage.setItem(cacheKey, JSON.stringify(dataArr));
      const payload = {
        resource,
        action: action === "delete" ? "delete" : "save",
        id: dataObj.id || "",
        data: dataObj,
      };
      const postData = {
        method: "POST",
        body: JSON.stringify(payload),
      };
      const res = await fetch(`${BASE_API}?resource=${resource}`, postData);
      if (!res.ok) throw new Error("HTTP POST " + res.status);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      return { ...json, data: json.data || dataObj };
    } catch (error) {
      console.warn(
        `Error de red al guardar '${resource}' en Sheets. El elemento fue guardado localmente (Offline): ${error}`,
      );
      return { success: true, localOnly: true, data: dataObj };
    }
  }
  async function deleteEntity(resource, id) {
    return saveEntity(resource, { id }, "delete");
  }
  var BASE_API, localDB;
  var init_api = __esm({
    "js/api.js"() {
      BASE_API =
        "https://script.google.com/macros/s/AKfycbwBqWV20EZVA9HEyMCYUwCo_vy9U2lH5byRYNg5vGI68rwp_raTbMA8f1l4aEFJ6rmI/exec";
      localDB = {
        productos: [],
        categorias: [],
        clientes: [],
        proveedores: [],
        ventas: [],
        compras: [],
        usuarios: [],
      };
    },
  });

  // js/modules/productos.js
  var productos_exports = {};
  __export(productos_exports, {
    init: () => init,
    openFormModal: () => openFormModal,
    render: () => render,
  });
  async function init(container) {
    containerElement = container;
    try {
      cacheData = await getEntities("productos");
      getEntities("categorias")
        .then((res) => (cacheCats = res))
        .catch(() => {});
      getEntities("proveedores")
        .then((res) => (cacheProv = res))
        .catch(() => {});
    } catch (e) {
      showToast("Error cargando productos", "error");
    }
  }
  function render() {
    let html = `
    <div style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
      <input type="text" id="search-productos" placeholder="Buscar por nombre o c\xF3digo..." style="padding: 10px; width: 300px; border: 1px solid var(--border-color); border-radius: var(--radius);">
      <button class="btn btn-primary" id="btn-new-producto"><i class="ph ph-plus"></i> Nuevo Producto</button>
    </div>
  `;
    html += `<table class="data-table" style="width: 100%; border-collapse: collapse; background: var(--bg-card); box-shadow: var(--shadow); border-radius: var(--radius); overflow: hidden;">
    <thead style="background: var(--primary-light); text-align: left;">
      <tr>
        <th style="padding: 12px; border-bottom: 2px solid var(--border-color);">C\xF3digo / Nombre</th>
        <th style="padding: 12px; border-bottom: 2px solid var(--border-color);">Categor\xEDa</th>
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
    document
      .getElementById("btn-new-producto")
      .addEventListener("click", () => openFormModal(null));
    document
      .getElementById("search-productos")
      .addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase();
        const filtered = cacheData.filter(
          (p) =>
            (p.nombre || "").toLowerCase().includes(term) ||
            (p.codigo || "").toLowerCase().includes(term),
        );
        renderTable(filtered);
      });
  }
  function renderTable(data) {
    const tbody = document.getElementById("tbl-productos-body");
    if (!tbody) return;
    if (data.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: var(--text-muted);">No hay productos registrados.</td></tr>`;
      return;
    }
    tbody.innerHTML = data
      .map(
        (p) => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px;"><strong>${escapeHtml(p.nombre)}</strong><br><small style="color: var(--text-muted);">${escapeHtml(p.codigo || p.id)}</small></td>
      <td style="padding: 12px;"><span style="background: var(--bg-color); padding: 4px 8px; border-radius: 12px; font-size: 12px;">${escapeHtml(p.categoria || "General")}</span></td>
      <td style="padding: 12px;">C$: ${p.costo || 0}<br>V$: ${p.precio || 0}</td>
      <td style="padding: 12px;">
        ${p.segimientoInventario === true || p.segimientoInventario === "TRUE" || p.segimientoInventario === "true" ? `<span style="color: ${p.stock <= 5 ? "var(--danger-color)" : "var(--primary-color)"}; font-weight: bold;">${p.stock || 0}</span>` : `<span style="color: var(--text-muted);">Sin seguimiento</span>`}
      </td>
      <td style="padding: 12px; text-align: right;">
        <button class="btn btn-secondary btn-sm" onclick="window.appEditProducto('${escapeHtml(p.id)}')" style="padding: 6px 10px; margin-right: 4px;"><i class="ph ph-pencil-simple"></i></button>
        <button class="btn btn-danger btn-sm" onclick="window.appDeleteProducto('${escapeHtml(p.id)}')" style="padding: 6px 10px;"><i class="ph ph-trash"></i></button>
      </td>
    </tr>
  `,
      )
      .join("");
  }
  function openFormModal(prod, onChangeCallback = null) {
    const isEditing = !!prod;
    const p = prod || {};
    const catOptions = cacheCats
      .map(
        (c) =>
          `<option value="${escapeHtml(c.nombre)}" ${c.nombre === p.categoria ? "selected" : ""}>${escapeHtml(c.nombre)}</option>`,
      )
      .join("");
    const provOptions = cacheProv
      .map(
        (pr) =>
          `<option value="${escapeHtml(pr.id)}" ${pr.id === p.proveedorId ? "selected" : ""}>${escapeHtml(pr.nombre)}</option>`,
      )
      .join("");
    const formHtml = `
    <input type="hidden" name="id" value="${p.id || ""}">
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
      <div>
        <label style="display:block; margin-bottom:4px; font-weight:600;">Nombre del Producto *</label>
        <input type="text" name="nombre" value="${escapeHtml(p.nombre)}" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
      </div>
      <div>
        <label style="display:block; margin-bottom:4px; font-weight:600;">C\xF3digo (Interno/Barras)</label>
        <input type="text" name="codigo" value="${escapeHtml(p.codigo)}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
      </div>
      <div>
        <label style="display:block; margin-bottom:4px; font-weight:600;">Categor\xEDa</label>
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
          <option value="unidad" ${p.unidadVenta === "unidad" ? "selected" : ""}>Por Unidad</option>
          <option value="medida" ${p.unidadVenta === "medida" ? "selected" : ""}>Por Medida (Peso/Longitud)</option>
        </select>
      </div>
      <div>
        <label style="display:block; margin-bottom:4px; font-weight:600;">Seguimiento de Inventario</label>
        <select name="segimientoInventario" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
          <option value="si" ${p.segimientoInventario === true || p.segimientoInventario === "si" ? "selected" : ""}>S\xED</option>
          <option value="no" ${p.segimientoInventario === false || p.segimientoInventario === "no" ? "selected" : ""}>No</option>
        </select>
      </div>
      <div>
        <label style="display:block; margin-bottom:4px; font-weight:600;">Costo ($)</label>
        <input type="number" name="costo" step="0.01" value="${p.costo || ""}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
      </div>
      <div>
        <label style="display:block; margin-bottom:4px; font-weight:600;">Precio Venta ($)</label>
        <input type="number" name="precio" step="0.01" value="${p.precio || ""}" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
      </div>
      <div>
        <label style="display:block; margin-bottom:4px; font-weight:600;">Stock Actual</label>
        <input type="number" name="stock" value="${p.stock || 0}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
      </div>

    </div>
  `;
    showFormModal(
      isEditing ? "Editar Producto" : "Nuevo Producto",
      formHtml,
      async (form) => {
        const currentData = getFormData(form);
        const isNew = !currentData.id;
        if (isNew) {
          currentData.id = "temp-" + Date.now();
          cacheData.push(currentData);
        } else {
          const idx = cacheData.findIndex(
            (x) => String(x.id) === String(currentData.id),
          );
          if (idx > -1) cacheData[idx] = { ...cacheData[idx], ...currentData };
        }
        renderTable(
          document.getElementById("search-productos")?.value
            ? cacheData.filter((x) =>
                x.nombre.includes(
                  document.getElementById("search-productos").value,
                ),
              )
            : cacheData,
        );
        showToast(
          isEditing
            ? "Actualizando (en segundo plano)..."
            : "Creando (en segundo plano)...",
        );
        window.dispatchEvent(
          new CustomEvent("cambioCatalogo", { detail: cacheData }),
        );
        if (isNew) delete currentData.id;
        saveEntity("productos", currentData)
          .then((result) => {
            const savedItem = result.data;
            if (isNew && savedItem?.id) {
              const tempIdx = cacheData.findIndex((x) =>
                String(x.id).startsWith("temp-"),
              );
              if (tempIdx > -1) cacheData[tempIdx] = savedItem;
            } else if (!isNew && savedItem) {
              const idx = cacheData.findIndex(
                (x) => String(x.id) === String(savedItem.id),
              );
              if (idx > -1) cacheData[idx] = savedItem;
            }
            renderTable(
              document.getElementById("search-productos")?.value
                ? cacheData.filter((x) =>
                    x.nombre.includes(
                      document.getElementById("search-productos").value,
                    ),
                  )
                : cacheData,
            );
            window.dispatchEvent(
              new CustomEvent("cambioCatalogo", { detail: cacheData }),
            );
            if (onChangeCallback && savedItem) onChangeCallback(savedItem);
          })
          .catch((err) => {
            showToast(
              "Error guardando en la Nube. Refresca la pesta\xF1a.",
              "error",
            );
          });
      },
    );
  }
  var containerElement, cacheData, cacheCats, cacheProv;
  var init_productos = __esm({
    "js/modules/productos.js"() {
      init_api();
      init_ui();
      cacheData = [];
      cacheCats = [];
      cacheProv = [];
      window.appEditProducto = (id) => {
        const prod = cacheData.find((p) => String(p.id) === String(id));
        if (prod) openFormModal(prod);
      };
      window.appDeleteProducto = (id) => {
        showConfirmModal(
          "Confirmar Eliminaci\xF3n",
          "<p>\xBFSeguro que deseas eliminar este producto? Esta acci\xF3n no se puede deshacer.</p>",
          async () => {
            cacheData = cacheData.filter((p) => String(p.id) !== String(id));
            renderTable(
              document.getElementById("search-productos")?.value
                ? cacheData.filter((x) =>
                    x.nombre.includes(
                      document.getElementById("search-productos").value,
                    ),
                  )
                : cacheData,
            );
            showToast("Eliminando (en segundo plano)...");
            window.dispatchEvent(
              new CustomEvent("cambioCatalogo", { detail: cacheData }),
            );
            deleteEntity("productos", id)
              .then(() => {
                showToast("Producto eliminado de Sheets", "success");
              })
              .catch(() =>
                showToast(
                  "Error borrando en la nube. Refresca la ventana.",
                  "error",
                ),
              );
          },
        );
      };
    },
  });

  // js/modules/ventas.js
  var ventas_exports = {};
  __export(ventas_exports, {
    init: () => init2,
    render: () => render2,
  });
  async function init2(container) {
    containerElement2 = container;
    try {
      catalog = await getEntities("productos");
      clients = await getEntities("clientes");
      const allSales = await getEntities("ventas");
      openSales = allSales.filter((s) => s.estado === "abierta");
    } catch (e) {}
  }
  function render2() {
    containerElement2.innerHTML = `
    <div style="display: flex; gap: 24px; height: calc(100vh - 120px);">
      <!-- Pane Izquierdo: Cat\xE1logo y Buscador -->
      <div style="flex: 2; display: flex; flex-direction: column; background: var(--bg-card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px; overflow-y: auto;">
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
           <h2 style="font-size: 18px; font-weight: 600;">Productos</h2>
           <button class="btn btn-secondary btn-sm" id="btn-load-open"><i class="ph ph-folder-open"></i> Ventas en Espera (${openSales.length})</button>
        </div>

        <input type="text" id="pos-search" placeholder="Buscar producto por nombre o c\xF3digo..." style="background: var(--input-bg); color: var(--text-dark); padding: 12px; width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius); margin-bottom: 20px; font-size: 16px;">
        
        <div id="pos-catalog-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; overflow-y: auto;">
           <!-- Se llena din\xE1micamente -->
        </div>
      </div>

      <!-- Pane Derecho: Carrito / Ticket -->
      <div style="flex: 1; min-width: 300px; display: flex; flex-direction: column; background: var(--bg-card); border-radius: var(--radius); box-shadow: var(--shadow);">
        <div style="padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between;">
           <h2 style="font-size: 18px; font-weight: 600;" id="cart-title">Ticket Actual</h2>
           <button class="btn btn-secondary btn-sm" onclick="window.posClearCart()"><i class="ph ph-trash"></i></button>
        </div>
        
        <div id="pos-cart-items" style="flex: 1; overflow-y: auto; padding: 20px;">
           <!-- Items del Carrito -->
        </div>

        <div style="padding: 20px; background: var(--primary-light); border-top: 1px solid var(--border-color);">
           <div style="display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 20px; font-weight: 700; color: var(--primary-color);">
             <span>TOTAL:</span>
             <span id="pos-total">$0.00</span>
           </div>
           <div style="display: flex; gap: 8px;">
             <button class="btn btn-secondary" style="flex:1" onclick="window.posHoldSale()"><i class="ph ph-pause"></i> Pausar</button>
             <button class="btn btn-primary" style="flex:2" onclick="window.posCheckout()"><i class="ph ph-check-square"></i> Cobrar</button>
           </div>
        </div>
      </div>
    </div>
  `;
    document.getElementById("pos-search").addEventListener("input", (e) => {
      renderCatalog(e.target.value.toLowerCase());
    });
    document
      .getElementById("btn-load-open")
      .addEventListener("click", showOpenSalesModal);
    renderCatalog();
    renderCart();
  }
  function renderCatalog(filter = "") {
    const grid = document.getElementById("pos-catalog-grid");
    const filtered = catalog.filter(
      (p) =>
        p.nombre.toLowerCase().includes(filter) ||
        (p.codigo && p.codigo.toLowerCase().includes(filter)),
    );
    if (!filtered.length) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">Sin resultados</div>`;
      return;
    }
    grid.innerHTML = filtered
      .map(
        (p) => `
    <div style="border: 1px solid var(--border-color); background: var(--bg-solid); border-radius: var(--radius); padding: 12px; text-align: center; position: relative; transition: all 0.3s ease; box-shadow: var(--shadow);" class="product-card" onmouseover="this.style.transform='translateY(-4px)'; this.style.borderColor='var(--primary-color)'" onmouseout="this.style.transform='none'; this.style.borderColor='var(--border-color)'">
      <button onclick="window.posEditProduct('${escapeHtml(p.id)}')" style="position: absolute; top: 8px; right: 8px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 4px; padding: 4px; cursor: pointer; color: var(--text-muted); transition: 0.2s;" onmouseover="this.style.color='var(--primary-color)'" onmouseout="this.style.color='var(--text-muted)'"><i class="ph ph-pencil-simple"></i></button>
      
      <div onclick="window.posAddToCart('${escapeHtml(p.id)}')" style="cursor:pointer; display: flex; flex-direction: column; justify-content: center; height: 100%;">
        <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: var(--text-dark); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; padding-top: 20px;">${escapeHtml(p.nombre)}</div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: auto;">
          <div style="color: var(--primary-color); font-weight: bold; font-size: 16px;">$${p.precio || 0}</div>
          <div style="font-size: 12px; color: var(--text-muted); background: var(--input-bg); padding: 2px 6px; border-radius: 4px;" title="Stock"><i class="ph ph-package"></i> ${p.segimientoInventario ? p.stock : "\u221E"}</div>
        </div>
      </div>
    </div>
  `,
      )
      .join("");
  }
  function renderCart() {
    const container = document.getElementById("pos-cart-items");
    const totalEl = document.getElementById("pos-total");
    const titleEl = document.getElementById("cart-title");
    titleEl.textContent = currentSaleId ? "Retomando Venta" : "Ticket Actual";
    if (!currentCart.length) {
      container.innerHTML = `<div style="text-align:center; color: var(--text-muted); margin-top: 40px;">Carrito vac\xEDo</div>`;
      totalEl.textContent = `$0.00`;
      return;
    }
    let total = 0;
    container.innerHTML = currentCart
      .map((item, idx) => {
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
      })
      .join("");
    totalEl.textContent = `$${total.toFixed(2)}`;
  }
  function showOpenSalesModal() {
    if (!openSales.length) return showToast("No hay ventas abiertas", "error");
    let html = `<ul style="list-style: none; padding: 0;">`;
    html += openSales
      .map(
        (v) => `
    <li style="padding: 12px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
      <div>
        <strong>Venta Abierta</strong> <br>
        <small style="color: var(--text-muted);">${new Date(v.fecha).toLocaleString()} - $${v.total}</small>
      </div>
      <button class="btn btn-primary btn-sm" onclick="window.posResumeSale('${escapeHtml(v.id)}')">Retomar</button>
    </li>
  `,
      )
      .join("");
    html += `</ul>`;
    showConfirmModal("Ventas en Espera", html, () => {});
  }
  var containerElement2,
    currentCart,
    openSales,
    catalog,
    clients,
    currentSaleId;
  var init_ventas = __esm({
    "js/modules/ventas.js"() {
      init_api();
      init_ui();
      init_productos();
      currentCart = [];
      openSales = [];
      catalog = [];
      clients = [];
      currentSaleId = null;
      window.addEventListener("cambioCatalogo", (e) => {
        catalog = e.detail;
        renderCatalog();
      });
      window.posAddToCart = (productId) => {
        const prod = catalog.find((p) => String(p.id) === String(productId));
        const existingIdx = currentCart.findIndex(
          (item) => String(item.id) === String(productId),
        );
        if (existingIdx > -1) {
          currentCart[existingIdx].cantidad++;
        } else {
          currentCart.push({
            id: prod.id,
            nombre: prod.nombre,
            precio: Number(prod.precio),
            costo: Number(prod.costo),
            cantidad: 1,
          });
        }
        renderCart();
        showToast("Producto agregado");
      };
      window.posUpdateQty = (idx, value) => {
        const v = parseInt(value);
        if (v < 1) return;
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
      window.posEditProduct = (productId) => {
        const prod = catalog.find((p) => String(p.id) === String(productId));
        openFormModal(prod, (updatedProd) => {
          const idx = catalog.findIndex((x) => x.id === updatedProd.id);
          if (idx > -1) catalog[idx] = updatedProd;
          const cartIdx = currentCart.findIndex((x) => x.id === updatedProd.id);
          if (cartIdx > -1) {
            currentCart[cartIdx].nombre = updatedProd.nombre;
            currentCart[cartIdx].precio = Number(updatedProd.precio);
            renderCart();
          }
          renderCatalog(document.getElementById("pos-search").value);
        });
      };
      window.posHoldSale = async () => {
        if (!currentCart.length)
          return showToast("El carrito est\xE1 vac\xEDo", "error");
        const total = currentCart.reduce(
          (acc, i) => acc + i.precio * i.cantidad,
          0,
        );
        const saleObj = {
          id: currentSaleId || "",
          fecha: /* @__PURE__ */ new Date().toISOString(),
          clienteId: "",
          metodoPago: "",
          estado: "abierta",
          total,
          itemsJSON: JSON.stringify(currentCart),
        };
        await saveEntity("ventas", saleObj);
        showToast("Venta guardada en espera");
        if (!currentSaleId) openSales.push(saleObj);
        else {
          const ix = openSales.findIndex((x) => x.id === currentSaleId);
          if (ix > -1) openSales[ix] = saleObj;
        }
        document.getElementById("btn-load-open").innerHTML =
          `<i class="ph ph-folder-open"></i> Ventas en Espera (${openSales.length})`;
        window.posClearCart();
      };
      window.posResumeSale = (saleId) => {
        const sale = openSales.find((s) => s.id === saleId);
        if (sale) {
          currentSaleId = sale.id;
          currentCart = JSON.parse(sale.itemsJSON);
          
          // Cerrar modal de ventas en espera de forma explícita
          const modalOverlay = document.getElementById("main-modal");
          if(modalOverlay) {
            modalOverlay.classList.remove("show");
          }
          
          // Renderizar el carrito actualizado después de cerrar la modal
          setTimeout(() => {
            renderCart();
            showToast("✓ Venta retomada correctamente");
          }, 300);
        }
      };
      window.posCheckout = () => {
        if (!currentCart.length)
          return showToast("El carrito est\xE1 vac\xEDo", "error");
        const total = currentCart.reduce(
          (acc, i) => acc + i.precio * i.cantidad,
          0,
        );
        const clientOptions = clients
          .map(
            (c) =>
              `<option value="${escapeHtml(c.id)}">${escapeHtml(c.nombre)}</option>`,
          )
          .join("");
        const formHtml = `
    <div style="margin-bottom: 15px; text-align: center;">
      <h3 style="font-size: 24px; color: var(--primary-color);">Total a pagar: $${total.toFixed(2)}</h3>
    </div>
    
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">M\xE9todo de Pago *</label>
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
            fecha: /* @__PURE__ */ new Date().toISOString(),
            clienteId: client,
            metodoPago: method,
            estado: "cerrada",
            total,
              itemsJSON: JSON.stringify(currentCart),
          };
          await saveEntity("ventas", saleObj);
          for (let item of currentCart) {
            const p = catalog.find((x) => x.id === item.id);
            if (
              p &&
              (p.segimientoInventario === true ||
                p.segimientoInventario === "si" ||
                p.segimientoInventario === "true")
            ) {
              p.stock = Number(p.stock || 0) - item.cantidad;
              await saveEntity("productos", p);
            }
          }
          if (currentSaleId) {
            openSales = openSales.filter((x) => x.id !== currentSaleId);
          }
          showToast("Venta Exitosa y Cerrada \u{1F973}");
          window.posClearCart();
          renderCatalog(document.getElementById("pos-search").value);
        });
      };
    },
  });

  // js/modules/compras.js
  var compras_exports = {};
  __export(compras_exports, {
    init: () => init3,
    render: () => render3,
  });
  async function init3(container) {
    containerElement3 = container;
    try {
      catalog2 = await getEntities("productos");
      providers = await getEntities("proveedores");
    } catch (e) {}
  }
  function render3() {
    containerElement3.innerHTML = `
    <div style="display: flex; gap: 24px; height: calc(100vh - 120px);">
      <!-- Pane Izquierdo: Cat\xE1logo y Buscador -->
      <div style="flex: 2; display: flex; flex-direction: column; background: var(--bg-card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px; overflow-y: auto;">
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
           <h2 style="font-size: 18px; font-weight: 600;">Productos para Comprar (Reabastecer)</h2>
           <button class="btn btn-secondary btn-sm" id="btn-new-producto-compra" style="white-space: nowrap;"><i class="ph ph-plus"></i> Crear Producto</button>
        </div>

        <input type="text" id="compra-search" placeholder="Buscar producto existente o crear nuevo..." style="padding: 12px; width: 100%; border: 1px solid var(--border-color); border-radius: var(--radius); margin-bottom: 20px; font-size: 16px;">
        
        <div id="compra-catalog-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 16px; overflow-y: auto;">
           <!-- Se llena din\xE1micamente -->
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
               ${providers.map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.nombre)}</option>`).join("")}
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
    document.getElementById("btn-new-producto-compra").addEventListener("click", () => openProductFormModal2());
    
    document.getElementById("compra-search").addEventListener("input", (e) => {
      renderCatalog2(e.target.value.toLowerCase());
    });
    renderCatalog2();
    renderCart2();
  }
  function renderCatalog2(filter = "") {
    const grid = document.getElementById("compra-catalog-grid");
    const filtered = catalog2.filter(
      (p) =>
        p.nombre.toLowerCase().includes(filter) ||
        (p.codigo && p.codigo.toLowerCase().includes(filter)),
    );
    if (!filtered.length) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: var(--text-muted);">Sin resultados. Ve a Productos para a\xF1adirlo primero.</div>`;
      return;
    }
    grid.innerHTML = filtered
      .map(
        (p) => `
    <div style="border: 1px solid var(--border-color); border-radius: var(--radius); padding: 12px; text-align: center;">
      <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">${escapeHtml(p.nombre)}</div>
      <div style="color: var(--text-muted); font-size: 12px;">Costo act: $${p.costo || 0}</div>
      <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">Stock: ${p.stock || 0}</div>
      <button class="btn btn-primary btn-sm" style="margin-top: 8px;" onclick="window.compraAddToCart('${escapeHtml(p.id)}')"><i class="ph ph-plus"></i> Agregar</button>
    </div>
  `,
      )
      .join("");
  }
  function renderCart2() {
    const container = document.getElementById("compra-cart-items");
    const totalEl = document.getElementById("compra-total");
    if (!currentPurchase.length) {
      container.innerHTML = `<div style="text-align:center; color: var(--text-muted); margin-top: 40px;">No has agregado productos a reabastecer</div>`;
      totalEl.textContent = `$0.00`;
      return;
    }
    let total = 0;
    container.innerHTML = currentPurchase
      .map((item, idx) => {
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
      })
      .join("");
    totalEl.textContent = `$${total.toFixed(2)}`;
  }
  var RESOURCE, containerElement3, currentPurchase, catalog2, providers;
  var init_compras = __esm({
    "js/modules/compras.js"() {
      init_api();
      init_ui();
      RESOURCE = "compras";
      currentPurchase = [];
      catalog2 = [];
      providers = [];
      window.compraAddToCart = (productId) => {
        const prod = catalog2.find((p) => String(p.id) === String(productId));
        if (!prod) return;
        const existingIdx = currentPurchase.findIndex(
          (item) => String(item.id) === String(productId),
        );
        if (existingIdx > -1) {
          currentPurchase[existingIdx].cantidad++;
        } else {
          currentPurchase.push({
            id: prod.id,
            nombre: prod.nombre,
            costoNuevo: Number(prod.costo || 0),
            cantidad: 1,
          });
        }
        renderCart2();
        showToast("Producto a\xF1adido a la orden");
      };
      window.compraUpdateQty = (idx, value) => {
        const v = parseInt(value);
        if (v < 1) return;
        currentPurchase[idx].cantidad = v;
        renderCart2();
      };
      window.compraUpdateCosto = (idx, value) => {
        const v = parseFloat(value);
        if (v < 0) return;
        currentPurchase[idx].costoNuevo = v;
        renderCart2();
      };
      window.compraRemoveFromCart = (idx) => {
        currentPurchase.splice(idx, 1);
        renderCart2();
      };
      window.compraCheckout = () => {
        const providerId = document.getElementById("compra-proveedor").value;
        if (!providerId)
          return showToast("Debes seleccionar un proveedor", "error");
        if (!currentPurchase.length)
          return showToast("La orden est\xE1 vac\xEDa", "error");
        const total = currentPurchase.reduce(
          (acc, i) => acc + i.costoNuevo * i.cantidad,
          0,
        );
        const formHtml = `
    <div style="margin-bottom: 15px; text-align: center;">
      <h3 style="font-size: 24px; color: var(--primary-color);">Costo Total: $${total.toFixed(2)}</h3>
    </div>
    
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">M\xE9todo de Pago (Compra) *</label>
      <select name="metodoPago" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
        <option value="Efectivo">Efectivo</option>
        <option value="Nequi">Credito / Nequi</option>
        <option value="En Consignacion">En Consignaci\xF3n</option>
      </select>
    </div>
  `;
        showFormModal(
          "Confirmar Registro de Compra",
          formHtml,
          async (form) => {
            const fd = getFormData(form);
            const provider = providers.find(p => p.id === providerId);
            const providerName = provider ? provider.nombre : providerId;
            const compraObj = {
              id: "",
              fecha: new Date().toISOString(),
              proveedor: providerName,
              metodoPago: fd.metodoPago,
              total: total,
              itemsJSON: JSON.stringify(currentPurchase)
            };
            await saveEntity(RESOURCE, compraObj);
            for (let item of currentPurchase) {
              const p = catalog2.find((x) => x.id === item.id);
              if (p) {
                p.costo = item.costoNuevo;
                if (
                  p.segimientoInventario === true ||
                  p.segimientoInventario === "si" ||
                  p.segimientoInventario === "true"
                ) {
                  p.stock = Number(p.stock || 0) + item.cantidad;
                }
                await saveEntity("productos", p);
              }
            }
            showToast("Compra Registrada Correctamente \u{1F4E6}");
            currentPurchase = [];
            renderCart2();
            renderCatalog2(document.getElementById("compra-search").value);
          },
        );
      };
      
      // NUEVA FUNCIÓN: Crear Producto desde Compras
      function openProductFormModal2() {
        const formHtml = `
          <div style="margin-bottom: 15px;">
            <label style="display:block; margin-bottom:4px; font-weight:600;">Nombre del Producto *</label>
            <input type="text" name="nombre" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display:block; margin-bottom:4px; font-weight:600;">Código (SKU)</label>
            <input type="text" name="codigo" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display:block; margin-bottom:4px; font-weight:600;">Costo de Compra $</label>
            <input type="number" step="0.01" min="0" name="costo" value="0" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display:block; margin-bottom:4px; font-weight:600;">Precio de Venta $</label>
            <input type="number" step="0.01" min="0" name="precio" value="0" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display:block; margin-bottom:4px; font-weight:600;">Stock Inicial</label>
            <input type="number" min="0" name="stock" value="0" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
          </div>
        `;

        showFormModal("Crear Producto Nuevo", formHtml, async (form) => {
          const fd = getFormData(form);
          
          // Generar ID temporal único
          const tempId = "temp-" + Date.now() + "-" + Math.floor(Math.random() * 10000);
          
          const newProduct = {
            id: tempId,
            nombre: fd.nombre,
            codigo: fd.codigo || "",
            costo: Number(fd.costo) || 0,
            precio: Number(fd.precio) || 0,
            stock: Number(fd.stock) || 0,
            categoria: "Sin categoría",
            segimientoInventario: false
          };

          // Agregar al catálogo local para poder comprarlo inmediatamente
          catalog2.push(newProduct);
          showToast("Producto creado y listo para comprar ✓");

          // Guardar en background
          saveEntity("productos", newProduct).then(result => {
            const savedProduct = result.data || newProduct;
            if(savedProduct?.id && savedProduct.id !== tempId) {
              // Actualizar el ID temporal con el ID real del servidor
              const idx = catalog2.findIndex(p => p.id === tempId);
              if(idx > -1) {
                catalog2[idx] = savedProduct;
              }
            }
          }).catch(err => {
            console.error("Error guardando producto:", err);
          });

          // Renderizar de nuevo para mostrar el nuevo producto
          renderCatalog2(document.getElementById("compra-search").value);
          return true;
        });
      }
    },
  });

  // js/modules/historial.js
  var historial_exports = {};
  __export(historial_exports, {
    init: () => init4,
    render: () => render4,
  });
  async function init4(container) {
    containerElement4 = container;
  }
  async function render4() {
    containerElement4.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px;">Cargando historial...</div>`;
    try {
      cacheData2 = await getEntities("ventas");
      const closedSales = cacheData2
        .filter(
          (s) =>
            s.estado === "cerrada" ||
            s.estado === "anulada" ||
            s.estado === "reembolsada",
        )
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      if (!closedSales.length) {
        containerElement4.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px;"><i class="ph ph-receipt" style="font-size:48px; margin-bottom:12px;"></i><br>No hay ventas registradas</div>`;
        return;
      }
      containerElement4.innerHTML =
        `
      <div style="background: var(--bg-card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px;">
        <h2 style="margin-bottom: 20px; font-weight: 600; color: var(--primary-color);">Historial de Ventas</h2>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
             <thead style="background: var(--primary-light); text-align: left;">
               <tr>
                 <th style="padding: 12px; border-bottom: 2px solid var(--border-color);">ID Venta</th>
                 <th style="padding: 12px; border-bottom: 2px solid var(--border-color);">Fecha</th>
                 <th style="padding: 12px; border-bottom: 2px solid var(--border-color);">M\xE9todo Pago</th>
                 <th style="padding: 12px; border-bottom: 2px solid var(--border-color); text-align: right;">Total</th>
                 <th style="padding: 12px; border-bottom: 2px solid var(--border-color); text-align: center;">Ticket / Acciones</th>
               </tr>
             </thead>
             <tbody>
               ` +
        closedSales
          .map(
            (v) =>
              `
                 <tr style="border-bottom: 1px solid var(--border-color); ` +
              (v.estado === "anulada" ? "opacity:0.5;" : "") +
              `">
                   <td style="padding: 12px; font-family: monospace; color: var(--text-muted);">` +
              escapeHtml(v.id) +
              `</td>
                   <td style="padding: 12px;">` +
              new Date(v.fecha).toLocaleString() +
              `</td>
                   <td style="padding: 12px;">
                     <span style="background: var(--bg-solid); padding: 4px 8px; border-radius: 12px; font-size: 12px;">` +
              escapeHtml(v.metodoPago) +
              `</span>
                     <br><small style="font-weight: bold; color: ` +
              (v.estado === "cerrada"
                ? "var(--primary-color)"
                : "var(--danger-color)") +
              `;">` +
              v.estado.toUpperCase() +
              `</small>
                   </td>
                   <td style="padding: 12px; text-align: right; font-weight: 600; color: var(--primary-color);">$` +
              Number(v.total).toFixed(2) +
              `</td>
                   <td style="padding: 12px; text-align: center; display: flex; gap: 8px; justify-content: center;">
                     <button class="btn btn-secondary btn-sm" onclick="window.posViewFactura('` +
              escapeHtml(v.id) +
              `')"><i class="ph ph-receipt"></i> Ver Factura</button>
                     ` +
              (v.estado === "cerrada"
                ? `<button class="btn btn-danger btn-sm" onclick="window.posVoidVenta('` +
                  escapeHtml(v.id) +
                  `')"><i class="ph ph-x-circle"></i> Anular</button>`
                : "") +
              `
                   </td>
                 </tr>
               `,
          )
          .join("") +
        `
             </tbody>
          </table>
        </div>
      </div>
    `;
    } catch (e) {
      containerElement4.innerHTML = `<div style="text-align: center; color: var(--danger-color); padding: 40px;">Error al cargar el historial</div>`;
    }
  }
  var containerElement4, cacheData2;
  var init_historial = __esm({
    "js/modules/historial.js"() {
      init_api();
      init_ui();
      cacheData2 = [];
      window.posViewFactura = (id) => {
        const v = cacheData2.find((x) => String(x.id) === String(id));
        if (!v) return;
        let itemsHtml = "";
        try {
          const items = JSON.parse(v.itemsJson);
          itemsHtml = items
            .map(
              (i) =>
                '<div style="display:flex; justify-content:space-between; margin-bottom:4px;"><span>' +
                i.cantidad +
                "x " +
                i.nombre +
                "</span><span>$" +
                (i.precio * i.cantidad).toFixed(2) +
                "</span></div>",
            )
            .join("");
        } catch (e) {}
        const html =
          `
    <div class="ticket-realistic">
      <h3 style="text-align: center; margin-bottom: 2px;">PAPEL & LUNA</h3>
      <p style="text-align: center; font-size: 12px; margin-bottom: 20px; color: #555;">Documento Tributario Equivalente<br>Ticket N\xB0 ` +
          v.id +
          `</p>
      
      <div style="font-size: 14px; margin-bottom: 15px;">
        <div style="display:flex; justify-content:space-between;"><span>Fecha:</span><span>` +
          new Date(v.fecha).toLocaleString() +
          `</span></div>
        <div style="display:flex; justify-content:space-between;"><span>Pago:</span><span>` +
          v.metodoPago +
          `</span></div>
        <div style="display:flex; justify-content:space-between;"><span>Estado:</span><span style="` +
          (v.estado === "anulada" ? "color:red;" : "") +
          `">` +
          v.estado.toUpperCase() +
          `</span></div>
      </div>

      <div style="border-top: 1px dashed var(--ticket-border); border-bottom: 1px dashed var(--ticket-border); padding: 15px 0; margin-bottom: 15px; font-size: 14px;">
        <div style="display:flex; justify-content:space-between; font-weight: bold; margin-bottom: 8px;"><span>Cant Desc</span><span>Monto</span></div>
        ` +
          itemsHtml +
          `
      </div>
      
      <div style="display:flex; justify-content:space-between; font-size: 18px; font-weight: bold;">
        <span>TOTAL:</span><span>$` +
          Number(v.total).toFixed(2) +
          `</span>
      </div>
      <p style="text-align: center; font-size: 12px; margin-top: 20px; color: #777;">Gracias por su compra</p>
    </div>
  `;
        showConfirmModal("Detalle de Venta", html, () => {});
      };
      window.posVoidVenta = (id) => {
        showConfirmModal(
          "Anular Venta",
          "<b>Atenci\xF3n:</b> Anular\xE1s esta venta y el inventario de los productos se contemplar\xE1 en el pr\xF3ximo refactor (RF-70 a RF-73).<br><br>\xBFEst\xE1s completamente seguro?",
          async () => {
            const v = cacheData2.find((x) => String(x.id) === String(id));
            if (!v) return;
            v.estado = "anulada";
            render4();
            showToast("Anulando Venta en Sheets...");
            await saveEntity("ventas", v);
            showToast("Venta Anulada", "success");
          },
        );
      };
    },
  });

  // js/modules/clientes.js
  var clientes_exports = {};
  __export(clientes_exports, {
    init: () => init5,
    render: () => render5,
  });
  async function init5(container) {
    try {
      cacheData3 = await getEntities(RESOURCE2);
    } catch (e) {}
  }
  function render5() {
    document.getElementById(`view-${RESOURCE2}`).innerHTML = `
    <div style="margin-bottom: 20px;">
      <button class="btn btn-primary" id="btn-new-${RESOURCE2}"><i class="ph ph-plus"></i> Nuevo Cliente</button>
    </div>
    <table style="width: 100%; border-collapse: collapse; background: var(--bg-card); border-radius: var(--radius); overflow: hidden;">
      <thead style="background: var(--primary-light); text-align: left;">
        <tr><th style="padding: 12px;">Nombre</th><th style="padding: 12px;">Tel\xE9fono</th><th style="padding: 12px;">Correo</th><th style="padding: 12px; text-align: right;">Acciones</th></tr>
      </thead>
      <tbody id="tbl-${RESOURCE2}-body"></tbody>
    </table>
  `;
    renderTable2(cacheData3);
    document
      .getElementById(`btn-new-${RESOURCE2}`)
      .addEventListener("click", () => openFormModal2());
  }
  function renderTable2(data) {
    const tbody = document.getElementById(`tbl-${RESOURCE2}-body`);
    if (!data.length)
      return (tbody.innerHTML = `<tr><td colspan="4" style="padding: 20px; text-align:center;">No hay clientes</td></tr>`);
    tbody.innerHTML = data
      .map(
        (i) => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px;"><strong>${escapeHtml(i.nombre)}</strong></td>
      <td style="padding: 12px;">${escapeHtml(i.teléfono || i.telefono)}</td>
      <td style="padding: 12px;">${escapeHtml(i.correo)}</td>
      <td style="padding: 12px; text-align: right;">
        <button class="btn btn-secondary btn-sm" onclick="window.appEditCliente('${escapeHtml(i.id)}')" style="padding: 6px 10px;"><i class="ph ph-pencil-simple"></i></button>
        <button class="btn btn-danger btn-sm" onclick="window.appDeleteCliente('${escapeHtml(i.id)}')" style="padding: 6px 10px;"><i class="ph ph-trash"></i></button>
      </td>
    </tr>
  `,
      )
      .join("");
  }
  function openFormModal2(item) {
    const i = item || {};
    const formHtml = `
    <input type="hidden" name="id" value="${i.id || ""}">
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">Teléfono</label>
      <input type="text" name="teléfono" value="${escapeHtml(i.teléfono || i.telefono)}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">Correo Electrónico</label>
      <input type="email" name="correo" value="${escapeHtml(i.correo)}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">Correo Electr\xF3nico</label>
      <input type="email" name="correo" value="${escapeHtml(i.correo)}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
    </div>
  `;
    showFormModal(
      i.id ? "Editar Cliente" : "Nuevo Cliente",
      formHtml,
      async (form) => {
        const fd = getFormData(form);
        if (!fd.id) delete fd.id;
        const result = await saveEntity(RESOURCE2, fd);
        showToast(i.id ? "Actualizado" : "Creado");
        const savedItem = result.data;
        if (i.id && savedItem?.id) {
          cacheData3[cacheData3.findIndex((x) => x.id === savedItem.id)] =
            savedItem;
        } else if (savedItem) {
          cacheData3.push(savedItem);
        } else {
          cacheData3 = await getEntities(RESOURCE2);
        }
        renderTable2(cacheData3);
      },
    );
  }
  var RESOURCE2, cacheData3;
  var init_clientes = __esm({
    "js/modules/clientes.js"() {
      init_api();
      init_ui();
      RESOURCE2 = "clientes";
      cacheData3 = [];
      window.appEditCliente = (id) =>
        openFormModal2(cacheData3.find((x) => String(x.id) === String(id)));
      window.appDeleteCliente = (id) => {
        showConfirmModal("Eliminar Cliente", "<p>\xBFSeguro?</p>", async () => {
          await deleteEntity(RESOURCE2, id);
          showToast("Eliminado");
          cacheData3 = cacheData3.filter((x) => String(x.id) !== String(id));
          renderTable2(cacheData3);
        });
      };
    },
  });

  // js/modules/proveedores.js
  var proveedores_exports = {};
  __export(proveedores_exports, {
    init: () => init6,
    render: () => render6,
  });
  async function init6(container) {
    try {
      cacheData4 = await getEntities(RESOURCE3);
    } catch (e) {}
  }
  function render6() {
    document.getElementById(`view-${RESOURCE3}`).innerHTML = `
    <div style="margin-bottom: 20px;">
      <button class="btn btn-primary" id="btn-new-${RESOURCE3}"><i class="ph ph-plus"></i> Nuevo Proveedor</button>
    </div>
    <table style="width: 100%; border-collapse: collapse; background: var(--bg-card); border-radius: var(--radius); overflow: hidden;">
      <thead style="background: var(--primary-light); text-align: left;">
          <tr><th style="padding: 12px;">Empresa/Nombre</th><th style="padding: 12px;">Teléfono</th><th style="padding: 12px;">Correo</th><th style="padding: 12px; text-align: right;">Acciones</th></tr>
      </thead>
      <tbody id="tbl-${RESOURCE3}-body"></tbody>
    </table>
  `;
    renderTable3(cacheData4);
    document
      .getElementById(`btn-new-${RESOURCE3}`)
      .addEventListener("click", () => openFormModal3());
  }
  function renderTable3(data) {
    const tbody = document.getElementById(`tbl-${RESOURCE3}-body`);
    if (!data.length)
      return (tbody.innerHTML = `<tr><td colspan="4" style="padding: 20px; text-align:center;">No hay proveedores</td></tr>`);
    tbody.innerHTML = data
      .map(
        (i) => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px;"><strong>${escapeHtml(i.nombre)}</strong></td>
      <td style="padding: 12px;">${escapeHtml(i.teléfono || i.telefono)}</td>
      <td style="padding: 12px;">${escapeHtml(i.correo)}</td>
      <td style="padding: 12px; text-align: right;">
        <button class="btn btn-secondary btn-sm" onclick="window.appEditProveedor('${escapeHtml(i.id)}')" style="padding: 6px 10px;"><i class="ph ph-pencil-simple"></i></button>
        <button class="btn btn-danger btn-sm" onclick="window.appDeleteProveedor('${escapeHtml(i.id)}')" style="padding: 6px 10px;"><i class="ph ph-trash"></i></button>
      </td>
    </tr>
  `,
      )
      .join("");
  }
  function openFormModal3(item) {
    const i = item || {};
    const formHtml = `
    <input type="hidden" name="id" value="${i.id || ""}">
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">Nombre de la Empresa *</label>
      <input type="text" name="nombre" value="${escapeHtml(i.nombre)}" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">Teléfono</label>
      <input type="text" name="teléfono" value="${escapeHtml(i.teléfono || i.telefono)}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">Correo Electrónico</label>
      <input type="email" name="correo" value="${escapeHtml(i.correo)}" style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
    </div>
  `;
    showFormModal(
      i.id ? "Editar Proveedor" : "Nuevo Proveedor",
      formHtml,
      async (form) => {
        const fd = getFormData(form);
        if (!fd.id) delete fd.id;
        const result = await saveEntity(RESOURCE3, fd);
        showToast(i.id ? "Actualizado" : "Creado");
        const savedItem = result.data || fd;
        if (!savedItem.id) {
          savedItem.id = fd.id || Date.now().toString();
        }
        if (i.id) {
          const index = cacheData4.findIndex(
            (x) => String(x.id) === String(savedItem.id),
          );
          if (index > -1)
            cacheData4[index] = { ...cacheData4[index], ...savedItem };
          else cacheData4.unshift(savedItem);
        } else {
          cacheData4.unshift(savedItem);
        }
        renderTable3(cacheData4);
      },
    );
  }
  var RESOURCE3, cacheData4;
  var init_proveedores = __esm({
    "js/modules/proveedores.js"() {
      init_api();
      init_ui();
      RESOURCE3 = "proveedores";
      cacheData4 = [];
      window.appEditProveedor = (id) =>
        openFormModal3(cacheData4.find((x) => String(x.id) === String(id)));
      window.appDeleteProveedor = (id) => {
        showConfirmModal(
          "Eliminar Proveedor",
          "<p>\xBFSeguro?</p>",
          async () => {
            await deleteEntity(RESOURCE3, id);
            showToast("Eliminado");
            cacheData4 = cacheData4.filter((x) => String(x.id) !== String(id));
            renderTable3(cacheData4);
          },
        );
      };
    },
  });

  // js/modules/categorias.js
  var categorias_exports = {};
  __export(categorias_exports, {
    init: () => init7,
    render: () => render7,
  });
  async function init7(container) {
    containerElement5 = container;
    try {
      cacheData5 = await getEntities(RESOURCE4);
    } catch (e) {}
  }
  function render7() {
    containerElement5.innerHTML = `
    <div style="margin-bottom: 20px;">
      <button class="btn btn-primary" id="btn-new-${RESOURCE4}"><i class="ph ph-plus"></i> Nueva Categor\xEDa</button>
    </div>
    <table style="width: 100%; border-collapse: collapse; background: var(--bg-card); border-radius: var(--radius); overflow: hidden;">
      <thead style="background: var(--primary-light); text-align: left;">
        <tr><th style="padding: 12px;">ID</th><th style="padding: 12px;">Nombre</th><th style="padding: 12px; text-align: right;">Acciones</th></tr>
      </thead>
      <tbody id="tbl-${RESOURCE4}-body"></tbody>
    </table>
  `;
    renderTable4(cacheData5);
    document
      .getElementById(`btn-new-${RESOURCE4}`)
      .addEventListener("click", () => openFormModal4());
  }
  function renderTable4(data) {
    const tbody = document.getElementById(`tbl-${RESOURCE4}-body`);
    if (!data.length)
      return (tbody.innerHTML = `<tr><td colspan="3" style="padding: 20px; text-align:center;">No hay categor\xEDas</td></tr>`);
    tbody.innerHTML = data
      .map(
        (i) => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px;">${escapeHtml(i.id)}</td>
      <td style="padding: 12px;"><strong>${escapeHtml(i.nombre)}</strong></td>
      <td style="padding: 12px; text-align: right;">
        <button class="btn btn-secondary btn-sm" onclick="window.appEditCategoria('${escapeHtml(i.id)}')" style="padding: 6px 10px;"><i class="ph ph-pencil-simple"></i></button>
        <button class="btn btn-danger btn-sm" onclick="window.appDeleteCategoria('${escapeHtml(i.id)}')" style="padding: 6px 10px;"><i class="ph ph-trash"></i></button>
      </td>
    </tr>
  `,
      )
      .join("");
  }
  function openFormModal4(item) {
    const i = item || {};
    const formHtml = `
    <input type="hidden" name="id" value="${i.id || ""}">
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600;">Nombre de la Categor\xEDa *</label>
      <input type="text" name="nombre" value="${escapeHtml(i.nombre)}" required style="width:100%; padding:8px; border:1px solid var(--border-color); border-radius:4px;">
    </div>
  `;
    showFormModal(
      i.id ? "Editar Categor\xEDa" : "Nueva Categor\xEDa",
      formHtml,
      async (form) => {
        const fd = getFormData(form);
        const isNew = !fd.id;
        
        // Generar ID temporal ÚNICO con mayor precisión
        let tempId = null;
        if(isNew) {
          tempId = "temp-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
          fd.id = tempId;
          cacheData5.push(fd);
        } else {
          const idx = cacheData5.findIndex(x => String(x.id) === String(fd.id));
          if(idx > -1) cacheData5[idx] = { ...cacheData5[idx], ...fd };
        }
        renderTable4(cacheData5);
        showToast(isNew ? "Creando (en segundo plano)..." : "Actualizando (en segundo plano)...");
        
        // Guardar el tempId antes de borrarlo
        const tempIdToFind = tempId;
        if(isNew) delete fd.id; // Quitar ID temporal antes de enviar a Sheets
        
        // Guardar silenciosamente
        saveEntity(RESOURCE4, fd).then(result => {
          const savedItem = result.data || fd;
          if(isNew) {
            // Buscar por el ID temporal EXACTO que creamos
            const tempIdx = cacheData5.findIndex(x => String(x.id) === String(tempIdToFind));
            if(tempIdx > -1 && savedItem?.id) {
              // Reemplazar solo el elemento con ese ID temporal específico
              cacheData5[tempIdx] = { ...savedItem };
            } else if(tempIdx > -1 && !savedItem.id) {
              cacheData5[tempIdx].id = "ID-" + Date.now() + "-" + Math.floor(Math.random() * 1000000);
            }
          } else if(savedItem?.id) {
            const idx = cacheData5.findIndex(x => String(x.id) === String(savedItem.id));
            if(idx > -1) cacheData5[idx] = savedItem;
          }
          renderTable4(cacheData5);
        }).catch(() => {
          showToast("Error guardando. Refresca la pestaña.", "error");
          cacheData5 = cacheData5.filter(x => !String(x.id).startsWith("temp-"));
          renderTable4(cacheData5);
        });
      },
    );
  }
  var containerElement5, cacheData5, RESOURCE4;
  var init_categorias = __esm({
    "js/modules/categorias.js"() {
      init_api();
      init_ui();
      cacheData5 = [];
      RESOURCE4 = "categorias";
      window.appEditCategoria = (id) =>
        openFormModal4(cacheData5.find((x) => String(x.id) === String(id)));
      window.appDeleteCategoria = (id) => {
        showConfirmModal(
          "Eliminar Categor\xEDa",
          "<p>\xBFSeguro?</p>",
          async () => {
            await deleteEntity(RESOURCE4, id);
            showToast("Eliminado");
            cacheData5 = cacheData5.filter((x) => String(x.id) !== String(id));
            renderTable4(cacheData5);
          },
        );
      };
    },
  });

  // js/modules/usuarios.js
  var usuarios_exports = {};
  __export(usuarios_exports, {
    init: () => init8,
    render: () => render8,
  });
  async function init8(container) {
    containerElement6 = container;
  }
  async function render8() {
    if (mode === "form") {
      renderForm();
      return;
    }
    containerElement6.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 40px;">Cargando usuarios...</div>`;
    try {
      try {
        cacheData6 = await getEntities("usuarios");
      } catch (err) {
        cacheData6 = [];
        console.warn("Sheet usuarios not found. Falling back to local.");
      }
      if (cacheData6.length === 0) {
        const defaultAdmin = {
          id: 1,
          username: "admin",
          role: "admin",
          password: "admin",
        };
        cacheData6.push(defaultAdmin);
        saveEntity("usuarios", defaultAdmin).catch(() => {});
      }
      containerElement6.innerHTML =
        `
      <div style="background: var(--bg-card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
          <h2 style="font-weight: 600; color: var(--primary-color);">Gesti\xF3n de Usuarios</h2>
          <button class="btn btn-primary" onclick="window.posNewUsuario()"><i class="ph ph-plus"></i> Nuevo Usuario</button>
        </div>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse;">
             <thead style="background: var(--primary-light); text-align: left;">
               <tr>
                 <th style="padding: 12px; border-bottom: 2px solid var(--border-color);">Usuario</th>
                 <th style="padding: 12px; border-bottom: 2px solid var(--border-color);">Rol</th>
                 <th style="padding: 12px; border-bottom: 2px solid var(--border-color); text-align: right;">Acciones</th>
               </tr>
             </thead>
             <tbody>
               ` +
        cacheData6
          .map(
            (u) =>
              `
                 <tr style="border-bottom: 1px solid var(--border-color);">
                   <td style="padding: 12px; font-weight: 500;">` +
              u.username +
              `</td>
                   <td style="padding: 12px;"><span style="background: var(--bg-solid); padding: 4px 8px; border-radius: 12px; font-size: 12px; text-transform: uppercase;">` +
              u.role +
              `</span></td>
                   <td style="padding: 12px; text-align: right; display: flex; gap: 8px; justify-content: flex-end;">
                     <button class="btn btn-secondary btn-sm" onclick="window.posEditUsuario('` +
              u.id +
              `')"><i class="ph ph-pencil-simple"></i> Editar</button>
                     <button class="btn btn-danger btn-sm" onclick="window.posDeleteUsuario('` +
              u.id +
              `')"><i class="ph ph-trash"></i></button>
                   </td>
                 </tr>
               `,
          )
          .join("") +
        `
             </tbody>
          </table>
        </div>
      </div>
    `;
    } catch (e) {
      containerElement6.innerHTML = `<div style="text-align: center; color: var(--danger-color); padding: 40px;">Error al cargar usuarios</div>`;
    }
  }
  function renderForm() {
    const isEdit = currentId !== null;
    const user = isEdit
      ? cacheData6.find((u) => String(u.id) === String(currentId))
      : { username: "", password: "", role: "cajero" };
    containerElement6.innerHTML =
      `
    <div style="background: var(--bg-card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 20px; max-width: 500px; margin: 0 auto;">
      <h2 style="margin-bottom: 20px; font-weight: 600; color: var(--primary-color);">` +
      (isEdit ? "Editar Usuario" : "Nuevo Usuario") +
      `</h2>
      <div class="form-group" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Nombre de Usuario</label>
        <input type="text" id="usr-name" class="input" style="width: 100%; box-sizing: border-box;" value="` +
      (user.username || "") +
      `">
      </div>
      <div class="form-group" style="margin-bottom: 15px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Contrase\xF1a ` +
      (isEdit ? "(dejar en blanco para no cambiar)" : "") +
      `</label>
        <input type="password" id="usr-pass" class="input" style="width: 100%; box-sizing: border-box;">
      </div>
      <div class="form-group" style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px; font-weight: 500;">Rol</label>
        <select id="usr-role" class="input" style="width: 100%; box-sizing: border-box;">
          <option value="cajero" ` +
      (user.role === "cajero" ? "selected" : "") +
      `>Cajero</option>
          <option value="admin" ` +
      (user.role === "admin" ? "selected" : "") +
      `>Administrador</option>
        </select>
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button class="btn btn-secondary" onclick="window.posCancelUsuario()"><i class="ph ph-x"></i> Cancelar</button>
        <button class="btn btn-primary" onclick="window.posSaveUsuario()"><i class="ph ph-floppy-disk"></i> Guardar</button>
      </div>
    </div>
  `;
  }
  var containerElement6, cacheData6, mode, currentId;
  var init_usuarios = __esm({
    "js/modules/usuarios.js"() {
      init_api();
      init_ui();
      cacheData6 = [];
      mode = "table";
      currentId = null;
      window.posNewUsuario = () => {
        mode = "form";
        currentId = null;
        render8();
      };
      window.posEditUsuario = (id) => {
        mode = "form";
        currentId = id;
        render8();
      };
      window.posCancelUsuario = () => {
        mode = "table";
        render8();
      };
      window.posDeleteUsuario = (id) => {
        showConfirmModal(
          "Eliminar Usuario",
          "\xBFEst\xE1s seguro de eliminar este usuario? No podr\xE1 entrar logearse m\xE1s.",
          async () => {
            cacheData6 = cacheData6.filter((x) => String(x.id) !== String(id));
            render8();
            showToast("Eliminando Usuario...");
            await deleteEntity("usuarios", id);
            showToast("Usuario eliminado", "success");
          },
        );
      };
      window.posSaveUsuario = async () => {
        const username = document.getElementById("usr-name").value.trim();
        const pass = document.getElementById("usr-pass").value;
        const role = document.getElementById("usr-role").value;
        if (!username) return showToast("Falta nombre de usuario", "warning");
        if (!currentId && !pass)
          return showToast(
            "Agrega una contrase\xF1a para el nuevo usuario",
            "warning",
          );
        const isEdit = currentId !== null;
        let oldUser = isEdit
          ? cacheData6.find((u) => String(u.id) === String(currentId))
          : null;
        const newUser = {
          id: isEdit ? oldUser.id : /* @__PURE__ */ new Date().getTime(),
          username,
          role,
        };
        if (pass) {
          newUser.password = pass;
        } else if (isEdit) {
          newUser.password = oldUser.password;
        }
        if (isEdit) {
          Object.assign(oldUser, newUser);
        } else {
          cacheData6.push(newUser);
        }
        mode = "table";
        render8();
        showToast("Guardando usuario...");
        try {
          await saveEntity("usuarios", newUser);
          showToast("Usuario guardado con \xE9xito", "success");
          cacheData6 = await getEntities("usuarios");
        } catch (e) {
          showToast("Error guardando el usuario", "error");
        }
      };
    },
  });

  // js/modules/descuentos.js
  var descuentos_exports = {};
  __export(descuentos_exports, {
    init: () => init9,
    render: () => render9,
  });
  async function init9(container) {
    containerElement7 = container;
    try {
      cacheData7 = await getEntities(RESOURCE5);
    } catch (e) {}
  }
  function render9() {
    containerElement7.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
      <h2 style="color: var(--primary-color);"><i class="ph ph-percent"></i> Gesti\xF3n de Descuentos</h2>
      <button class="btn btn-primary" id="btn-new-${RESOURCE5}"><i class="ph ph-plus"></i> Nuevo Descuento</button>
    </div>
    <div class="table-responsive">
      <table style="width: 100%; border-collapse: collapse; background: var(--bg-card); border-radius: var(--radius); overflow: hidden;">
        <thead style="background: var(--primary-light); text-align: left;">
          <tr>
            <th style="padding: 12px; white-space: nowrap;">ID</th>
            <th style="padding: 12px; white-space: nowrap;">Campa\xF1a / Motivo</th>
            <th style="padding: 12px; white-space: nowrap;">Porcentaje (%)</th>
            <th style="padding: 12px; white-space: nowrap;">Estado</th>
            <th style="padding: 12px; text-align: right; white-space: nowrap;">Acciones</th>
          </tr>
        </thead>
        <tbody id="tbl-${RESOURCE5}-body"></tbody>
      </table>
    </div>
  `;
    renderTable5(cacheData7);
    document
      .getElementById(`btn-new-${RESOURCE5}`)
      .addEventListener("click", () => openFormModal5());
  }
  function renderTable5(data) {
    const tbody = document.getElementById(`tbl-${RESOURCE5}-body`);
    if (!data || !data.length)
      return (tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align:center; color: var(--text-muted);">No hay descuentos registrados</td></tr>`);
    tbody.innerHTML = data
      .map(
        (i) => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px; color: var(--text-muted);">${escapeHtml(i.id || "")}</td>
      <td style="padding: 12px; font-weight: 600; color: var(--text-dark);">${escapeHtml(i.nombre || "")}</td>
      <td style="padding: 12px; color: var(--text-dark);">${escapeHtml(i.porcentaje || "0")}%</td>
      <td style="padding: 12px;">
         <span style="background: ${i.estado === "Inactivo" ? "var(--input-bg)" : "var(--primary-light)"}; color: ${i.estado === "Inactivo" ? "var(--text-muted)" : "var(--primary-color)"}; padding: 4px 8px; border-radius: 12px; font-size: 12px; white-space: nowrap;">
           ${escapeHtml(i.estado || "Activo")}
         </span>
      </td>
      <td style="padding: 12px; text-align: right; white-space: nowrap;">
        <button class="btn btn-secondary btn-sm" onclick="window.appEditDescuento('${escapeHtml(i.id || "")}')" title="Editar"><i class="ph ph-pencil-simple"></i></button>
        <button class="btn btn-danger btn-sm" onclick="window.appDeleteDescuento('${escapeHtml(i.id || "")}')" title="Eliminar"><i class="ph ph-trash"></i></button>
      </td>
    </tr>
  `,
      )
      .join("");
  }
  function openFormModal5(item) {
    const i = item || {};
    const formHtml = `
    <input type="hidden" name="id" value="${i.id || ""}">
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600; color: var(--text-dark);">Nombre de la Campa\xF1a *</label>
      <input type="text" name="nombre" value="${escapeHtml(i.nombre || "")}" placeholder="Ej. Black Friday, Temporada Escolar..." required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius); background: var(--input-bg); color: var(--text-dark);">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600; color: var(--text-dark);">Porcentaje de descuento (%) *</label>
      <input type="number" name="porcentaje" min="1" max="100" step="0.01" value="${escapeHtml(i.porcentaje || "")}" placeholder="Ej. 10" required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius); background: var(--input-bg); color: var(--text-dark);">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600; color: var(--text-dark);">Estado</label>
      <select name="estado" style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius); background: var(--input-bg); color: var(--text-dark);">
        <option value="Activo" ${i.estado === "Activo" ? "selected" : ""}>Activo</option>
        <option value="Inactivo" ${i.estado === "Inactivo" ? "selected" : ""}>Inactivo</option>
      </select>
    </div>
  `;
    showFormModal(
      i.id ? "Editar Descuento" : "Nuevo Descuento",
      formHtml,
      async (form) => {
        const fd = getFormData(form);
        if (!fd.id) delete fd.id;
        if (!fd.estado) fd.estado = "Activo";
        fd.porcentaje = parseFloat(fd.porcentaje) || 0;
        const result = await saveEntity(RESOURCE5, fd);
        showToast(
          i.id ? "Descuento actualizado" : "Descuento creado",
          "success",
        );
        const savedItem = result.data || result;
        if (i.id && savedItem?.id) {
          cacheData7[
            cacheData7.findIndex((x) => String(x.id) === String(savedItem.id))
          ] = savedItem;
        } else if (savedItem) {
          cacheData7.push(savedItem);
        } else {
          cacheData7 = await getEntities(RESOURCE5);
        }
        renderTable5(cacheData7);
      },
    );
  }
  var containerElement7, cacheData7, RESOURCE5;
  var init_descuentos = __esm({
    "js/modules/descuentos.js"() {
      init_api();
      init_ui();
      cacheData7 = [];
      RESOURCE5 = "descuentos";
      window.appEditDescuento = (id) =>
        openFormModal5(cacheData7.find((x) => String(x.id) === String(id)));
      window.appDeleteDescuento = (id) => {
        showConfirmModal(
          "Eliminar Descuento",
          "<p>\xBFSeguro que deseas eliminar este descuento?</p>",
          async () => {
            await deleteEntity(RESOURCE5, id);
            showToast("Descuento eliminado");
            cacheData7 = cacheData7.filter((x) => String(x.id) !== String(id));
            renderTable5(cacheData7);
          },
        );
      };
    },
  });

  // js/modules/faltantes.js
  var faltantes_exports = {};
  __export(faltantes_exports, {
    init: () => init10,
    render: () => render10,
  });
  async function init10(container) {
    containerElement8 = container;
    try {
      cacheData8 = await getEntities(RESOURCE6);
    } catch (e) {}
  }
  function render10() {
    containerElement8.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
      <h2 style="color: var(--danger-color);"><i class="ph ph-clipboard-text"></i> Registro de Faltantes/Mermas</h2>
      <button class="btn btn-danger" id="btn-new-${RESOURCE6}"><i class="ph ph-warning-circle"></i> Nuevo Faltante</button>
    </div>
    <div class="table-responsive">
      <table style="width: 100%; border-collapse: collapse; background: var(--bg-card); border-radius: var(--radius); overflow: hidden;">
        <thead style="background: var(--danger-light); text-align: left;">
          <tr>
            <th style="padding: 12px; color: var(--text-dark); white-space: nowrap;">Fecha</th>
            <th style="padding: 12px; color: var(--text-dark); white-space: nowrap;">Producto / Descripci\xF3n</th>
            <th style="padding: 12px; color: var(--text-dark); white-space: nowrap;">Cantidad</th>
            <th style="padding: 12px; color: var(--text-dark); white-space: nowrap;">Motivo</th>
            <th style="padding: 12px; text-align: right; color: var(--text-dark); white-space: nowrap;">Acciones</th>
          </tr>
        </thead>
        <tbody id="tbl-${RESOURCE6}-body"></tbody>
      </table>
    </div>
  `;
    renderTable6(cacheData8);
    document
      .getElementById(`btn-new-${RESOURCE6}`)
      .addEventListener("click", () => openFormModal6());
  }
  function renderTable6(data) {
    const tbody = document.getElementById(`tbl-${RESOURCE6}-body`);
    if (!data || !data.length)
      return (tbody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align:center; color: var(--text-muted);">No hay reportes de faltantes o mermas</td></tr>`);
    tbody.innerHTML = data
      .map(
        (i) => `
    <tr style="border-bottom: 1px solid var(--border-color);">
      <td style="padding: 12px; color: var(--text-muted);">${escapeHtml(i.fecha || /* @__PURE__ */ new Date().toLocaleDateString())}</td>
      <td style="padding: 12px; font-weight: 600; color: var(--text-dark);">${escapeHtml(i.producto || i.descripcion || "")}</td>
      <td style="padding: 12px; color: var(--text-dark);">
        <span style="background: var(--danger-light); color: var(--danger-color); padding: 4px 8px; border-radius: 4px; font-weight: bold;">
          -${escapeHtml(i.cantidad || "0")}
        </span>
      </td>
      <td style="padding: 12px; color: var(--text-dark);">${escapeHtml(i.motivo || "No especificado")}</td>
      <td style="padding: 12px; text-align: right; white-space: nowrap;">
        <button class="btn btn-secondary btn-sm" onclick="window.appEditFaltante('${escapeHtml(i.id || "")}')" title="Editar"><i class="ph ph-pencil-simple"></i></button>
        <button class="btn btn-danger btn-sm" onclick="window.appDeleteFaltante('${escapeHtml(i.id || "")}')" title="Eliminar"><i class="ph ph-trash"></i></button>
      </td>
    </tr>
  `,
      )
      .join("");
  }
  function openFormModal6(item) {
    const i = item || {};
    const hoy = /* @__PURE__ */ new Date().toISOString().split("T")[0];
    const formHtml = `
    <input type="hidden" name="id" value="${i.id || ""}">
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600; color: var(--text-dark);">Fecha *</label>
      <input type="date" name="fecha" value="${escapeHtml(i.fecha || hoy)}" required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius); background: var(--input-bg); color: var(--text-dark);">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600; color: var(--text-dark);">Producto/Descripci\xF3n *</label>
      <input type="text" name="producto" value="${escapeHtml(i.producto || i.descripcion || "")}" placeholder="Nombre del producto o detalle..." required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius); background: var(--input-bg); color: var(--text-dark);">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600; color: var(--text-dark);">Cantidad de Merma/Faltante *</label>
      <input type="number" name="cantidad" min="1" step="0.01" value="${escapeHtml(i.cantidad || "")}" placeholder="Ej. 2" required style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius); background: var(--input-bg); color: var(--text-dark);">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display:block; margin-bottom:4px; font-weight:600; color: var(--text-dark);">Motivo de Ajuste *</label>
      <select name="motivo" style="width:100%; padding:10px; border:1px solid var(--border-color); border-radius:var(--radius); background: var(--input-bg); color: var(--text-dark);">
        <option value="Da\xF1ado/Roto" ${i.motivo === "Da\xF1ado/Roto" ? "selected" : ""}>Producto Da\xF1ado/Roto</option>
        <option value="Caducado" ${i.motivo === "Caducado" ? "selected" : ""}>Caducado</option>
        <option value="Robo/P\xE9rdida" ${i.motivo === "Robo/P\xE9rdida" ? "selected" : ""}>Robo/P\xE9rdida</option>
        <option value="Ajuste de Inventario" ${i.motivo === "Ajuste de Inventario" ? "selected" : ""}>Ajuste de Inventario</option>
        <option value="Uso Interno" ${i.motivo === "Uso Interno" ? "selected" : ""}>Uso Interno</option>
      </select>
    </div>
  `;
    showFormModal(
      i.id ? "Editar Reporte" : "Nuevo Faltante",
      formHtml,
      async (form) => {
        const fd = getFormData(form);
        if (!fd.id) delete fd.id;
        fd.cantidad = parseFloat(fd.cantidad) || 0;
        const result = await saveEntity(RESOURCE6, fd);
        showToast(
          i.id ? "Reporte actualizado" : "Faltante registrado",
          "success",
        );
        const savedItem = result.data || result;
        if (i.id && savedItem?.id) {
          cacheData8[
            cacheData8.findIndex((x) => String(x.id) === String(savedItem.id))
          ] = savedItem;
        } else if (savedItem) {
          cacheData8.push(savedItem);
        } else {
          cacheData8 = await getEntities(RESOURCE6);
        }
        renderTable6(cacheData8);
      },
    );
  }
  var containerElement8, cacheData8, RESOURCE6;
  var init_faltantes = __esm({
    "js/modules/faltantes.js"() {
      init_api();
      init_ui();
      cacheData8 = [];
      RESOURCE6 = "faltantes";
      window.appEditFaltante = (id) =>
        openFormModal6(cacheData8.find((x) => String(x.id) === String(id)));
      window.appDeleteFaltante = (id) => {
        showConfirmModal(
          "Eliminar Reporte",
          "<p>\xBFSeguro que deseas eliminar este reporte de faltante?</p>",
          async () => {
            await deleteEntity(RESOURCE6, id);
            showToast("Reporte eliminado");
            cacheData8 = cacheData8.filter((x) => String(x.id) !== String(id));
            renderTable6(cacheData8);
          },
        );
      };
    },
  });

  // js/main.js
  var require_main = __commonJS({
    "js/main.js"() {
      init_ui();
      init_productos();
      init_ventas();
      init_compras();
      init_historial();
      init_clientes();
      init_proveedores();
      init_categorias();
      init_usuarios();
      init_descuentos();
      init_faltantes();
      init_api();
      var menuToggle = document.getElementById("menu-toggle");
      var sidebar = document.getElementById("sidebar");
      var navButtons = document.querySelectorAll(".nav-btn");
      var views = document.querySelectorAll(".view");
      var pageTitle = document.getElementById("page-title");
      var btnThemeToggle = document.getElementById("btn-theme-toggle");
      var btnThemeToggleLogin = document.getElementById(
        "btn-theme-toggle-login",
      );
      var currentView = "ventas";
      var currentUser = null;
      var moduleMap = {
        productos: productos_exports,
        ventas: ventas_exports,
        compras: compras_exports,
        historial: historial_exports,
        clientes: clientes_exports,
        proveedores: proveedores_exports,
        categorias: categorias_exports,
        descuentos: descuentos_exports,
        faltantes: faltantes_exports,
        usuarios: usuarios_exports,
      };
      function initTheme() {
        const pref = localStorage.getItem("theme");
        if (pref === "dark") {
          document.documentElement.setAttribute("data-theme", "dark");
          updateThemeIcons(true);
        }
      }
      function updateThemeIcons(isDark) {
        if (btnThemeToggle)
          btnThemeToggle.innerHTML = isDark
            ? '<i class="ph ph-sun"></i>'
            : '<i class="ph ph-moon"></i>';
        if (btnThemeToggleLogin)
          btnThemeToggleLogin.innerHTML = isDark
            ? '<i class="ph ph-sun"></i>'
            : '<i class="ph ph-moon"></i>';
      }
      function toggleTheme() {
        const isDark =
          document.documentElement.getAttribute("data-theme") === "dark";
        if (isDark) {
          document.documentElement.removeAttribute("data-theme");
          localStorage.setItem("theme", "light");
          updateThemeIcons(false);
        } else {
          document.documentElement.setAttribute("data-theme", "dark");
          localStorage.setItem("theme", "dark");
          updateThemeIcons(true);
        }
      }
      if (btnThemeToggle) btnThemeToggle.addEventListener("click", toggleTheme);
      if (btnThemeToggleLogin)
        btnThemeToggleLogin.addEventListener("click", toggleTheme);
      initTheme();
      function applyRoles() {
        const role = currentUser ? currentUser.role : "cajero";
        document.getElementById("current-role-label").textContent =
          role.toUpperCase();
        navButtons.forEach((btn) => {
          const allowed = btn.dataset.role.split(",");
          if (allowed.includes(role)) {
            btn.classList.remove("hidden");
          } else {
            btn.classList.add("hidden");
          }
        });
      }
      function switchView(target) {
        currentView = target;
        navButtons.forEach((btn) => {
          btn.classList.toggle("active", btn.dataset.target === target);
          if (btn.dataset.target === target)
            pageTitle.textContent = btn.textContent.trim();
        });
        views.forEach((v) =>
          v.classList.toggle("active", v.id === "view-" + target),
        );
        if (window.innerWidth <= 768) sidebar.classList.remove("show");
        if (moduleMap[target]) {
          try {
            const container = document.getElementById("view-" + target);
            if (container && container.querySelector(".empty-state")) {
              container.innerHTML =
                '<div style="text-align:center; padding: 40px;"><i class="ph ph-spinner ph-spin" style="font-size:32px;"></i></div>';
              moduleMap[target].init(container).then(() => {
                moduleMap[target].render();
              });
            } else {
              moduleMap[target].render();
            }
          } catch (e) {
            showError("Fall\xF3 la carga del m\xF3dulo: " + target);
          }
        } else {
          const container = document.getElementById("view-" + target);
          if (container)
            container.innerHTML =
              '<div class="empty-state"><i class="ph ph-wrench"></i><p>Construyendo m\xF3dulo...</p></div>';
        }
      }
      var loginOverlay = document.getElementById("login-overlay");
      var loginForm = document.getElementById("login-form");
      var btnLogin = document.getElementById("btn-login-submit");
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const u = document.getElementById("login-username").value.trim();
        const p = document.getElementById("login-password").value.trim();
        const err = document.getElementById("login-error");
        const card = document.querySelector(".login-card");
        err.style.display = "none";
        btnLogin.innerHTML =
          '<i class="ph ph-spinner ph-spin"></i> Validando...';
        let user = null;
        try {
          const usuariosDB = await getEntities("usuarios");
          if (Array.isArray(usuariosDB)) {
            user = usuariosDB.find((x) => x.username === u && x.password === p);
          }
        } catch (e2) {
          console.warn(
            "No se pudo obtener usuarios, se intentar\xE1 usar fallback admin",
            e2,
          );
        }
        if (!user && u === "admin" && p === "admin") {
          user = { username: "admin", role: "admin" };
        }
        if (user) {
          currentUser = user;
          sessionStorage.setItem("session_user", JSON.stringify(user));
          loginOverlay.classList.add("hidden");
          applyRoles();
          switchView("ventas");
          showToast("\xA1Bienvenido, " + user.username + "!", "success");
        } else {
          err.innerText = "Credenciales incorrectas o error de conexi\xF3n";
          err.style.display = "block";
          if (card) {
            card.classList.remove("shake-error");
            void card.offsetWidth;
            card.classList.add("shake-error");
          }
          showError("Usuario o contrase\xF1a incorrectos");
        }
        btnLogin.innerHTML = "Ingresar al Sistema";
      });
      document.getElementById("btn-logout").addEventListener("click", () => {
        sessionStorage.removeItem("session_user");
        window.location.reload();
      });
      document.addEventListener("DOMContentLoaded", () => {
        const cachedUser = sessionStorage.getItem("session_user");
        if (cachedUser) {
          currentUser = JSON.parse(cachedUser);
          loginOverlay.classList.add("hidden");
          applyRoles();
          switchView(currentUser.role === "admin" ? "ventas" : "ventas");
        }
        navButtons.forEach((btn) => {
          btn.addEventListener("click", () => switchView(btn.dataset.target));
        });
        menuToggle.addEventListener("click", () =>
          sidebar.classList.toggle("show"),
        );
      });
      window.appSyncModule = async (target, silent = false) => {
        if (!moduleMap[target]) return;
        const btnIcon = document.querySelector("#btn-sync i");
        if (btnIcon) btnIcon.classList.add("ph-spin");
        if (!silent) showToast("Sincronizando con Sheets...");
        try {
          const container = document.getElementById("view-" + target);
          await moduleMap[target].init(container);
          moduleMap[target].render();
          if (!silent) showToast("Base de datos sincronizada", "success");
        } catch (e) {
          if (!silent) showError("Error de sincronizaci\xF3n");
        } finally {
          if (btnIcon) btnIcon.classList.remove("ph-spin");
        }
      };
      document.getElementById("btn-sync")?.addEventListener("click", () => {
        window.appSyncModule(currentView, false);
      });
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible" && currentUser) {
          window.appSyncModule(currentView, true);
        }
      });
    },
  });
  require_main();
})();
