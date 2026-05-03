// js/entidades-relaciones.js
// Gestión de relaciones entre entidades (Productos ↔ Categorías/Proveedores, Ventas ↔ Clientes, etc)

(function() {
    /**
     * RESOLVERS - Obtener nombres desde IDs
     */
    const Resolvers = {
        // Obtener categoría por ID
        getCategoria(categoriaId) {
            if (!categoriaId) return null;
            const categorias = window.Entidades?.obtener?.('categorias') || [];
            return categorias.find(c => c.id == categoriaId) || null;
        },

        // Obtener nombre de categoría por ID
        getNombreCategoria(categoriaId) {
            const categoria = this.getCategoria(categoriaId);
            return categoria?.nombre || 'Sin categoría';
        },

        // Obtener proveedor por ID
        getProveedor(proveedorId) {
            if (!proveedorId) return null;
            const proveedores = window.Entidades?.obtener?.('proveedores') || [];
            return proveedores.find(p => p.id == proveedorId) || null;
        },

        // Obtener nombre de proveedor por ID
        getNombreProveedor(proveedorId) {
            const proveedor = this.getProveedor(proveedorId);
            return proveedor?.nombre || 'Sin proveedor';
        },

        // Obtener cliente por ID
        getCliente(clienteId) {
            if (!clienteId) return null;
            const clientes = window.Entidades?.obtener?.('clientes') || [];
            return clientes.find(c => c.id == clienteId) || null;
        },

        // Obtener nombre de cliente por ID
        getNombreCliente(clienteId) {
            const cliente = this.getCliente(clienteId);
            return cliente?.nombre || 'Cliente sin identificar';
        }
    };

    /**
     * GETTERS - Obtener listas de entidades
     */
    const Getters = {
        getCategorias() {
            return window.Entidades?.obtener?.('categorias') || [];
        },

        getProveedores() {
            return window.Entidades?.obtener?.('proveedores') || [];
        },

        getClientes() {
            return window.Entidades?.obtener?.('clientes') || [];
        },

        getProductosConRelaciones() {
            const productos = window.obtenerProductos?.() || [];
            return productos.map(p => ({
                ...p,
                categoriaNombre: Resolvers.getNombreCategoria(p.categoriaId),
                proveedorNombre: Resolvers.getNombreProveedor(p.proveedorId)
            }));
        }
    };

    /**
     * ACTUALIZADORES - Actualizar estructuras con relaciones
     */
    const Actualizadores = {
        // Actualizar producto con categoría y proveedor
        actualizarProductoConRelaciones(productoId, cambios) {
            const productos = window.obtenerProductos?.() || [];
            const index = productos.findIndex(p => p.id == productoId);
            
            if (index < 0) throw new Error("Producto no encontrado");

            const productoActualizado = {
                ...productos[index],
                ...cambios,
                categoriaId: cambios.categoriaId || productos[index].categoriaId,
                proveedorId: cambios.proveedorId || productos[index].proveedorId
            };

            productos[index] = productoActualizado;
            window.guardarProductos?.(productos);
            
            window.dispatchEvent(new CustomEvent("productoActualizadoConRelaciones", { 
                detail: productoActualizado 
            }));

            return productoActualizado;
        },

        // Actualizar venta con cliente
        actualizarVentaConCliente(ventaId, clienteId) {
            const venta = window.obtenerVentaAbierta?.(ventaId);
            if (!venta) throw new Error("Venta no encontrada");

            venta.clienteId = clienteId;
            venta.clienteNombre = Resolvers.getNombreCliente(clienteId);
            venta.ultimaEdicion = new Date().toLocaleString('es-CO');

            const ventas = window.obtenerVentasAbiertas?.() || [];
            const index = ventas.findIndex(v => v.id === ventaId);
            if (index >= 0) {
                ventas[index] = venta;
                window.guardarVentasAbiertas?.(ventas);
            }

            window.dispatchEvent(new CustomEvent("ventaActualizadaConCliente", { 
                detail: venta 
            }));

            return venta;
        },

        // Actualizar compra con proveedor
        actualizarCompraConProveedor(compraId, proveedorId) {
            const compras = JSON.parse(localStorage.getItem("compras") || "[]");
            const index = compras.findIndex(c => c.id === compraId);

            if (index < 0) throw new Error("Compra no encontrada");

            compras[index].proveedorId = proveedorId;
            compras[index].proveedorNombre = Resolvers.getNombreProveedor(proveedorId);

            localStorage.setItem("compras", JSON.stringify(compras));

            window.dispatchEvent(new CustomEvent("compraActualizadaConProveedor", { 
                detail: compras[index] 
            }));

            return compras[index];
        }
    };

    /**
     * HELPERS - Utilidades para crear/validar
     */
    const Helpers = {
        // Crear categoría rápido
        crearCategoriaRapido(nombre) {
            if (!nombre || !nombre.trim()) {
                throw new Error("El nombre de la categoría es requerido");
            }
            return window.AdminCRUD?.crearCategoria?.({ nombre: nombre.trim() });
        },

        // Crear proveedor rápido
        crearProveedorRapido(nombre) {
            if (!nombre || !nombre.trim()) {
                throw new Error("El nombre del proveedor es requerido");
            }
            return window.AdminCRUD?.crearProveedor?.({ 
                nombre: nombre.trim(),
                contacto: "",
                telefono: "",
                email: ""
            });
        },

        // Crear cliente rápido
        crearClienteRapido(nombre) {
            if (!nombre || !nombre.trim()) {
                throw new Error("El nombre del cliente es requerido");
            }
            return window.AdminCRUD?.crearCliente?.({
                nombre: nombre.trim(),
                telefono: "",
                email: ""
            });
        },

        // Validar que producto tenga categoría y proveedor
        validarProductoConRelaciones(producto) {
            const errores = [];

            if (!producto.nombre || !producto.nombre.trim()) {
                errores.push("Nombre de producto requerido");
            }
            if (!product.precioVenta || Number(producto.precioVenta) <= 0) {
                errores.push("Precio de venta inválido");
            }
            if (!producto.categoriaId) {
                errores.push("Debe seleccionar una categoría");
            }
            if (!producto.proveedorId) {
                errores.push("Debe seleccionar un proveedor");
            }

            return errores;
        }
    };

    /**
     * SINCRONIZADORES - Mantener datos consistentes
     */
    const Sincronizadores = {
        // Cuando se actualiza una categoría, propagar cambios
        sincronizarActualizacionCategoria(categoriaId) {
            const productos = window.obtenerProductos?.() || [];
            const productosConCategoria = productos.filter(p => p.categoriaId == categoriaId);

            productosConCategoria.forEach(p => {
                p.categoriaNombre = Resolvers.getNombreCategoria(categoriaId);
            });

            if (productosConCategoria.length > 0) {
                window.guardarProductos?.(productos);
            }

            window.dispatchEvent(new CustomEvent("categoriaPropagada", { 
                detail: { categoriaId, productosAfectados: productosConCategoria.length }
            }));
        },

        // Cuando se actualiza un proveedor, propagar cambios
        sincronizarActualizacionProveedor(proveedorId) {
            const productos = window.obtenerProductos?.() || [];
            const productosConProveedor = productos.filter(p => p.proveedorId == proveedorId);

            productosConProveedor.forEach(p => {
                p.proveedorNombre = Resolvers.getNombreProveedor(proveedorId);
            });

            if (productosConProveedor.length > 0) {
                window.guardarProductos?.(productos);
            }

            window.dispatchEvent(new CustomEvent("proveedorPropagado", { 
                detail: { proveedorId, productosAfectados: productosConProveedor.length }
            }));
        },

        // Cuando se actualiza un cliente, propagar cambios
        sincronizarActualizacionCliente(clienteId) {
            const ventas = window.obtenerVentasAbiertas?.() || [];
            const ventasConCliente = ventas.filter(v => v.clienteId == clienteId);

            ventasConCliente.forEach(v => {
                v.clienteNombre = Resolvers.getNombreCliente(clienteId);
            });

            if (ventasConCliente.length > 0) {
                window.guardarVentasAbiertas?.(ventas);
            }

            window.dispatchEvent(new CustomEvent("clientePropagado", { 
                detail: { clienteId, ventasAfectadas: ventasConCliente.length }
            }));
        }
    };

    // Exponer globalmente
    window.Resolvers = Resolvers;
    window.Getters = Getters;
    window.Actualizadores = Actualizadores;
    window.Helpers = Helpers;
    window.Sincronizadores = Sincronizadores;

    // Escuchar cambios en entidades para sincronizar
    window.addEventListener("categoriaActualizada", (e) => {
        Sincronizadores.sincronizarActualizacionCategoria(e.detail.id);
    });

    window.addEventListener("proveedorActualizado", (e) => {
        Sincronizadores.sincronizarActualizacionProveedor(e.detail.id);
    });

    window.addEventListener("clienteActualizado", (e) => {
        Sincronizadores.sincronizarActualizacionCliente(e.detail.id);
    });

    console.log("✅ Módulo de relaciones de entidades cargado");
})();
