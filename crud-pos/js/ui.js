/* ==================================
   Sistema de Alertas (Toasts)
===================================== */
export function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  const icon = type === "success" ? '<i class="ph-fill ph-check-circle"></i>' : '<i class="ph-fill ph-warning-circle"></i>';
  toast.innerHTML = `${icon} <span>${message}</span>`;
  
  container.appendChild(toast);
  
  // Animar entrada
  requestAnimationFrame(() => toast.classList.add("show"));
  
  // Limpiar
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400); // 300ms de CSS transition
  }, 3500);
}

export function showError(msg) {
  showToast(msg, "error");
}

/* ==================================
   Sistema de Modales (Confirmaciones y Formularios)
===================================== */
const modalOverlay = document.getElementById("main-modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
const btnCancel = document.getElementById("modal-btn-cancel");
const btnConfirm = document.getElementById("modal-btn-confirm");
const btnClose = document.getElementById("modal-close");

let onConfirmCallback = null;

// Ocultar modal
function closeModal() {
  modalOverlay.classList.remove("show");
  onConfirmCallback = null;
}

// Binds
btnCancel.addEventListener("click", closeModal);
btnClose.addEventListener("click", closeModal);
btnConfirm.addEventListener("click", async () => {
  if (typeof onConfirmCallback === "function") {
    // Cambiamos estado del boton (Opcional UX)
    const originalText = btnConfirm.textContent;
    btnConfirm.disabled = true;
    btnConfirm.textContent = "Procesando...";
    
    try {
      const closeAfter = await onConfirmCallback();
      if (closeAfter !== false) {
        closeModal();
      }
    } catch(err) {
      showError(err.message || "Ocurrió un error.");
    } finally {
      btnConfirm.disabled = false;
      btnConfirm.textContent = originalText;
    }
  } else {
    closeModal();
  }
});

/**
 * Muestra un modal de CONFIRMACIÓN crítico (Ej: ¿Eliminar?)
 */
export function showConfirmModal(title, msgHtml, onConfirm) {
  modalTitle.textContent = title;
  modalBody.innerHTML = msgHtml;
  btnConfirm.textContent = "Sí, Confirmar";
  btnConfirm.className = "btn btn-danger"; // Para alerta roja
  
  onConfirmCallback = onConfirm;
  modalOverlay.classList.add("show");
}

/**
 * Muestra un modal con un FORMULARIO dinámico (Ej: Crear/Editar entidad)
 */
export function showFormModal(title, formHtml, onSave) {
  modalTitle.textContent = title;
  modalBody.innerHTML = `<form id="dynamic-form" autocomplete="off">${formHtml}</form>`;
  btnConfirm.textContent = "Guardar";
  btnConfirm.className = "btn btn-primary";
  
  onConfirmCallback = async () => {
    // Validar HTML5 base
    const form = document.getElementById("dynamic-form");
    if(!form.reportValidity()) return false; // Prevent modal closing if invalid
    
    return await onSave(form);
  };
  
  modalOverlay.classList.add("show");
}

/* ==================================
   Helper Formulario (Recolección y Types)
===================================== */
export function getFormData(form) {
  const formData = new FormData(form);
  const payload = {};
  
  // Aquí solucionamos el BUG 2: NUNCA ignorar el "id". Si existe en el form (hidden), lo arrastramos
  formData.forEach((value, key) => {
    let cleanVal = typeof value === "string" ? value.trim() : value;
    
    // BUG 1 solucionado: castear "si"/"no" a Boolean reales
    if (key === "segimientoInventario") {
      cleanVal = (cleanVal.toLowerCase() === "si" || cleanVal.toLowerCase() === "true");
    }
    
    // Types numéricos si es necesario
    if (["precio", "costo", "stock", "cantidad"].includes(key) && cleanVal !== "") {
      cleanVal = Number(cleanVal);
    }
    
    payload[key] = cleanVal;
  });
  
  return payload;
}

export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
