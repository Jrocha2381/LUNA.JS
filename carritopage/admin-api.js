window.API = {
  clientes: "https://mockapi.io/clientes",
  proveedores: "https://mockapi.io/proveedores",
  categorias: "https://mockapi.io/categorias",
};

window.adminRequest = async function (url, options = {}) {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  };

  const response = await fetch(url, config);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error ${response.status}: ${errorText || response.statusText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

window.fetchAllEntities = async function (entity) {
  return window.adminRequest(window.API[entity]);
};

window.createEntity = async function (entity, data) {
  return window.adminRequest(window.API[entity], {
    method: "POST",
    body: JSON.stringify(data),
  });
};

window.updateEntity = async function (entity, id, data) {
  return window.adminRequest(`${window.API[entity]}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

window.deleteEntity = async function (entity, id) {
  return window.adminRequest(`${window.API[entity]}/${id}`, {
    method: "DELETE",
  });
};
