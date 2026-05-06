/**
 * Sales Manager - Gestión completa del flujo de ventas
 * - Agregar productos al carrito
 * - Editar cantidades y precios
 * - Guardar ventas abiertas (sesiones sin finalizar)
 * - Completar ventas
 */

(function () {
  const STORAGE_KEY = "luna_open_sales";
  const SALES_KEY = "luna_completed_sales";

  let currentSale = {
    id: null,
    items: [],
    clientId: null,
    clientName: "",
    createdAt: null,
    updatedAt: null,
    metadata: {}
  };

  /**
   * Inicializar una nueva venta
   */
  function initNewSale(clientId = null, clientName = "") {
    currentSale = {
      id: Date.now().toString(),
      items: [],
      clientId,
      clientName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      metadata: {}
    };
    saveCurrentSale();
    return { ...currentSale };
  }

  /**
   * Agregar producto al carrito
   */
  function addItem(product, quantity = 1, customPrice = null) {
    if (!product || !product.id) {
      throw new Error("Producto inválido");
    }

    const price = customPrice || product.price || 0;
    const existingItem = currentSale.items.find(item => item.productId === product.id);

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.subtotal = existingItem.quantity * existingItem.price;
    } else {
      currentSale.items.push({
        productId: product.id,
        productName: product.name,
        price,
        quantity,
        subtotal: quantity * price,
        product: { ...product }
      });
    }

    currentSale.updatedAt = new Date().toISOString();
    saveCurrentSale();
    return { ...currentSale };
  }

  /**
   * Editar cantidad de un producto en el carrito
   */
  function editItemQuantity(productId, newQuantity) {
    if (newQuantity <= 0) {
      return removeItem(productId);
    }

    const item = currentSale.items.find(item => item.productId === productId);
    if (!item) {
      throw new Error("Producto no encontrado en el carrito");
    }

    item.quantity = newQuantity;
    item.subtotal = newQuantity * item.price;
    currentSale.updatedAt = new Date().toISOString();
    saveCurrentSale();
    return { ...currentSale };
  }

  /**
   * Editar precio de un producto en el carrito
   */
  function editItemPrice(productId, newPrice) {
    if (newPrice < 0) {
      throw new Error("Precio no puede ser negativo");
    }

    const item = currentSale.items.find(item => item.productId === productId);
    if (!item) {
      throw new Error("Producto no encontrado en el carrito");
    }

    item.price = newPrice;
    item.subtotal = item.quantity * newPrice;
    currentSale.updatedAt = new Date().toISOString();
    saveCurrentSale();
    return { ...currentSale };
  }

  /**
   * Eliminar producto del carrito
   */
  function removeItem(productId) {
    currentSale.items = currentSale.items.filter(item => item.productId !== productId);
    currentSale.updatedAt = new Date().toISOString();
    saveCurrentSale();
    return { ...currentSale };
  }

  /**
   * Vaciar carrito
   */
  function clearCart() {
    currentSale.items = [];
    currentSale.updatedAt = new Date().toISOString();
    saveCurrentSale();
    return { ...currentSale };
  }

  /**
   * Obtener total de la venta
   */
  function getTotal() {
    return currentSale.items.reduce((sum, item) => sum + item.subtotal, 0);
  }

  /**
   * Guardar venta abierta (sin finalizar)
   */
  function saveOpenSale() {
    const openSales = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const existingIndex = openSales.findIndex(sale => sale.id === currentSale.id);

    if (existingIndex >= 0) {
      openSales[existingIndex] = { ...currentSale };
    } else {
      openSales.push({ ...currentSale });
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(openSales));
    return { ...currentSale };
  }

  /**
   * Obtener todas las ventas abiertas
   */
  function getOpenSales() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  }

  /**
   * Cargar una venta abierta
   */
  function loadOpenSale(saleId) {
    const openSales = getOpenSales();
    const sale = openSales.find(s => s.id === saleId);

    if (!sale) {
      throw new Error("Venta abierta no encontrada");
    }

    currentSale = { ...sale };
    return { ...currentSale };
  }

  /**
   * Eliminar una venta abierta
   */
  function deleteOpenSale(saleId) {
    const openSales = getOpenSales();
    const filtered = openSales.filter(s => s.id !== saleId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  }

  /**
   * Completar venta (registrar como finalizada)
   */
  async function completeSale(paymentMethod = "efectivo", discount = 0) {
    if (currentSale.items.length === 0) {
      throw new Error("No hay productos en el carrito");
    }

    const total = getTotal();
    const finalAmount = total - discount;

    if (finalAmount < 0) {
      throw new Error("Descuento no puede ser mayor al total");
    }

    const completedSale = {
      ...currentSale,
      paymentMethod,
      discount,
      total: finalAmount,
      completedAt: new Date().toISOString(),
      status: "completed"
    };

    try {
      // Intentar registrar en la API
      const result = await APIService.createSale(completedSale);
      console.log("Venta registrada en API:", result);
    } catch (error) {
      console.warn("No se pudo registrar en API, guardando localmente:", error);
    }

    // Guardar localmente
    const completedSales = JSON.parse(localStorage.getItem(SALES_KEY) || "[]");
    completedSales.push(completedSale);
    localStorage.setItem(SALES_KEY, JSON.stringify(completedSales));

    // Eliminar de ventas abiertas si existía
    deleteOpenSale(currentSale.id);

    // Limpiar carrito
    initNewSale();

    return completedSale;
  }

  /**
   * Obtener historial de ventas completadas
   */
  function getCompletedSales() {
    return JSON.parse(localStorage.getItem(SALES_KEY) || "[]");
  }

  /**
   * Obtener carrito actual
   */
  function getCurrentSale() {
    return { ...currentSale };
  }

  /**
   * Guardar datos del carrito en localStorage
   */
  function saveCurrentSale() {
    try {
      localStorage.setItem("luna_current_sale", JSON.stringify(currentSale));
    } catch (e) {
      console.error("Error al guardar venta actual:", e);
    }
  }

  /**
   * Cargar carrito guardado
   */
  function loadCurrentSale() {
    try {
      const saved = localStorage.getItem("luna_current_sale");
      if (saved) {
        currentSale = JSON.parse(saved);
      }
    } catch (e) {
      console.error("Error al cargar venta actual:", e);
      initNewSale();
    }
  }

  // Cargar en inicialización
  loadCurrentSale();

  // API Pública
  window.SalesManager = {
    initNewSale,
    addItem,
    editItemQuantity,
    editItemPrice,
    removeItem,
    clearCart,
    getTotal,
    saveOpenSale,
    getOpenSales,
    loadOpenSale,
    deleteOpenSale,
    completeSale,
    getCompletedSales,
    getCurrentSale
  };
})();
