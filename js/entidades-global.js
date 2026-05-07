// js/entidades-global.js
// CRUD ligero para clientes, proveedores y categorias alineado con SQLite.

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
      campos: ["id", "nombre", "telefono", "correo"]
    },
    categorias: {
      key: "pos_categorias",
      route: "categorias",
      campos: ["id", "nombre"]
    }
  };

  const SYNC_INTERVAL_MS = 8000;

  function backendHabilitado() {
    return Boolean(window.Backend && window.Backend.isEnabled && window.Backend.isEnabled());
  }

  function normalizarRegistro(tipo, data) {
    const config = ENTIDADES_CONFIG[tipo];
    if (!config) return data;

    const registro = {};
    config.campos.forEach((campo) => {
      if (data[campo] !== undefined) {
        registro[campo] = data[campo];
      }
    });

    if (tipo !== "categorias") {
      registro.telefono = String(registro.telefono || "").trim();
      registro.correo = String(registro.correo || "").trim();
    }

    if (registro.id !== undefined && registro.id !== null && registro.id !== "") {
      registro.id = Number(registro.id);
    } else {
      delete registro.id;
    }

    registro.nombre = String(registro.nombre || "").trim();
    return registro;
  }

  function guardarLocal(tipo, lista) {
    const config = ENTIDADES_CONFIG[tipo];
    if (!config) return;
    localStorage.setItem(config.key, JSON.stringify(Array.isArray(lista) ? lista : []));
    window.dispatchEvent(new CustomEvent("entidadesActualizadas", { detail: { tipo, lista } }));
    window.dispatchEvent(new CustomEvent(`${tipo}Actualizados`, { detail: lista }));
  }

  const Entidades = {
    obtener(tipo) {
      const config = ENTIDADES_CONFIG[tipo];
      if (!config) return [];
      try {
        const lista = JSON.parse(localStorage.getItem(config.key) || "[]");
        return Array.isArray(lista) ? lista : [];
      } catch (_error) {
        return [];
      }
    },

    async sincronizar(tipo) {
      const config = ENTIDADES_CONFIG[tipo];
      if (!config || !backendHabilitado()) return this.obtener(tipo);

      const datos = await window.Backend.get(config.route);
      const lista = Array.isArray(datos) ? datos.map((item) => normalizarRegistro(tipo, item)) : [];
      guardarLocal(tipo, lista);
      return lista;
    },

    async crear(tipo, data) {
      const config = ENTIDADES_CONFIG[tipo];
      if (!config) return null;

      const payload = normalizarRegistro(tipo, data);
      delete payload.id;

      if (backendHabilitado()) {
        const creado = await window.Backend.post(config.route, payload);
        const lista = await this.sincronizar(tipo);
        return lista.find((item) => String(item.id) === String(creado.id)) || normalizarRegistro(tipo, creado);
      }

      const lista = this.obtener(tipo);
      const nuevo = { ...payload, id: Date.now() };
      lista.push(nuevo);
      guardarLocal(tipo, lista);
      return nuevo;
    },

    async actualizar(tipo, id, cambios) {
      const config = ENTIDADES_CONFIG[tipo];
      if (!config) return null;

      const payload = normalizarRegistro(tipo, { ...cambios, id });

      if (backendHabilitado()) {
        const actualizado = await window.Backend.put(`${config.route}/${id}`, payload);
        await this.sincronizar(tipo);
        return normalizarRegistro(tipo, actualizado);
      }

      const lista = this.obtener(tipo);
      const index = lista.findIndex((item) => String(item.id) === String(id));
      if (index === -1) return null;
      lista[index] = { ...lista[index], ...payload };
      guardarLocal(tipo, lista);
      return lista[index];
    },

    async eliminar(tipo, id) {
      const config = ENTIDADES_CONFIG[tipo];
      if (!config) return;

      if (backendHabilitado()) {
        await window.Backend.delete(`${config.route}/${id}`);
        await this.sincronizar(tipo);
        return;
      }

      const lista = this.obtener(tipo).filter((item) => String(item.id) !== String(id));
      guardarLocal(tipo, lista);
    },

    buscar(tipo, termino) {
      const lista = this.obtener(tipo);
      const t = String(termino || "").trim().toLowerCase();
      return lista.filter((item) =>
        [item.nombre, item.telefono, item.correo].some((valor) =>
          String(valor || "").toLowerCase().includes(t)
        )
      );
    }
  };

  Entidades.sincronizarTodo = async function sincronizarTodo() {
    if (!backendHabilitado()) {
      return {
        clientes: this.obtener("clientes"),
        proveedores: this.obtener("proveedores"),
        categorias: this.obtener("categorias")
      };
    }

    const [clientes, proveedores, categorias] = await Promise.all([
      this.sincronizar("clientes"),
      this.sincronizar("proveedores"),
      this.sincronizar("categorias")
    ]);

    return { clientes, proveedores, categorias };
  };

  window.Entidades = Entidades;

  (async () => {
    if (!backendHabilitado()) return;
    try {
      await Entidades.sincronizarTodo();
    } catch (error) {
      console.error("No se pudo sincronizar entidades:", error);
    }
  })();

  setInterval(() => {
    if (!backendHabilitado()) return;
    Entidades.sincronizarTodo().catch((error) => {
      console.error("No se pudo sincronizar entidades automaticamente:", error);
    });
  }, SYNC_INTERVAL_MS);
})();
