/**
 * CRUD Manager - Gestión de entidades básicas
 * Maneja Categorías, Proveedores y Clientes
 */

(function () {
  /**
   * Gestor genérico de CRUD
   */
  function createCRUDManager(entityName, storageKey) {
    return {
      async getAll() {
        try {
          const data = await APIService[`get${entityName}s`]?.();
          return data || [];
        } catch (error) {
          console.error(`Error obteniendo ${entityName}s:`, error);
          return [];
        }
      },

      async getById(id) {
        try {
          return await APIService[`get${entityName}ById`]?.(id);
        } catch (error) {
          console.error(`Error obteniendo ${entityName}:`, error);
          return null;
        }
      },

      async create(data) {
        if (!data.name) {
          throw new Error(`${entityName} requiere un nombre`);
        }

        const newItem = {
          id: Date.now().toString(),
          ...data,
          createdAt: new Date().toISOString()
        };

        try {
          return await APIService[`create${entityName}`]?.(newItem);
        } catch (error) {
          console.warn(`Error creando ${entityName} en API, guardando localmente:`, error);
          return newItem;
        }
      },

      async update(id, data) {
        if (!id) throw new Error("ID requerido");

        try {
          return await APIService[`update${entityName}`]?.(id, {
            ...data,
            updatedAt: new Date().toISOString()
          });
        } catch (error) {
          console.warn(`Error actualizando ${entityName} en API:`, error);
          return { id, ...data };
        }
      },

      async delete(id) {
        if (!id) throw new Error("ID requerido");

        try {
          return await APIService[`delete${entityName}`]?.(id);
        } catch (error) {
          console.warn(`Error eliminando ${entityName} en API:`, error);
          return { success: true, id };
        }
      }
    };
  }

  // Exportar gestores CRUD
  window.CategoriesManager = createCRUDManager("Category", "luna_categories");
  window.SuppliersManager = createCRUDManager("Supplier", "luna_suppliers");
  window.ClientsManager = createCRUDManager("Client", "luna_clients");
  window.ProductsManager = createCRUDManager("Product", "luna_products");
})();
