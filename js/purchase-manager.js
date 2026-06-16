/**
 * Purchase Manager - Gestión del flujo de compras
 * - Registrar entrada de mercancía
 * - Asociar con proveedores
 * - Historial de compras
 */

(function () {
  const STORAGE_KEY = "luna_purchases";

  /**
   * Crear una nueva compra (entrada de mercancía)
   */
  async function createPurchase(data) {
    // Validar datos requeridos
    if (!data.supplierId || !data.items || data.items.length === 0) {
      throw new Error("Compra incompleta: requiere proveedor e ítems");
    }

    const purchase = {
      id: Date.now().toString(),
      supplierId: data.supplierId,
      supplierName: data.supplierName || "",
      items: data.items.map(item => ({
        productId: item.productId,
        productName: item.productName,
        quantity: parseInt(item.quantity),
        costPrice: parseFloat(item.costPrice) || 0,
        subtotal: parseInt(item.quantity) * parseFloat(item.costPrice)
      })),
      totalCost: data.items.reduce((sum, item) => sum + (parseInt(item.quantity) * parseFloat(item.costPrice)), 0),
      notes: data.notes || "",
      createdAt: new Date().toISOString(),
      status: "pending" // pending, completed
    };

    try {
      // Intentar registrar en API
      const result = await APIService.createPurchase(purchase);
      console.log("Compra registrada en API:", result);
    } catch (error) {
      console.warn("No se pudo registrar en API, guardando localmente:", error);
    }

    // Guardar localmente
    const purchases = getPurchases();
    purchases.push(purchase);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));

    return purchase;
  }

  /**
   * Completar una compra (marcar como recibida)
   */
  async function completePurchase(purchaseId) {
    const purchases = getPurchases();
    const purchase = purchases.find(p => p.id === purchaseId);

    if (!purchase) {
      throw new Error("Compra no encontrada");
    }

    purchase.status = "completed";
    purchase.completedAt = new Date().toISOString();

    try {
      await APIService.completePurchase(purchaseId, { status: "completed" });
    } catch (error) {
      console.warn("Error al completar en API:", error);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(purchases));
    return purchase;
  }

  /**
   * Obtener todas las compras
   */
  function getPurchases() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch (e) {
      console.error("Error al obtener compras:", e);
      return [];
    }
  }

  /**
   * Obtener compra por ID
   */
  function getPurchaseById(id) {
    const purchases = getPurchases();
    return purchases.find(p => p.id === id);
  }

  /**
   * Eliminar compra
   */
  function deletePurchase(id) {
    const purchases = getPurchases();
    const filtered = purchases.filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  /**
   * Obtener compras por proveedor
   */
  function getPurchasesBySupplier(supplierId) {
    return getPurchases().filter(p => p.supplierId === supplierId);
  }

  /**
   * Obtener compras por rango de fechas
   */
  function getPurchasesByDateRange(startDate, endDate) {
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    return getPurchases().filter(p => {
      const pDate = new Date(p.createdAt).getTime();
      return pDate >= start && pDate <= end;
    });
  }

  // API Pública
  window.PurchaseManager = {
    createPurchase,
    completePurchase,
    getPurchases,
    getPurchaseById,
    deletePurchase,
    getPurchasesBySupplier,
    getPurchasesByDateRange
  };
})();
