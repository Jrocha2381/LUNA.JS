/**
 * API Service - Capa de comunicación asíncrona
 * Maneja todas las peticiones HTTP con async/await
 * Permite switchear entre backend real o mock según configuración
 */

(function () {
  let config = {
    enabled: false,
    baseUrl: "http://localhost:3000",
    apiPrefix: "/api",
    useMockData: true // Modo desarrollo con datos simulados
  };

  // Endpoints disponibles
  const endpoints = {
    // Productos
    getProducts: "GET /productos",
    getProductById: "GET /productos/:id",
    createProduct: "POST /productos",
    updateProduct: "PUT /productos/:id",
    deleteProduct: "DELETE /productos/:id",

    // Categorías
    getCategories: "GET /categorias",
    getCategoryById: "GET /categorias/:id",
    createCategory: "POST /categorias",
    updateCategory: "PUT /categorias/:id",
    deleteCategory: "DELETE /categorias/:id",

    // Proveedores
    getSuppliers: "GET /proveedores",
    getSupplierById: "GET /proveedores/:id",
    createSupplier: "POST /proveedores",
    updateSupplier: "PUT /proveedores/:id",
    deleteSupplier: "DELETE /proveedores/:id",

    // Clientes
    getClients: "GET /clientes",
    getClientById: "GET /clientes/:id",
    createClient: "POST /clientes",
    updateClient: "PUT /clientes/:id",
    deleteClient: "DELETE /clientes/:id",

    // Ventas
    getSales: "GET /ventas",
    createSale: "POST /ventas",
    updateSale: "PUT /ventas/:id",
    completeSale: "POST /ventas/:id/completar",

    // Compras
    getPurchases: "GET /compras",
    createPurchase: "POST /compras",
    updatePurchase: "PUT /compras/:id",
    completePurchase: "POST /compras/:id/completar"
  };

  /**
   * Realiza una petición HTTP con manejo de errores
   */
  async function request(method, endpoint, data = null) {
    try {
      if (config.useMockData) {
        return handleMockRequest(method, endpoint, data);
      }

      if (!config.enabled) {
        throw new Error("API no configurada. Usa APIService.configure()");
      }

      const url = `${config.baseUrl}${config.apiPrefix}${endpoint}`;
      const options = {
        method,
        headers: {
          "Content-Type": "application/json"
        }
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const contentType = response.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const payload = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        throw {
          status: response.status,
          message: response.statusText,
          payload
        };
      }

      return payload;
    } catch (error) {
      console.error(`[API Error] ${method} ${endpoint}:`, error);
      throw {
        message: error.message || "Error en la petición",
        status: error.status || 500,
        details: error.payload || error
      };
    }
  }

  /**
   * Manejo de peticiones en modo mock (desarrollo local)
   */
  function handleMockRequest(method, endpoint, data) {
    const storageKey = `luna_${endpoint.split("/")[1]}`;
    const storage = getStorageData(storageKey);

    switch (method) {
      case "GET":
        return Promise.resolve(storage);

      case "POST":
        const newItem = {
          id: Date.now().toString(),
          ...data,
          createdAt: new Date().toISOString()
        };
        saveStorageData(storageKey, [...storage, newItem]);
        return Promise.resolve(newItem);

      case "PUT":
        const id = endpoint.split("/")[2];
        const updated = storage.map(item =>
          item.id === id ? { ...item, ...data, updatedAt: new Date().toISOString() } : item
        );
        saveStorageData(storageKey, updated);
        return Promise.resolve(updated.find(item => item.id === id));

      case "DELETE":
        const deleteId = endpoint.split("/")[2];
        const filtered = storage.filter(item => item.id !== deleteId);
        saveStorageData(storageKey, filtered);
        return Promise.resolve({ success: true, id: deleteId });

      default:
        return Promise.reject(new Error("Método HTTP no soportado"));
    }
  }

  /**
   * Obtener datos del almacenamiento local
   */
  function getStorageData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error al leer storage:", e);
      return [];
    }
  }

  /**
   * Guardar datos en almacenamiento local
   */
  function saveStorageData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error("Error al guardar en storage:", e);
    }
  }

  // API Pública
  const APIService = {
    /**
     * Configurar el servicio
     */
    configure(cfg = {}) {
      config = { ...config, ...cfg };
    },

    /**
     * Obtener todos los productos
     */
    async getProducts() {
      return request("GET", "/productos");
    },

    /**
     * Obtener producto por ID
     */
    async getProductById(id) {
      return request("GET", `/productos/${id}`);
    },

    /**
     * Crear producto
     */
    async createProduct(data) {
      return request("POST", "/productos", data);
    },

    /**
     * Actualizar producto
     */
    async updateProduct(id, data) {
      return request("PUT", `/productos/${id}`, data);
    },

    /**
     * Eliminar producto
     */
    async deleteProduct(id) {
      return request("DELETE", `/productos/${id}`);
    },

    // ========== CATEGORÍAS ==========
    async getCategories() {
      return request("GET", "/categorias");
    },

    async getCategoryById(id) {
      return request("GET", `/categorias/${id}`);
    },

    async createCategory(data) {
      return request("POST", "/categorias", data);
    },

    async updateCategory(id, data) {
      return request("PUT", `/categorias/${id}`, data);
    },

    async deleteCategory(id) {
      return request("DELETE", `/categorias/${id}`);
    },

    // ========== PROVEEDORES ==========
    async getSuppliers() {
      return request("GET", "/proveedores");
    },

    async getSupplierById(id) {
      return request("GET", `/proveedores/${id}`);
    },

    async createSupplier(data) {
      return request("POST", "/proveedores", data);
    },

    async updateSupplier(id, data) {
      return request("PUT", `/proveedores/${id}`, data);
    },

    async deleteSupplier(id) {
      return request("DELETE", `/proveedores/${id}`);
    },

    // ========== CLIENTES ==========
    async getClients() {
      return request("GET", "/clientes");
    },

    async getClientById(id) {
      return request("GET", `/clientes/${id}`);
    },

    async createClient(data) {
      return request("POST", "/clientes", data);
    },

    async updateClient(id, data) {
      return request("PUT", `/clientes/${id}`, data);
    },

    async deleteClient(id) {
      return request("DELETE", `/clientes/${id}`);
    },

    // ========== VENTAS ==========
    async getSales() {
      return request("GET", "/ventas");
    },

    async createSale(data) {
      return request("POST", "/ventas", data);
    },

    async updateSale(id, data) {
      return request("PUT", `/ventas/${id}`, data);
    },

    async completeSale(id, data) {
      return request("POST", `/ventas/${id}/completar`, data);
    },

    // ========== COMPRAS ==========
    async getPurchases() {
      return request("GET", "/compras");
    },

    async createPurchase(data) {
      return request("POST", "/compras", data);
    },

    async updatePurchase(id, data) {
      return request("PUT", `/compras/${id}`, data);
    },

    async completePurchase(id, data) {
      return request("POST", `/compras/${id}/completar`, data);
    }
  };

  window.APIService = APIService;
})();
