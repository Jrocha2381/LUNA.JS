import { fetchAll, createEntity, updateEntity, deleteEntity } from "./api.js";
import { clientesConfig } from "./clientes.js";
import { proveedoresConfig } from "./proveedores.js";
import { categoriasConfig } from "./categorias.js";
import {
  showLoader,
  hideLoader,
  showMessage,
  clearMessage,
  getFormData,
  populateForm,
  clearForm,
  renderTableRows,
  filterItems,
} from "./ui.js";

const configs = {
  clientes: clientesConfig,
  proveedores: proveedoresConfig,
  categorias: categoriasConfig,
};

const state = {
  items: {
    clientes: [],
    proveedores: [],
    categorias: [],
  },
};

window.addEventListener("DOMContentLoaded", async () => {
  initializeTabs();
  initializeFormsAndSearch();
  await loadEntity("clientes");
});

function initializeTabs() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      const entity = button.dataset.entity;
      toggleTab(entity);
    });
  });
}

function toggleTab(entity) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.entity === entity);
  });
  document.querySelectorAll(".entity-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.entity === entity);
  });

  if (state.items[entity].length === 0) {
    loadEntity(entity);
  }
}

function initializeFormsAndSearch() {
  Object.values(configs).forEach((config) => {
    const form = document.getElementById(config.formId);
    const search = document.getElementById(config.searchId);

    form.addEventListener("submit", (event) => handleSubmit(event, config));
    form.querySelector(".reset-button").addEventListener("click", () => clearForm(form));

    search.addEventListener("input", () => {
      const filteredItems = filterItems(state.items[config.entity], config, search.value);
      renderTableRows(document.getElementById(config.tableId), filteredItems, config);
    });
  });

  document.body.addEventListener("click", handleActionClick);
}

async function loadEntity(entity) {
  const config = configs[entity];
  showLoader();
  clearMessage();

  try {
    const data = await fetchAll(entity);
    state.items[entity] = Array.isArray(data) ? data : [];
    renderTableRows(document.getElementById(config.tableId), state.items[entity], config);
  } catch (error) {
    showMessage(`No se pudieron cargar ${config.title.toLowerCase()}: ${error.message}`, "error");
  } finally {
    hideLoader();
  }
}

async function handleSubmit(event, config) {
  event.preventDefault();
  const form = event.target;
  const idField = form.querySelector("[name='id']");
  const id = idField?.value;
  const payload = getFormData(form);

  if (Object.keys(payload).length === 0) {
    showMessage("Completa todos los campos antes de enviar.", "error");
    return;
  }

  showLoader();
  clearMessage();

  try {
    if (id) {
      await updateEntity(config.entity, id, payload);
      showMessage(`${config.singular} actualizado correctamente.`, "success");
    } else {
      await createEntity(config.entity, payload);
      showMessage(`${config.singular} creado correctamente.`, "success");
    }

    clearForm(form);
    await loadEntity(config.entity);
  } catch (error) {
    showMessage(`Error al guardar ${config.title.toLowerCase()}: ${error.message}`, "error");
  } finally {
    hideLoader();
  }
}

function handleActionClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const entity = button.dataset.entity;
  const id = button.dataset.id;
  const config = configs[entity];
  const form = document.getElementById(config.formId);

  if (action === "edit") {
    const item = state.items[entity].find((record) => record.id.toString() === id.toString());
    if (!item) {
      showMessage("Registro no encontrado para editar.", "error");
      return;
    }

    if (form) {
      populateForm(form, item);
      const idField = form.querySelector("[name='id']");
      if (idField) {
        idField.value = item.id;
      }
    }
  }

  if (action === "delete") {
    confirmDelete(entity, id, config);
  }
}

async function confirmDelete(entity, id, config) {
  const confirmation = window.confirm(`¿Eliminar ${config.singular.toLowerCase()}? Esta acción no se puede deshacer.`);
  if (!confirmation) {
    return;
  }

  showLoader();
  clearMessage();

  try {
    await deleteEntity(entity, id);
    showMessage(`${config.singular} eliminado correctamente.`, "success");
    await loadEntity(entity);
  } catch (error) {
    showMessage(`Error al eliminar ${config.title.toLowerCase()}: ${error.message}`, "error");
  } finally {
    hideLoader();
  }
}
