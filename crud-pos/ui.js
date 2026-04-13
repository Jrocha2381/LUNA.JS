const messageContainer = document.getElementById("message-container");
const loaderElement = document.getElementById("loader");

export function showLoader() {
  loaderElement.classList.remove("hidden");
}

export function hideLoader() {
  loaderElement.classList.add("hidden");
}

export function showMessage(message, type = "success") {
  clearMessage();
  const alert = document.createElement("div");
  alert.className = `message ${type}`;
  alert.textContent = message;
  messageContainer.appendChild(alert);
  window.setTimeout(() => {
    if (messageContainer.contains(alert)) {
      messageContainer.removeChild(alert);
    }
  }, 5000);
}

export function clearMessage() {
  messageContainer.innerHTML = "";
}

export function getFormData(form) {
  const formData = new FormData(form);
  const payload = {};

  formData.forEach((value, key) => {
    if (key === "id") {
      return;
    }

    payload[key] = value.trim();
  });

  return payload;
}

export function populateForm(form, item) {
  Object.entries(item).forEach(([key, value]) => {
    const field = form.querySelector(`[name="${key}"]`);
    if (field) {
      field.value = value;
    }
  });
}

export function clearForm(form) {
  form.reset();
  const idField = form.querySelector("[name='id']");
  if (idField) {
    idField.value = "";
  }
}

export function renderTableRows(table, items, config) {
  const tbody = table.querySelector("tbody");
  tbody.innerHTML = "";

  if (!Array.isArray(items) || items.length === 0) {
    const emptyRow = document.createElement("tr");
    emptyRow.innerHTML = `
      <td colspan="${config.fields.length + 1}" class="empty-row">
        ${config.emptyMessage}
      </td>
    `;
    tbody.appendChild(emptyRow);
    return;
  }

  items.forEach((item) => {
    const row = document.createElement("tr");
    const cells = config.fields
      .map((field) => `<td>${item[field.name] ?? ""}</td>`)
      .join("");

    row.innerHTML = `
      ${cells}
      <td class="actions">
        <button type="button" class="secondary edit-button" data-action="edit" data-entity="${config.entity}" data-id="${item.id}">
          Editar
        </button>
        <button type="button" class="danger delete-button" data-action="delete" data-entity="${config.entity}" data-id="${item.id}">
          Eliminar
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });
}

export function filterItems(items, config, query) {
  if (!query) {
    return items;
  }

  const normalized = query.toLowerCase();
  return items.filter((item) =>
    config.fields.some((field) =>
      (item[field.name] || "").toString().toLowerCase().includes(normalized)
    )
  );
}
