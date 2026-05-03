// js/entidades.js - Gestión de Clientes, Proveedores y Categorías
// IIFE para evitar contaminación global (pero expone window.Entidades)

(function() {
const ENTIDADES_CONFIG = {
    clientes: {
        key: "pos_clientes",
        route: "clientes",
        campos: ['id', 'nombre', 'telefono', 'email']
    },
    proveedores: {
        key: "pos_proveedores",
        route: "proveedores",
        campos: ['id', 'nombre', 'contacto']
    },
    categorias: {
        key: "pos_categorias",
        route: "categorias",
        campos: ['id', 'nombre']
    }
};

const Entidades = {
    obtener(tipo) {
        const config = ENTIDADES_CONFIG[tipo];
        if (!config) return [];
        return JSON.parse(localStorage.getItem(config.key) || "[]");
    },

    async sincronizar(tipo) {
        const config = ENTIDADES_CONFIG[tipo];
        if (!config || !window.Backend || !window.Backend.isEnabled || !window.Backend.isEnabled()) {
            return this.obtener(tipo);
        }
        try {
            console.log(`🔄 Sincronizando ${tipo}...`);
            const datos = await window.Backend.get(config.route);
            if (Array.isArray(datos)) {
                localStorage.setItem(config.key, JSON.stringify(datos));
                console.log(`✅ ${tipo} sincronizados:`, datos.length, 'registros');
                return datos;
            }
        } catch (e) {
            console.error(`❌ Error sincronizando ${tipo}:`, e);
        }
        return this.obtener(tipo);
    },

    async crear(tipo, data) {
        const config = ENTIDADES_CONFIG[tipo];
        if (!config) return null;

        const lista = this.obtener(tipo);

        // Generar ID según el tipo
        let nuevoId = this._generarId(tipo);
        const nuevo = { id: nuevoId, ...data };

        lista.push(nuevo);
        localStorage.setItem(config.key, JSON.stringify(lista));

        // Sincronizar con backend (si está habilitado)
        if (window.Backend && window.Backend.isEnabled && window.Backend.isEnabled()) {
            try {
                await window.Backend.post(config.route, { action: 'create', data: nuevo });
                console.log(`✅ ${tipo} creado:`, nuevo);
            } catch (e) {
                console.error(`❌ Error al crear ${tipo} en API:`, e);
            }
        }
        return nuevo;
    },

    async actualizar(tipo, id, cambios) {
        const config = ENTIDADES_CONFIG[tipo];
        if (!config) return;

        let lista = this.obtener(tipo);
        const index = lista.findIndex(item => item.id == id || String(item.id) === String(id));

        if (index === -1) {
            console.warn(`⚠️ ${tipo} con ID ${id} no encontrado`);
            return;
        }

        lista[index] = { ...lista[index], ...cambios };
        localStorage.setItem(config.key, JSON.stringify(lista));

        // Sincronizar con backend (si está habilitado)
        if (window.Backend && window.Backend.isEnabled && window.Backend.isEnabled()) {
            try {
                await window.Backend.post(config.route, {
                    action: 'update',
                    id: lista[index].id,
                    data: lista[index]
                });
                console.log(`✅ ${tipo} actualizado:`, lista[index]);
            } catch (e) {
                console.error(`❌ Error al actualizar ${tipo} en API:`, e);
            }
        }
    },

    async eliminar(tipo, id) {
        const config = ENTIDADES_CONFIG[tipo];
        if (!config) return;

        let lista = this.obtener(tipo);
        const itemAEliminar = lista.find(item => item.id == id || String(item.id) === String(id));
        lista = lista.filter(item => item.id != id && String(item.id) !== String(id));

        localStorage.setItem(config.key, JSON.stringify(lista));

        // Sincronizar con backend (si está habilitado)
        if (window.Backend && window.Backend.isEnabled && window.Backend.isEnabled() && itemAEliminar) {
            try {
                await window.Backend.post(config.route, {
                    action: 'delete',
                    id: itemAEliminar.id
                });
                console.log(`✅ ${tipo} eliminado:`, itemAEliminar.id);
            } catch (e) {
                console.error(`❌ Error al eliminar ${tipo} en API:`, e);
            }
        }
    },

    buscar(tipo, termino) {
        const lista = this.obtener(tipo);
        const t = termino.toLowerCase();
        return lista.filter(item =>
            (item.nombre && item.nombre.toLowerCase().includes(t)) ||
            (item.contacto && item.contacto.toLowerCase().includes(t)) ||
            (item.correo && item.correo.toLowerCase().includes(t)) ||
            (item.email && item.email.toLowerCase().includes(t)) ||
            (item.telefono && item.telefono.includes(t))
        );
    },

    _generarId(tipo) {
        const prefijo = tipo === 'clientes' ? 'CLI-' :
            tipo === 'proveedores' ? 'PROV-' :
                tipo === 'categorias' ? 'CAT-' : 'GEN-';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
        return `${prefijo}${timestamp}${random}`;
    }
};

// Exponer globalmente
window.Entidades = Entidades;

// Sincronización automática al cargar el módulo
const sincronizarTodo = async () => {
    if (!window.Backend || !window.Backend.isEnabled || !window.Backend.isEnabled()) return;
    console.log("🔄 Iniciando sincronización de entidades...");
    await Promise.all([
        Entidades.sincronizar('clientes'),
        Entidades.sincronizar('proveedores'),
        Entidades.sincronizar('categorias')
    ]);
    console.log("✅ Entidades sincronizadas.");
};

sincronizarTodo();
})();
