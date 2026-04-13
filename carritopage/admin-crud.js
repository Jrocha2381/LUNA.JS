(function () {
  const configs = {
    clientes: {
      entity: "clientes",
      title: "Clientes",
      singular: "Cliente",
      fields: [
        { name: "nombre", label: "Nombre", type: "text", required: true },
        { name: "telefono", label: "Teléfono", type: "text", required: true },
      ],
      headers: ["Nombre", "Teléfono"],
      emptyMessage: "No hay clientes registrados.",
    },
    proveedores: {
      entity: "proveedores",
      title: "Proveedores",
      singular: "Proveedor",
      fields: [
        { name: "nombre", label: "Nombre", type: "text", required: true },
        { name: "contacto", label: "Contacto", type: "text", required: true },
      ],
      headers: ["Nombre", "Contacto"],
      emptyMessage: "No hay proveedores registrados.",
    },
    categorias: {
      entity: "categorias",
      title: "Categorías",
      singular: "Categoría",
      fields: [
        { name: "nombre", label: "Nombre", type: "text", required: true },
      ],
      headers: ["Nombre"],
      emptyMessage: "No hay categorías registradas.",
    },
  };

  const state = {
    activeEntity: "clientes",
    items: {
      clientes: [],
      proveedores: [],
      categorias: [],
    },
  };

  const elements = {
    tabs: document.querySelectorAll(".admin-tabs button"),
    search: document.getElementById("entity-search"),
    form: document.getElementById("entity-form"),
    formTitle: document.getElementById("entity-form-title"),
    formFields: document.getElementById("form-fields"),
    submitButton: document.getElementById("entity-submit"),
    resetButton: document.getElementById("entity-reset"),
    tableHead: document.getElementById("entity-table-head"),
    tableBody: document.getElementById("entity-table-body"),
    message: document.getElementById("admin-message"),
    loader: document.getElementById("admin-loader"),
  };

  function showLoader() {
    elements.loader.classList.remove("oculto");
  }

  function hideLoader() {
    elements.loader.classList.add("oculto");
  }

  function showMessage(text, type = "success") {
    elements.message.textContent = text;
    elements.message.className = `mensaje ${type}`;
    elements.message.classList.remove("oculto");
    window.setTimeout(() => {
      elements.message.classList.add("oculto");
    }, 4000);
  }

  function clearMessage() {
    elements.message.textContent = "";
    elements.message.className = "mensaje oculto";
  }

  function getFormData() {
    const formData = new FormData(elements.form);
    const data = {};

    configs[state.activeEntity].fields.forEach((field) => {
      const value = formData.get(field.name);
      data[field.name] = value ? value.toString().trim() : "";
    });

    return data;
  }

  function populateForm(item) {
    configs[state.activeEntity].fields.forEach((field) => {
      const input = elements.form.querySelector(`[name="${field.name}"]`);
      if (input) input.value = item[field.name] || "";
    });
    const idInput = elements.form.querySelector("[name='id']");
    if (idInput) idInput.value = item.id || "";
    elements.submitButton.textContent = `Actualizar ${configs[state.activeEntity].singular}`;
    elements.formTitle.textContent = `Editar ${configs[state.activeEntity].singular}`;
  }

  function clearForm() {
    elements.form.reset();
    const idInput = elements.form.querySelector("[name='id']");
    if (idInput) idInput.value = "";
    elements.submitButton.textContent = `Guardar ${configs[state.activeEntity].singular}`;
    elements.formTitle.textContent = `Crear ${configs[state.activeEntity].singular}`;
  }

  function renderFormFields() {
    elements.formFields.innerHTML = "";
    configs[state.activeEntity].fields.forEach((field) => {
      const label = document.createElement("label");
      label.textContent = field.label + (field.required ? " *" : "");

      const input = document.createElement(field.type === "textarea" ? "textarea" : "input");
      input.name = field.name;
      input.type = field.type;
      input.required = !!field.required;
      input.placeholder = field.label;
      input.value = "";
      input.autocomplete = "off";
      input.className = "";

      label.appendChild(input);
      elements.formFields.appendChild(label);
    });
  }

  function renderTable() {
    const config = configs[state.activeEntity];
    const headers = config.headers.map((header) => `<th>${header}</th>`).join("");
    elements.tableHead.innerHTML = `${headers}<th>Acciones</th>`;

    const items = filterItems(elements.search.value);
    elements.tableBody.innerHTML = "";

    if (!items.length) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="${config.headers.length + 1}" style="padding: 18px; text-align:center;">${config.emptyMessage}</td>`;
      elements.tableBody.appendChild(row);
      return;
    }

    items.forEach((item) => {
      const row = document.createElement("tr");
      const cells = config.fields
        .map((field) => `<td>${item[field.name] || ""}</td>`)
        .join("");
      row.innerHTML = `${cells}<td><button type="button" class="btn-admin btn-editar" data-action="edit" data-id="${item.id}">Editar</button> <button type="button" class="btn-admin btn-eliminar-admin" data-action="delete" data-id="${item.id}">Eliminar</button></td>`;
      elements.tableBody.appendChild(row);
    });
  }

  function filterItems(query) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [...state.items[state.activeEntity]];

    return state.items[state.activeEntity].filter((item) =>
      configs[state.activeEntity].fields.some((field) =>
        (item[field.name] || "").toString().toLowerCase().includes(normalized)
      )
    );
  }

  async function loadEntity(entity) {
    const config = configs[entity];
    showLoader();
    clearMessage();
    try {
      const data = await window.fetchAllEntities(entity);
      state.items[entity] = Array.isArray(data) ? data : [];
      renderTable();
    } catch (error) {
      showMessage(`No se pudieron cargar ${config.title.toLowerCase()}: ${error.message}`, "error");
    } finally {
      hideLoader();
    }
  }

  function setActiveEntity(entity) {
    state.activeEntity = entity;
    elements.tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.entity === entity);
    });
    clearForm();
    renderFormFields();
    renderTable();
    if (!state.items[entity].length) {
      loadEntity(entity);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const idInput = elements.form.querySelector("[name='id']");
    const id = idInput?.value;
    const data = getFormData();

    if (Object.values(data).some((value) => value === "")) {
      showMessage("Completa todos los campos antes de enviar.", "error");
      return;
    }

    showLoader();
    clearMessage();
    try {
      if (id) {
        await window.updateEntity(state.activeEntity, id, data);
        showMessage(`${configs[state.activeEntity].singular} actualizado correctamente.`, "success");
      } else {
        await window.createEntity(state.activeEntity, data);
        showMessage(`${configs[state.activeEntity].singular} creado correctamente.`, "success");
      }
      clearForm();
      await loadEntity(state.activeEntity);
    } catch (error) {
      showMessage(`Error al guardar ${configs[state.activeEntity].title.toLowerCase()}: ${error.message}`, "error");
    } finally {
      hideLoader();
    }
  }

  async function handleTableAction(event) {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;
    const item = state.items[state.activeEntity].find((record) => record.id.toString() === id.toString());

    if (action === "edit") {
      if (!item) {
        showMessage("Registro no encontrado.", "error");
        return;
      }
      populateForm(item);
    }

    if (action === "delete") {
      const confirmed = window.confirm(`¿Eliminar ${configs[state.activeEntity].singular.toLowerCase()}?`);
      if (!confirmed) return;
      showLoader();
      clearMessage();
      try {
        await window.deleteEntity(state.activeEntity, id);
        showMessage(`${configs[state.activeEntity].singular} eliminado correctamente.`, "success");
        await loadEntity(state.activeEntity);
      } catch (error) {
        showMessage(`Error al eliminar ${configs[state.activeEntity].title.toLowerCase()}: ${error.message}`, "error");
      } finally {
        hideLoader();
      }
    }
  }

  function initializeEvents() {
    elements.tabs.forEach((tab) => {
      tab.addEventListener("click", () => setActiveEntity(tab.dataset.entity));
    });

    elements.form.addEventListener("submit", handleSubmit);
    elements.resetButton.addEventListener("click", () => {
      clearForm();
      clearMessage();
    });

    elements.search.addEventListener("input", renderTable);
    elements.tableBody.addEventListener("click", handleTableAction);
  }

  function renderAdminEntities() {
    renderFormFields();
    renderTable();
  }

  window.renderAdminProductos = function () {
    renderAdminEntities();
  };

  window.activarEventosAdmin = function () {
    initializeEvents();
    setActiveEntity(state.activeEntity);
  };
})();
