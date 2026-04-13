export const API = {
  clientes: "https://mockapi.io/clientes",
  proveedores: "https://mockapi.io/proveedores",
  categorias: "https://mockapi.io/categorias",
};

export async function request(url, options = {}) {
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
}

export async function fetchAll(entity) {
  return request(API[entity]);
}

export async function createEntity(entity, data) {
  return request(API[entity], {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateEntity(entity, id, data) {
  return request(`${API[entity]}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteEntity(entity, id) {
  return request(`${API[entity]}/${id}`, {
    method: "DELETE",
  });
}
