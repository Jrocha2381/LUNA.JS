/**
 * API Service - Capa de comunicación asíncrona
 * Maneja todas las peticiones HTTP con async/await
 * Permite switchear entre backend real o mock según configuración
 */

(function () {
  function detectApiPrefix() {
    try {
      const path = window?.location?.pathname || "";
      const candidates = [
        "/Jeronimo%20Rubio_Sebastian%20Rocha_Ibrahim%20Safadi",
        "/Jeronimo Rubio_Sebastian Rocha_Ibrahim Safadi",
        "/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi"
      ];
      const match = candidates.find((p) => path.startsWith(p));
      return match || candidates[0];
    } catch (_e) {
      return "/Jeronimo%20Rubio_Sebastian%20Rocha_Ibrahim%20Safadi";
    }
  }

  function isHttpContext() {
    try {
      const protocol = window?.location?.protocol || "";
      return protocol === "http:" || protocol === "https:";
    } catch (_e) {
      return false;
    }
  }

  let config = {
    enabled: true,
    baseUrl: "",
    apiPrefix: detectApiPrefix(),
    // Si se abre el HTML con file://, mantener modo mock por defecto.
    useMockData: !isHttpContext()
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

    // Descuentos
    getDiscounts: "GET /descuentos",
    getDiscountById: "GET /descuentos/:id",
    createDiscount: "POST /descuentos",
    updateDiscount: "PUT /descuentos/:id",
    deleteDiscount: "DELETE /descuentos/:id",
    applyDiscountToSale: "POST /ventas/:id/descuento",
    removeDiscountFromSale: "DELETE /ventas/:id/descuento",

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
      const token =
        (typeof sessionStorage !== "undefined" && sessionStorage.getItem("token")) ||
        (typeof localStorage !== "undefined" && localStorage.getItem("token")) ||
        null;
      const options = {
        method,
        headers: {
          "Content-Type": "application/json"
        }
      };

      if (token) {
        options.headers.Authorization = `Bearer ${token}`;
      }

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
      if (!config.apiPrefix) {
        config.apiPrefix = detectApiPrefix();
      }
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

    async applyDiscountToSale(ventaId, descuentoId) {
      return request("POST", `/ventas/${ventaId}/descuento`, { descuentoId });
    },

    async removeDiscountFromSale(ventaId) {
      return request("DELETE", `/ventas/${ventaId}/descuento`);
    },

    // ========== DESCUENTOS ==========
    async getDiscounts() {
      return request("GET", "/descuentos");
    },

    async getDiscountById(id) {
      return request("GET", `/descuentos/${id}`);
    },

    async createDiscount(data) {
      return request("POST", "/descuentos", data);
    },

    async updateDiscount(id, data) {
      return request("PUT", `/descuentos/${id}`, data);
    },

    async deleteDiscount(id) {
      return request("DELETE", `/descuentos/${id}`);
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
