// js/entidades.js - Gestión de Clientes, Proveedores y Categorías

const ENTIDADES_CONFIG = {
    clientes: { key: "pos_clientes", route: "clientes" },
    proveedores: { key: "pos_proveedores", route: "proveedores" },
    categorias: { key: "pos_categorias", route: "categorias" }
};

export const Entidades = {
    obtener(tipo) {
        const config = ENTIDADES_CONFIG[tipo];
        return JSON.parse(localStorage.getItem(config.key) || "[]");
    },

    async sincronizar(tipo) {
        const config = ENTIDADES_CONFIG[tipo];
        if (!window.API) return;
        try {
            const datos = await window.API.get(config.route);
            localStorage.setItem(config.key, JSON.stringify(datos));
            return datos;
        } catch (e) {
            console.error(`Error sincronizando ${tipo}`, e);
        }
    },

    async crear(tipo, data) {
        const config = ENTIDADES_CONFIG[tipo];
        const lista = this.obtener(tipo);
        const nuevo = { id: Date.now(), ...data };
        lista.push(nuevo);
        localStorage.setItem(config.key, JSON.stringify(lista));

        if (window.API) {
            await window.API.post(config.route, { action: 'create', data: nuevo });
        }
        return nuevo;
    },

    async actualizar(tipo, id, cambios) {
        const config = ENTIDADES_CONFIG[tipo];
        let lista = this.obtener(tipo);
        const index = lista.findIndex(item => item.id == id);
        if (index === -1) return;

        lista[index] = { ...lista[index], ...cambios };
        localStorage.setItem(config.key, JSON.stringify(lista));

        if (window.API) {
            await window.API.post(config.route, { action: 'update', id, data: cambios });
        }
    },

    async eliminar(tipo, id) {
        const config = ENTIDADES_CONFIG[tipo];
        let lista = this.obtener(tipo);
        lista = lista.filter(item => item.id != id);
        localStorage.setItem(config.key, JSON.stringify(lista));

        if (window.API) {
            await window.API.post(config.route, { action: 'delete', id });
        }
    },

    buscar(tipo, termino) {
        const lista = this.obtener(tipo);
        const t = termino.toLowerCase();
        return lista.filter(item =>
            (item.nombre && item.nombre.toLowerCase().includes(t)) ||
            (item.email && item.email.toLowerCase().includes(t)) ||
            (item.documento && item.documento.includes(t))
        );
    }
};

// Exponer globalmente inmediatamente antes de la sincronización
window.Entidades = Entidades;

// Sincronización automática al cargar el módulo
const sincronizarTodo = async () => {
    console.log("🔄 Iniciando sincronización de entidades...");
    await Promise.all([
        Entidades.sincronizar('clientes'),
        Entidades.sincronizar('proveedores'),
        Entidades.sincronizar('categorias')
    ]);
    console.log("✅ Entidades sincronizadas.");
};

sincronizarTodo();