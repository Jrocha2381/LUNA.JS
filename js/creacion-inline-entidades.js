// js/creacion-inline-entidades.js
// Maneja la creación rápida de categorías, proveedores y clientes desde selects

(function() {
    /**
     * Crear modal rápido para nueva entidad
     */
    function crearModalRapido(titulo, placeholder, tipoEntidad, onGuardar) {
        return new Promise((resolve) => {
            // Crear overlay
            const overlay = document.createElement("div");
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 2000;
                display: flex;
                align-items: center;
                justify-content: center;
            `;

            // Crear modal
            const modal = document.createElement("div");
            modal.style.cssText = `
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
                width: 90%;
                max-width: 400px;
                animation: modal-in 0.3s ease;
            `;

            // HTML del modal
            modal.innerHTML = `
                <style>
                    @keyframes modal-in {
                        from { opacity: 0; transform: translateY(-20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                </style>
                <h3 style="margin-bottom: 20px; color: #2c3e50;">${titulo}</h3>
                <div style="margin-bottom: 20px;">
                    <input 
                        type="text" 
                        id="input-rapido" 
                        placeholder="${placeholder}"
                        style="
                            width: 100%;
                            padding: 12px;
                            border: 1px solid #ddd;
                            border-radius: 5px;
                            font-size: 14px;
                        "
                        autofocus
                    />
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="btn-cancelar-rapido" style="
                        padding: 10px 20px;
                        background: #ecf0f1;
                        color: #333;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Cancelar</button>
                    <button id="btn-guardar-rapido" style="
                        padding: 10px 20px;
                        background: #3498db;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-weight: 600;
                    ">Crear</button>
                </div>
            `;

            overlay.appendChild(modal);
            document.body.appendChild(overlay);

            const inputRapido = modal.querySelector("#input-rapido");
            const btnCancelar = modal.querySelector("#btn-cancelar-rapido");
            const btnGuardar = modal.querySelector("#btn-guardar-rapido");

            // Cerrar modal
            const cerrarModal = () => {
                overlay.remove();
                resolve(null);
            };

            // Guardar entidad
            const guardarEntidad = () => {
                const nombre = inputRapido.value.trim();
                if (!nombre) {
                    alert("❌ El nombre no puede estar vacío");
                    return;
                }

                try {
                    const entidad = onGuardar(nombre);
                    overlay.remove();
                    resolve(entidad);
                } catch (error) {
                    alert("❌ Error: " + error.message);
                }
            };

            btnCancelar.addEventListener("click", cerrarModal);
            btnGuardar.addEventListener("click", guardarEntidad);
            inputRapido.addEventListener("keypress", (e) => {
                if (e.key === "Enter") guardarEntidad();
                if (e.key === "Escape") cerrarModal();
            });
        });
    }

    /**
     * Crear select con opción de crear nuevo
     */
    function crearSelectConCreacion(items, tipoEntidad, onSeleccionar) {
        const container = document.createElement("div");
        container.style.cssText = `
            display: flex;
            gap: 10px;
            align-items: center;
        `;

        // Select
        const select = document.createElement("select");
        select.style.cssText = `
            flex: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
            font-family: inherit;
        `;

        // Opción vacía
        const optionVacia = document.createElement("option");
        optionVacia.value = "";
        optionVacia.textContent = `-- Seleccionar ${tipoEntidad} --`;
        select.appendChild(optionVacia);

        // Agregar opciones existentes
        items.forEach(item => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = item.nombre;
            select.appendChild(option);
        });

        // Botón crear nuevo
        const btnCrear = document.createElement("button");
        btnCrear.textContent = "+ Nuevo";
        btnCrear.style.cssText = `
            padding: 10px 15px;
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            white-space: nowrap;
            font-size: 14px;
        `;

        container.appendChild(select);
        container.appendChild(btnCrear);

        // Event listeners
        select.addEventListener("change", () => {
            if (select.value && onSeleccionar) {
                onSeleccionar(select.value);
            }
        });

        btnCrear.addEventListener("click", async () => {
            const titulo = `Crear nuevo ${tipoEntidad}`;
            const placeholder = `Nombre del ${tipoEntidad}`;

            const onGuardar = (nombre) => {
                let entidad;
                if (tipoEntidad === "categoría") {
                    entidad = window.Helpers?.crearCategoriaRapido?.(nombre);
                } else if (tipoEntidad === "proveedor") {
                    entidad = window.Helpers?.crearProveedorRapido?.(nombre);
                } else if (tipoEntidad === "cliente") {
                    entidad = window.Helpers?.crearClienteRapido?.(nombre);
                }

                if (entidad) {
                    // Agregar al select
                    const option = document.createElement("option");
                    option.value = entidad.id;
                    option.textContent = entidad.nombre;
                    select.appendChild(option);
                    select.value = entidad.id;

                    // Disparar evento de cambio
                    const event = new Event("change");
                    select.dispatchEvent(event);

                    return entidad;
                }
                return null;
            };

            await crearModalRapido(titulo, placeholder, tipoEntidad, onGuardar);
        });

        // Exponer métodos del select
        container.getSelect = () => select;
        container.getValor = () => select.value;
        container.setValor = (valor) => {
            select.value = valor;
        };
        container.actualizar = (items) => {
            select.innerHTML = '';
            const optionVacia = document.createElement("option");
            optionVacia.value = "";
            optionVacia.textContent = `-- Seleccionar ${tipoEntidad} --`;
            select.appendChild(optionVacia);

            items.forEach(item => {
                const option = document.createElement("option");
                option.value = item.id;
                option.textContent = item.nombre;
                select.appendChild(option);
            });
        };

        return container;
    }

    /**
     * Generar selector de producto con edición de relaciones
     */
    function crearSelectProductoConRelaciones(onSeleccionar) {
        const container = document.createElement("div");
        container.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        const productos = window.Getters?.getProductosConRelaciones?.() || [];
        const categorias = window.Getters?.getCategorias?.() || [];
        const proveedores = window.Getters?.getProveedores?.() || [];

        // Select de producto
        const selectProducto = document.createElement("select");
        selectProducto.style.cssText = `
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 14px;
        `;

        const optVacia = document.createElement("option");
        optVacia.value = "";
        optVacia.textContent = "-- Seleccionar producto --";
        selectProducto.appendChild(optVacia);

        productos.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.id;
            opt.textContent = `${p.nombre} (${p.categoriaNombre})`;
            selectProducto.appendChild(opt);
        });

        // Select categoría
        const selectCategoria = crearSelectConCreacion(categorias, "categoría", null);
        selectCategoria.style.display = "none";

        // Select proveedor
        const selectProveedor = crearSelectConCreacion(proveedores, "proveedor", null);
        selectProveedor.style.display = "none";

        container.appendChild(selectProducto);
        container.appendChild(selectCategoria);
        container.appendChild(selectProveedor);

        // Cuando se selecciona un producto, mostrar categoría y proveedor
        selectProducto.addEventListener("change", () => {
            const productoId = selectProducto.value;
            if (productoId) {
                const producto = productos.find(p => p.id == productoId);
                if (producto) {
                    selectCategoria.style.display = "flex";
                    selectProveedor.style.display = "flex";
                    selectCategoria.getSelect().value = producto.categoriaId || "";
                    selectProveedor.getSelect().value = producto.proveedorId || "";

                    if (onSeleccionar) {
                        onSeleccionar({
                            id: producto.id,
                            nombre: producto.nombre,
                            categoriaId: producto.categoriaId,
                            proveedorId: producto.proveedorId
                        });
                    }
                }
            } else {
                selectCategoria.style.display = "none";
                selectProveedor.style.display = "none";
            }
        });

        return container;
    }

    // Exponer funciones globalmente
    window.crearModalRapido = crearModalRapido;
    window.crearSelectConCreacion = crearSelectConCreacion;
    window.crearSelectProductoConRelaciones = crearSelectProductoConRelaciones;

    console.log("✅ Módulo de creación inline de entidades cargado");
})();
