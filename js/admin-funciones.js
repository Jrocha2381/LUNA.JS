// js/admin-funciones.js
// CRUD centralizado para entidades + gestión de ventas abiertas

(function() {
    /**
     * CRUD genérico para entidades (clientes, proveedores, categorías)
     */
    const AdminCRUD = {
        // ======= CLIENTES =======
        crearCliente(datos) {
            if (!datos.nombre || !datos.nombre.trim()) {
                throw new Error("El nombre del cliente es requerido");
            }
            const cliente = {
                id: `CLI-${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                nombre: datos.nombre.trim(),
                telefono: datos.telefono || "",
                email: datos.email || ""
            };
            
            const clientes = window.Entidades.obtener('clientes');
            clientes.push(cliente);
            localStorage.setItem("pos_clientes", JSON.stringify(clientes));
            
            window.dispatchEvent(new CustomEvent("clienteCreado", { detail: cliente }));
            return cliente;
        },

        listarClientes() {
            return window.Entidades.obtener('clientes');
        },

        buscarClientes(termino) {
            return window.Entidades.buscar('clientes', termino);
        },

        actualizarCliente(id, cambios) {
            if (!cambios.nombre || !cambios.nombre.trim()) {
                throw new Error("El nombre del cliente es requerido");
            }
            const clientes = window.Entidades.obtener('clientes');
            const index = clientes.findIndex(c => c.id === id);
            if (index < 0) throw new Error("Cliente no encontrado");
            
            clientes[index] = {
                ...clientes[index],
                nombre: cambios.nombre.trim(),
                telefono: cambios.telefono || "",
                email: cambios.email || ""
            };
            localStorage.setItem("pos_clientes", JSON.stringify(clientes));
            window.dispatchEvent(new CustomEvent("clienteActualizado", { detail: clientes[index] }));
            return clientes[index];
        },

        eliminarCliente(id) {
            const clientes = window.Entidades.obtener('clientes');
            const clienteEliminado = clientes.find(c => c.id === id);
            const nuevaLista = clientes.filter(c => c.id !== id);
            
            if (nuevaLista.length === clientes.length) {
                throw new Error("Cliente no encontrado");
            }
            localStorage.setItem("pos_clientes", JSON.stringify(nuevaLista));
            window.dispatchEvent(new CustomEvent("clienteEliminado", { detail: clienteEliminado }));
            return true;
        },

        // ======= PROVEEDORES =======
        crearProveedor(datos) {
            if (!datos.nombre || !datos.nombre.trim()) {
                throw new Error("El nombre del proveedor es requerido");
            }
            const proveedor = {
                id: `PROV-${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                nombre: datos.nombre.trim(),
                contacto: datos.contacto || "",
                telefono: datos.telefono || "",
                email: datos.email || ""
            };
            
            const proveedores = window.Entidades.obtener('proveedores');
            proveedores.push(proveedor);
            localStorage.setItem("pos_proveedores", JSON.stringify(proveedores));
            
            window.dispatchEvent(new CustomEvent("proveedorCreado", { detail: proveedor }));
            return proveedor;
        },

        listarProveedores() {
            return window.Entidades.obtener('proveedores');
        },

        buscarProveedores(termino) {
            return window.Entidades.buscar('proveedores', termino);
        },

        actualizarProveedor(id, cambios) {
            if (!cambios.nombre || !cambios.nombre.trim()) {
                throw new Error("El nombre del proveedor es requerido");
            }
            const proveedores = window.Entidades.obtener('proveedores');
            const index = proveedores.findIndex(p => p.id === id);
            if (index < 0) throw new Error("Proveedor no encontrado");
            
            proveedores[index] = {
                ...proveedores[index],
                nombre: cambios.nombre.trim(),
                contacto: cambios.contacto || "",
                telefono: cambios.telefono || "",
                email: cambios.email || ""
            };
            localStorage.setItem("pos_proveedores", JSON.stringify(proveedores));
            window.dispatchEvent(new CustomEvent("proveedorActualizado", { detail: proveedores[index] }));
            return proveedores[index];
        },

        eliminarProveedor(id) {
            const proveedores = window.Entidades.obtener('proveedores');
            const proveedorEliminado = proveedores.find(p => p.id === id);
            const nuevaLista = proveedores.filter(p => p.id !== id);
            
            if (nuevaLista.length === proveedores.length) {
                throw new Error("Proveedor no encontrado");
            }
            localStorage.setItem("pos_proveedores", JSON.stringify(nuevaLista));
            window.dispatchEvent(new CustomEvent("proveedorEliminado", { detail: proveedorEliminado }));
            return true;
        },

        // ======= CATEGORÍAS =======
        crearCategoria(datos) {
            if (!datos.nombre || !datos.nombre.trim()) {
                throw new Error("El nombre de la categoría es requerido");
            }
            const categoria = {
                id: `CAT-${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                nombre: datos.nombre.trim()
            };
            
            const categorias = window.Entidades.obtener('categorias');
            categorias.push(categoria);
            localStorage.setItem("pos_categorias", JSON.stringify(categorias));
            
            window.dispatchEvent(new CustomEvent("categoriaCreada", { detail: categoria }));
            return categoria;
        },

        listarCategorias() {
            return window.Entidades.obtener('categorias');
        },

        buscarCategorias(termino) {
            return window.Entidades.buscar('categorias', termino);
        },

        actualizarCategoria(id, cambios) {
            if (!cambios.nombre || !cambios.nombre.trim()) {
                throw new Error("El nombre de la categoría es requerido");
            }
            const categorias = window.Entidades.obtener('categorias');
            const index = categorias.findIndex(c => c.id === id);
            if (index < 0) throw new Error("Categoría no encontrada");
            
            categorias[index] = {
                ...categorias[index],
                nombre: cambios.nombre.trim()
            };
            localStorage.setItem("pos_categorias", JSON.stringify(categorias));
            window.dispatchEvent(new CustomEvent("categoriaActualizada", { detail: categorias[index] }));
            return categorias[index];
        },

        eliminarCategoria(id) {
            const categorias = window.Entidades.obtener('categorias');
            const categoriaEliminada = categorias.find(c => c.id === id);
            const nuevaLista = categorias.filter(c => c.id !== id);
            
            if (nuevaLista.length === categorias.length) {
                throw new Error("Categoría no encontrada");
            }
            localStorage.setItem("pos_categorias", JSON.stringify(nuevaLista));
            window.dispatchEvent(new CustomEvent("categoriaEliminada", { detail: categoriaEliminada }));
            return true;
        },

        // ======= GESTIÓN DE VENTAS ABIERTAS =======
        listarVentasAbiertas() {
            return window.obtenerVentasAbiertas();
        },

        obtenerVentaAbierta(ventaId) {
            return window.obtenerVentaAbierta(ventaId);
        },

        calcularTotalVenta(venta) {
            if (!venta || !venta.items) return 0;
            return venta.items.reduce((sum, item) => sum + (item.precioVenta * item.cantidad), 0);
        }
    };

    window.AdminCRUD = AdminCRUD;
})();
