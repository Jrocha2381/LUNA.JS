// js/entidades-global.js
// Versión sin ES Modules para funcionar incluso abriendo con file://
// Fuente principal: localStorage. Sincroniza con `window.Backend` si está habilitado.

(function () {
  const ENTIDADES_CONFIG = {
    clientes: {
      key: "pos_clientes",
      route: "clientes",
      campos: ["id", "nombre", "telefono", "correo"]
    },
    proveedores: {
      key: "pos_proveedores",
      route: "proveedores",
      campos: ["id", "nombre", "contacto"]
    },
    categorias: {
      key: "pos_categorias",
      route: "categorias",
      campos: ["id", "nombre"]
    }
  };

  function backendHabilitado() {
    return Boolean(window.Backend && window.Backend.isEnabled && window.Backend.isEnabled());
  }

  const Entidades = {
    obtener(tipo) {
      const config = ENTIDADES_CONFIG[tipo];
      if (!config) return [];
      try {
        const lista = JSON.parse(localStorage.getItem(config.key) || "[]");
        return Array.isArray(lista) ? lista : [];
      } catch (e) {
        return [];
      }
    },

    async sincronizar(tipo) {
      const config = ENTIDADES_CONFIG[tipo];
      if (!config) return [];
      if (!backendHabilitado()) return this.obtener(tipo);
      try {
        const datos = await window.Backend.get(config.route);
        if (Array.isArray(datos)) {
          localStorage.setItem(config.key, JSON.stringify(datos));
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
      const nuevoId = this._generarId(tipo);
      const nuevo = { id: nuevoId, ...data };

      lista.push(nuevo);
      localStorage.setItem(config.key, JSON.stringify(lista));

      if (backendHabilitado()) {
        try {
          await window.Backend.post(config.route, { action: "create", data: nuevo });
        } catch (e) {
          console.error(`❌ Error al crear ${tipo} en backend:`, e);
        }
      }

      return nuevo;
    },

    async actualizar(tipo, id, cambios) {
      const config = ENTIDADES_CONFIG[tipo];
      if (!config) return;

      const lista = this.obtener(tipo);
      const index = lista.findIndex((item) => String(item.id) === String(id));
      if (index === -1) return;

      lista[index] = { ...lista[index], ...cambios };
      localStorage.setItem(config.key, JSON.stringify(lista));

      if (backendHabilitado()) {
        try {
          await window.Backend.post(config.route, {
            action: "update",
            id: lista[index].id,
            data: lista[index]
          });
        } catch (e) {
          console.error(`❌ Error al actualizar ${tipo} en backend:`, e);
        }
      }
    },

    async eliminar(tipo, id) {
      const config = ENTIDADES_CONFIG[tipo];
      if (!config) return;

      const lista = this.obtener(tipo);
      const itemAEliminar = lista.find((item) => String(item.id) === String(id));
      const nueva = lista.filter((item) => String(item.id) !== String(id));
      localStorage.setItem(config.key, JSON.stringify(nueva));

      if (backendHabilitado() && itemAEliminar) {
        try {
          await window.Backend.post(config.route, { action: "delete", id: itemAEliminar.id });
        } catch (e) {
          console.error(`❌ Error al eliminar ${tipo} en backend:`, e);
        }
      }
    },

    buscar(tipo, termino) {
      const lista = this.obtener(tipo);
      const t = String(termino || "").toLowerCase();
      return lista.filter((item) => {
        return (
          (item.nombre && String(item.nombre).toLowerCase().includes(t)) ||
          (item.contacto && String(item.contacto).toLowerCase().includes(t)) ||
          (item.correo && String(item.correo).toLowerCase().includes(t)) ||
          (item.email && String(item.email).toLowerCase().includes(t)) ||
          (item.telefono && String(item.telefono).includes(t))
        );
      });
    },

    _generarId(tipo) {
      const prefijo =
        tipo === "clientes"
          ? "CLI-"
          : tipo === "proveedores"
            ? "PROV-"
            : tipo === "categorias"
              ? "CAT-"
              : "GEN-";
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.random().toString(36).substring(2, 7).toUpperCase();
      return `${prefijo}${timestamp}${random}`;
    }
  };

  window.Entidades = Entidades;

  // Sincronización automática solo si backend está habilitado
  (async () => {
    if (!backendHabilitado()) return;
    try {
      await Promise.all([
        Entidades.sincronizar("clientes"),
        Entidades.sincronizar("proveedores"),
        Entidades.sincronizar("categorias")
      ]);
    } catch (e) {
      // noop
    }
  })();
})();

