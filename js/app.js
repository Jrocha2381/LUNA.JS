/**
 * APP.JS - Lógica principal de la aplicación POS
 * Coordina todos los módulos y maneja la interfaz de usuario
 */

const app = {
  // Estado general
  state: {
    currentEditingItem: null,
    purchaseItems: []
  },

  /**
   * Inicializar la aplicación
   */
  async init() {
    console.log("🚀 Inicializando POS...");

    // Configurar API Service
    APIService.configure({
      enabled: false, // Usar mock data en desarrollo
      useMockData: true
    });

    // Cargar datos iniciales
    await this.loadInitialData();

    // Configurar event listeners
    this.setupEventListeners();

    // Cargar venta actual
    this.updateCartDisplay();
    this.loadOpenSalesDisplay();

    console.log("✅ POS lista");
  },

  /**
   * Cargar datos iniciales
   */
  async loadInitialData() {
    try {
      // Inicializar datos de prueba si no existen
      this.initializeMockData();

      // Cargar productos
      await this.loadProducts();

      // Cargar categorías
      await this.loadCategories();

      // Cargar proveedores
      await this.loadSuppliers();

      // Cargar clientes
      await this.loadClients();

      // Cargar historial de compras
      await this.loadPurchasesHistory();

      // Cargar historial de ventas
      this.loadSalesHistory();
    } catch (error) {
      this.showAlert("Error cargando datos iniciales", "error");
      console.error(error);
    }
  },

  /**
   * Inicializar datos mock para demostración
   */
  initializeMockData() {
    // Productos mock
    const products = [
      { id: "1", name: "Cuaderno A4", price: 2.50, stock: 50, categoryId: "esc" },
      { id: "2", name: "Bolígrafo Azul", price: 0.75, stock: 200, categoryId: "esc" },
      { id: "3", name: "Marcadores x12", price: 5.99, stock: 30, categoryId: "art" },
      { id: "4", name: "Papel Bond 100 hojas", price: 3.50, stock: 100, categoryId: "ofic" },
      { id: "5", name: "Adhesivo Stick", price: 1.25, stock: 80, categoryId: "ofic" },
      { id: "6", name: "Clip Metálico", price: 0.50, stock: 300, categoryId: "ofic" },
      { id: "7", name: "Borrador", price: 0.45, stock: 150, categoryId: "esc" },
      { id: "8", name: "Regla 30cm", price: 1.00, stock: 120, categoryId: "esc" },
      { id: "9", name: "Lápiz HB", price: 0.35, stock: 250, categoryId: "esc" },
      { id: "10", name: "Folder Cartapacio", price: 1.50, stock: 75, categoryId: "ofic" }
    ];

    const categories = [
      { id: "esc", name: "Escolar" },
      { id: "ofic", name: "Oficina" },
      { id: "art", name: "Arte" },
      { id: "pap", name: "Papelería" }
    ];

    const suppliers = [
      { id: "sup1", name: "Distribuidora Central", contact: "Juan García", phone: "+34 912345678", email: "juan@distribuidor.com" },
      { id: "sup2", name: "Papel Industrias SA", contact: "María López", phone: "+34 987654321", email: "maria@papel.com" }
    ];

    const clients = [
      { id: "cli1", name: "Cliente General", email: "", phone: "", address: "" }
    ];

    // Guardar en localStorage si no existen
    if (!localStorage.getItem("luna_productos")) {
      localStorage.setItem("luna_productos", JSON.stringify(products));
    }
    if (!localStorage.getItem("luna_categorias")) {
      localStorage.setItem("luna_categorias", JSON.stringify(categories));
    }
    if (!localStorage.getItem("luna_proveedores")) {
      localStorage.setItem("luna_proveedores", JSON.stringify(suppliers));
    }
    if (!localStorage.getItem("luna_clientes")) {
      localStorage.setItem("luna_clientes", JSON.stringify(clients));
    }
  },

  /**
   * Cargar productos del backend/storage
   */
  async loadProducts() {
    try {
      const products = await APIService.getProducts();
      this.renderProducts(products);
    } catch (error) {
      console.error("Error cargando productos:", error);
      this.showAlert("Error cargando productos", "error");
    }
  },

  /**
   * Renderizar productos en la cuadrícula
   */
  renderProducts(products) {
    const container = document.getElementById("products-container");
    if (!container) return;

    if (products.length === 0) {
      container.innerHTML = '<p class="text-center">No hay productos disponibles</p>';
      return;
    }

    container.innerHTML = products
      .map(product => `
        <div class="product-card" onclick="app.addProductToCart('${product.id}', '${product.name}', ${product.price})">
          <div class="product-name">${product.name}</div>
          <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
          <div class="product-stock">Stock: ${product.stock || 0}</div>
        </div>
      `)
      .join("");
  },

  /**
   * Agregar producto al carrito desde el catálogo
   */
  addProductToCart(id, name, price) {
    try {
      const product = { id, name, price };
      SalesManager.addItem(product, 1);
      this.updateCartDisplay();
      this.showAlert(`${name} agregado al carrito`, "success");
    } catch (error) {
      this.showAlert("Error al agregar producto: " + error.message, "error");
    }
  },

  /**
   * Actualizar visualización del carrito
   */
  updateCartDisplay() {
    const sale = SalesManager.getCurrentSale();
    const container = document.getElementById("cart-container");

    if (!container) return;

    if (sale.items.length === 0) {
      container.innerHTML = '<p class="text-center" style="color: #999; padding: 2rem 0;">Carrito vacío</p>';
    } else {
      container.innerHTML = sale.items
        .map(item => `
          <div class="cart-item">
            <div class="item-info">
              <div class="item-name">${item.productName}</div>
              <div class="item-price">$${item.price.toFixed(2)}</div>
            </div>
            <div class="item-controls">
              <span style="font-weight: 600; min-width: 50px; text-align: center;">
                ${item.quantity}x
              </span>
              <span style="font-weight: 600; color: var(--primary); min-width: 70px; text-align: right;">
                $${item.subtotal.toFixed(2)}
              </span>
            </div>
            <div class="item-actions">
              <button class="btn btn-sm btn-outline" title="Editar" onclick="app.openEditItemModal('${item.productId}', '${item.productName}', ${item.quantity}, ${item.price})">
                ✏️
              </button>
              <button class="btn btn-sm btn-danger" title="Eliminar" onclick="app.removeFromCart('${item.productId}')">
                🗑️
              </button>
            </div>
          </div>
        `)
        .join("");
    }

    // Actualizar totales
    const total = SalesManager.getTotal();
    const discount = parseFloat(document.getElementById("discount-input")?.value || 0);
    const finalTotal = Math.max(0, total - discount);

    const subtotalEl = document.getElementById("subtotal");
    const totalEl = document.getElementById("total");

    if (subtotalEl) subtotalEl.textContent = `$${total.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${finalTotal.toFixed(2)}`;
  },

  /**
   * Abrir modal para editar producto en carrito
   */
  openEditItemModal(productId, productName, quantity, price) {
    this.state.currentEditingItem = { productId, productName, quantity, price };

    document.getElementById("edit-item-name").value = productName;
    document.getElementById("edit-item-quantity").value = quantity;
    document.getElementById("edit-item-price").value = price.toFixed(2);

    document.getElementById("edit-item-modal").classList.add("active");
  },

  /**
   * Cerrar modal de edición
   */
  closeEditModal() {
    document.getElementById("edit-item-modal").classList.remove("active");
    this.state.currentEditingItem = null;
  },

  /**
   * Eliminar producto del carrito
   */
  removeFromCart(productId) {
    try {
      SalesManager.removeItem(productId);
      this.updateCartDisplay();
      this.showAlert("Producto removido del carrito", "success");
    } catch (error) {
      this.showAlert("Error al remover producto", "error");
    }
  },

  /**
   * Limpiar carrito completo
   */
  clearCart() {
    if (confirm("¿Limpiar el carrito?")) {
      SalesManager.clearCart();
      this.updateCartDisplay();
      this.showAlert("Carrito limpiado", "success");
    }
  },

  /**
   * Guardar venta abierta
   */
  saveOpenSale() {
    const sale = SalesManager.getCurrentSale();
    if (sale.items.length === 0) {
      this.showAlert("No hay items en el carrito", "error");
      return;
    }

    try {
      SalesManager.saveOpenSale();
      this.showAlert("Venta guardada exitosamente", "success");
      this.loadOpenSalesDisplay();
    } catch (error) {
      this.showAlert("Error al guardar venta: " + error.message, "error");
    }
  },

  /**
   * Cargar y mostrar ventas abiertas
   */
  loadOpenSalesDisplay() {
    const container = document.getElementById("open-sales-container");
    if (!container) return;

    const openSales = SalesManager.getOpenSales();

    if (openSales.length === 0) {
      container.innerHTML = '<p class="text-center" style="color: #999;">No hay ventas abiertas</p>';
      return;
    }

    container.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Items</th>
            <th>Total</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${openSales
        .map(sale => `
              <tr>
                <td>${new Date(sale.createdAt).toLocaleString()}</td>
                <td>${sale.items.length}</td>
                <td>$${sale.items.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2)}</td>
                <td>
                  <button class="btn btn-sm btn-secondary" onclick="app.loadOpenSale('${sale.id}')">
                    Cargar
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="app.deleteOpenSale('${sale.id}')">
                    Eliminar
                  </button>
                </td>
              </tr>
            `)
        .join("")}
        </tbody>
      </table>
    `;
  },

  /**
   * Cargar una venta abierta existente
   */
  loadOpenSale(saleId) {
    try {
      SalesManager.loadOpenSale(saleId);
      this.updateCartDisplay();
      this.showSection("sales");
      this.showAlert("Venta cargada exitosamente", "success");
    } catch (error) {
      this.showAlert("Error al cargar venta: " + error.message, "error");
    }
  },

  /**
   * Eliminar venta abierta
   */
  deleteOpenSale(saleId) {
    if (confirm("¿Eliminar esta venta abierta?")) {
      try {
        SalesManager.deleteOpenSale(saleId);
        this.loadOpenSalesDisplay();
        this.showAlert("Venta eliminada", "success");
      } catch (error) {
        this.showAlert("Error al eliminar venta", "error");
      }
    }
  },

  /**
   * Abrir modal de pago
   */
  openPaymentModal() {
    const sale = SalesManager.getCurrentSale();
    if (sale.items.length === 0) {
      this.showAlert("El carrito está vacío", "error");
      return;
    }

    const total = SalesManager.getTotal();
    document.getElementById("payment-total").textContent = `$${total.toFixed(2)}`;
    document.getElementById("payment-modal").classList.add("active");
  },

  /**
   * Cerrar modal de pago
   */
  closePaymentModal() {
    document.getElementById("payment-modal").classList.remove("active");
  },

  /**
   * Procesar pago y completar venta
   */
  async processPay(event) {
    event.preventDefault();

    const method = document.getElementById("payment-method").value;
    const discount = parseFloat(document.getElementById("payment-discount").value || 0);

    if (!method) {
      this.showAlert("Selecciona un método de pago", "error");
      return;
    }

    try {
      const completedSale = await SalesManager.completeSale(method, discount);
      this.closePaymentModal();
      this.updateCartDisplay();
      this.loadOpenSalesDisplay();
      this.loadSalesHistory();
      this.showAlert(`¡Venta completada! Total: $${completedSale.total.toFixed(2)}`, "success");
    } catch (error) {
      this.showAlert("Error al completar venta: " + error.message, "error");
    }
  },

  // ========== CATEGORÍAS ==========

  /**
   * Cargar categorías
   */
  async loadCategories() {
    try {
      const categories = await APIService.getCategories();
      this.renderCategiesList(categories);
    } catch (error) {
      console.error("Error cargando categorías:", error);
    }
  },

  /**
   * Renderizar lista de categorías
   */
  renderCategiesList(categories) {
    const container = document.getElementById("categories-list");
    if (!container) return;

    if (categories.length === 0) {
      container.innerHTML = '<p class="text-center">Sin categorías</p>';
      return;
    }

    container.innerHTML = `
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${categories
        .map(cat => `
              <tr>
                <td>${cat.name || ""}</td>
                <td>${cat.description || ""}</td>
                <td>
                  <button class="btn btn-sm btn-danger" onclick="app.deleteCategory('${cat.id}')">
                    Eliminar
                  </button>
                </td>
              </tr>
            `)
        .join("")}
        </tbody>
      </table>
    `;
  },

  /**
   * Crear categoría
   */
  async createCategory(event) {
    event.preventDefault();

    const name = document.getElementById("category-name").value.trim();
    const description = document.getElementById("category-description").value.trim();

    if (!name) {
      this.showAlert("El nombre es requerido", "error");
      return;
    }

    try {
      await APIService.createCategory({ name, description });
      document.getElementById("category-form").reset();
      await this.loadCategories();
      this.showAlert("Categoría creada exitosamente", "success");
    } catch (error) {
      this.showAlert("Error creando categoría: " + error.message, "error");
    }
  },

  /**
   * Eliminar categoría
   */
  async deleteCategory(id) {
    if (confirm("¿Eliminar esta categoría?")) {
      try {
        await APIService.deleteCategory(id);
        this.loadCategories();
        this.showAlert("Categoría eliminada", "success");
      } catch (error) {
        this.showAlert("Error al eliminar categoría", "error");
      }
    }
  },

  // ========== PROVEEDORES ==========

  /**
   * Cargar proveedores
   */
  async loadSuppliers() {
    try {
      const suppliers = await APIService.getSuppliers();
      this.renderSuppliersList(suppliers);
      this.populateSupplierSelect(suppliers);
    } catch (error) {
      console.error("Error cargando proveedores:", error);
    }
  },

  /**
   * Renderizar lista de proveedores
   */
  renderSuppliersList(suppliers) {
    const container = document.getElementById("suppliers-tbody");
    if (!container) return;

    if (suppliers.length === 0) {
      container.innerHTML = '<tr><td colspan="4" class="text-center">Sin proveedores</td></tr>';
      return;
    }

    container.innerHTML = suppliers
      .map(supplier => `
        <tr>
          <td>${supplier.name || ""}</td>
          <td>${supplier.contact || ""}</td>
          <td>${supplier.phone || ""}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="app.deleteSupplier('${supplier.id}')">
              Eliminar
            </button>
          </td>
        </tr>
      `)
      .join("");
  },

  /**
   * Poblar select de proveedores
   */
  populateSupplierSelect(suppliers) {
    const select = document.getElementById("supplier-select");
    if (!select) return;

    select.innerHTML =
      '<option value="">Seleccionar proveedor...</option>' +
      suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join("");
  },

  /**
   * Crear proveedor
   */
  async createSupplier(event) {
    event.preventDefault();

    const name = document.getElementById("supplier-name").value.trim();
    const contact = document.getElementById("supplier-contact").value.trim();
    const phone = document.getElementById("supplier-phone").value.trim();
    const email = document.getElementById("supplier-email").value.trim();

    if (!name) {
      this.showAlert("El nombre es requerido", "error");
      return;
    }

    try {
      await APIService.createSupplier({ name, contact, phone, email });
      document.getElementById("supplier-form").reset();
      await this.loadSuppliers();
      this.showAlert("Proveedor creado exitosamente", "success");
    } catch (error) {
      this.showAlert("Error creando proveedor: " + error.message, "error");
    }
  },

  /**
   * Crear proveedor rápidamente desde compras
   */
  async createQuickSupplier(event) {
    event.preventDefault();

    const name = document.getElementById("quick-supplier-name").value.trim();
    const contact = document.getElementById("quick-supplier-contact").value.trim();

    if (!name) {
      this.showAlert("El nombre es requerido", "error");
      return;
    }

    try {
      const newSupplier = await APIService.createSupplier({ name, contact });
      document.getElementById("quick-supplier-form").reset();
      this.loadSuppliers();
      this.closeSupplierModal();
      this.showAlert("Proveedor creado", "success");
    } catch (error) {
      this.showAlert("Error creando proveedor", "error");
    }
  },

  /**
   * Abrir modal de proveedor
   */
  openSupplierModal() {
    document.getElementById("supplier-modal").classList.add("active");
  },

  /**
   * Cerrar modal de proveedor
   */
  closeSupplierModal() {
    document.getElementById("supplier-modal").classList.remove("active");
    document.getElementById("quick-supplier-form").reset();
  },

  /**
   * Eliminar proveedor
   */
  async deleteSupplier(id) {
    if (confirm("¿Eliminar este proveedor?")) {
      try {
        await APIService.deleteSupplier(id);
        this.loadSuppliers();
        this.showAlert("Proveedor eliminado", "success");
      } catch (error) {
        this.showAlert("Error al eliminar proveedor", "error");
      }
    }
  },

  // ========== CLIENTES ==========

  /**
   * Cargar clientes
   */
  async loadClients() {
    try {
      const clients = await APIService.getClients();
      this.renderClientsList(clients);
    } catch (error) {
      console.error("Error cargando clientes:", error);
    }
  },

  /**
   * Renderizar lista de clientes
   */
  renderClientsList(clients) {
    const container = document.getElementById("clients-tbody");
    if (!container) return;

    if (clients.length === 0) {
      container.innerHTML = '<tr><td colspan="4" class="text-center">Sin clientes</td></tr>';
      return;
    }

    container.innerHTML = clients
      .map(client => `
        <tr>
          <td>${client.name || ""}</td>
          <td>${client.email || ""}</td>
          <td>${client.phone || ""}</td>
          <td>
            <button class="btn btn-sm btn-danger" onclick="app.deleteClient('${client.id}')">
              Eliminar
            </button>
          </td>
        </tr>
      `)
      .join("");
  },

  /**
   * Crear cliente
   */
  async createClient(event) {
    event.preventDefault();

    const name = document.getElementById("client-name").value.trim();
    const email = document.getElementById("client-email").value.trim();
    const phone = document.getElementById("client-phone").value.trim();
    const address = document.getElementById("client-address").value.trim();

    if (!name) {
      this.showAlert("El nombre es requerido", "error");
      return;
    }

    try {
      await APIService.createClient({ name, email, phone, address });
      document.getElementById("client-form").reset();
      this.loadClients();
      this.showAlert("Cliente creado exitosamente", "success");
    } catch (error) {
      this.showAlert("Error creando cliente: " + error.message, "error");
    }
  },

  /**
   * Eliminar cliente
   */
  async deleteClient(id) {
    if (confirm("¿Eliminar este cliente?")) {
      try {
        await APIService.deleteClient(id);
        this.loadClients();
        this.showAlert("Cliente eliminado", "success");
      } catch (error) {
        this.showAlert("Error al eliminar cliente", "error");
      }
    }
  },

  // ========== COMPRAS ==========

  /**
   * Agregar item a compra
   */
  addPurchaseItem() {
    const container = document.getElementById("purchase-items-container");
    const itemIndex = this.state.purchaseItems.length;

    const itemHTML = `
      <div class="purchase-item" id="purchase-item-${itemIndex}">
        <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 100px; gap: 0.5rem; align-items: end;">
          <div class="form-group">
            <label class="form-label">Producto</label>
            <input type="text" class="form-input purchase-product-name" placeholder="Nombre del producto">
          </div>
          <div class="form-group">
            <label class="form-label">Cantidad</label>
            <input type="number" class="form-input purchase-quantity" min="1" value="1">
          </div>
          <div class="form-group">
            <label class="form-label">Costo</label>
            <input type="number" class="form-input purchase-cost" min="0" step="0.01" value="0">
          </div>
          <button type="button" class="btn btn-danger btn-sm" onclick="app.removePurchaseItem(${itemIndex})">
            Quitar
          </button>
        </div>
      </div>
    `;

    container.insertAdjacentHTML("beforeend", itemHTML);
    this.state.purchaseItems.push({ id: itemIndex });
    this.updatePurchaseTotal();
  },

  /**
   * Remover item de compra
   */
  removePurchaseItem(index) {
    document.getElementById(`purchase-item-${index}`).remove();
    this.state.purchaseItems = this.state.purchaseItems.filter(item => item.id !== index);
    this.updatePurchaseTotal();
  },

  /**
   * Actualizar total de compra
   */
  updatePurchaseTotal() {
    const items = document.querySelectorAll(".purchase-item");
    let total = 0;

    items.forEach(item => {
      const quantity = parseFloat(item.querySelector(".purchase-quantity").value || 0);
      const cost = parseFloat(item.querySelector(".purchase-cost").value || 0);
      total += quantity * cost;
    });

    document.getElementById("purchase-total").textContent = `$${total.toFixed(2)}`;
  },

  /**
   * Crear compra
   */
  async createPurchase(event) {
    event.preventDefault();

    const supplierId = document.getElementById("supplier-select").value;
    if (!supplierId) {
      this.showAlert("Selecciona un proveedor", "error");
      return;
    }

    const items = Array.from(document.querySelectorAll(".purchase-item"))
      .map(item => ({
        productName: item.querySelector(".purchase-product-name").value.trim(),
        quantity: parseInt(item.querySelector(".purchase-quantity").value) || 0,
        costPrice: parseFloat(item.querySelector(".purchase-cost").value) || 0
      }))
      .filter(item => item.productName && item.quantity > 0);

    if (items.length === 0) {
      this.showAlert("Agrega al menos un producto", "error");
      return;
    }

    try {
      const suppliers = await APIService.getSuppliers();
      const supplier = suppliers.find(s => s.id === supplierId);

      await PurchaseManager.createPurchase({
        supplierId,
        supplierName: supplier?.name || "",
        items,
        notes: document.getElementById("purchase-notes").value.trim()
      });

      document.getElementById("purchase-form").reset();
      this.state.purchaseItems = [];
      document.getElementById("purchase-items-container").innerHTML = "";
      document.getElementById("purchase-total").textContent = "$0.00";

      this.loadPurchasesHistory();
      this.showAlert("Compra registrada exitosamente", "success");
    } catch (error) {
      this.showAlert("Error registrando compra: " + error.message, "error");
    }
  },

  /**
   * Cargar historial de compras
   */
  loadPurchasesHistory() {
    try {
      const purchases = PurchaseManager.getPurchases();
      this.renderPurchasesHistory(purchases);
    } catch (error) {
      console.error("Error cargando historial de compras:", error);
    }
  },

  /**
   * Renderizar historial de compras
   */
  renderPurchasesHistory(purchases) {
    const tbody = document.getElementById("purchases-history-tbody");
    if (!tbody) return;

    if (purchases.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Sin compras registradas</td></tr>';
      return;
    }

    tbody.innerHTML = purchases
      .map(purchase => `
        <tr>
          <td>${purchase.supplierName}</td>
          <td>${purchase.items.length}</td>
          <td>$${purchase.totalCost.toFixed(2)}</td>
          <td>${new Date(purchase.createdAt).toLocaleDateString()}</td>
          <td><span class="badge badge-${purchase.status === 'completed' ? 'success' : 'warning'}">${purchase.status}</span></td>
          <td>
            ${purchase.status === 'pending' ? `
              <button class="btn btn-sm btn-secondary" onclick="app.completePurchase('${purchase.id}')">
                Completar
              </button>
            ` : ''}
            <button class="btn btn-sm btn-danger" onclick="app.deletePurchase('${purchase.id}')">
              Eliminar
            </button>
          </td>
        </tr>
      `)
      .join("");
  },

  /**
   * Completar compra
   */
  async completePurchase(id) {
    try {
      await PurchaseManager.completePurchase(id);
      this.loadPurchasesHistory();
      this.showAlert("Compra completada", "success");
    } catch (error) {
      this.showAlert("Error completando compra", "error");
    }
  },

  /**
   * Eliminar compra
   */
  deletePurchase(id) {
    if (confirm("¿Eliminar esta compra?")) {
      try {
        PurchaseManager.deletePurchase(id);
        this.loadPurchasesHistory();
        this.showAlert("Compra eliminada", "success");
      } catch (error) {
        this.showAlert("Error eliminando compra", "error");
      }
    }
  },

  // ========== HISTORIAL DE VENTAS ==========

  /**
   * Cargar historial de ventas
   */
  loadSalesHistory() {
    try {
      const sales = SalesManager.getCompletedSales();
      this.renderSalesHistory(sales);
    } catch (error) {
      console.error("Error cargando historial de ventas:", error);
    }
  },

  /**
   * Renderizar historial de ventas
   */
  renderSalesHistory(sales) {
    const tbody = document.getElementById("sales-history-tbody");
    if (!tbody) return;

    if (sales.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">Sin ventas registradas</td></tr>';
      return;
    }

    tbody.innerHTML = sales
      .map(sale => `
        <tr>
          <td>${sale.id.substring(0, 8)}</td>
          <td>${sale.clientName || "Cliente General"}</td>
          <td>${sale.items.length}</td>
          <td>$${sale.total.toFixed(2)}</td>
          <td>${sale.paymentMethod}</td>
          <td>${new Date(sale.completedAt).toLocaleDateString()}</td>
        </tr>
      `)
      .join("");
  },

  // ========== UI UTILITIES ==========

  /**
   * Mostrar/ocultar secciones
   */
  showSection(sectionId) {
    // Ocultar todas las secciones
    document.querySelectorAll(".section").forEach(section => {
      section.classList.remove("active");
    });

    // Mostrar la sección solicitada
    const section = document.getElementById(sectionId);
    if (section) {
      section.classList.add("active");
      window.scrollTo(0, 0);
    }
  },

  /**
   * Mostrar alerta
   */
  showAlert(message, type = "info") {
    const container = document.getElementById("alert-container");
    const alertId = `alert-${Date.now()}`;

    const alertHTML = `
      <div class="alert alert-${type} show" id="${alertId}">
        ${message}
      </div>
    `;

    container.insertAdjacentHTML("afterbegin", alertHTML);

    setTimeout(() => {
      const alert = document.getElementById(alertId);
      if (alert) {
        alert.classList.remove("show");
        setTimeout(() => alert.remove(), 300);
      }
    }, 4000);
  },

  /**
   * Configurar event listeners
   */
  setupEventListeners() {
    // Formularios
    document.getElementById("category-form")?.addEventListener("submit", e => this.createCategory(e));
    document.getElementById("supplier-form")?.addEventListener("submit", e => this.createSupplier(e));
    document.getElementById("client-form")?.addEventListener("submit", e => this.createClient(e));
    document.getElementById("purchase-form")?.addEventListener("submit", e => this.createPurchase(e));
    document.getElementById("payment-form")?.addEventListener("submit", e => this.processPay(e));
    document.getElementById("edit-item-form")?.addEventListener("submit", e => this.saveEditedItem(e));
    document.getElementById("quick-supplier-form")?.addEventListener("submit", e => this.createQuickSupplier(e));

    // Descuento en tiempo real
    document.getElementById("discount-input")?.addEventListener("change", () => this.updateCartDisplay());

    // Actualizar total de compra
    document.addEventListener("input", (e) => {
      if (e.target.classList.contains("purchase-quantity") || e.target.classList.contains("purchase-cost")) {
        this.updatePurchaseTotal();
      }
    });
  },

  /**
   * Guardar item editado
   */
  saveEditedItem(event) {
    event.preventDefault();

    const item = this.state.currentEditingItem;
    if (!item) return;

    const quantity = parseInt(document.getElementById("edit-item-quantity").value) || 1;
    const price = parseFloat(document.getElementById("edit-item-price").value) || 0;

    try {
      SalesManager.editItemQuantity(item.productId, quantity);
      SalesManager.editItemPrice(item.productId, price);
      this.updateCartDisplay();
      this.closeEditModal();
      this.showAlert("Producto actualizado", "success");
    } catch (error) {
      this.showAlert("Error: " + error.message, "error");
    }
  }
};

// Inicializar cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", () => app.init());
