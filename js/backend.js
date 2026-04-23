// js/backend.js
// Cliente de backend (placeholder) para futura base de datos/API.
// Por defecto queda deshabilitado para que la app funcione 100% local (localStorage).

(function () {
  const state = {
    enabled: false,
    baseUrl: "",
    apiPrefix: "/api"
  };

  function normalizarBaseUrl(baseUrl) {
    const raw = String(baseUrl || "").trim();
    return raw.replace(/\/+$/, "");
  }

  function normalizarApiPrefix(apiPrefix) {
    const raw = String(apiPrefix || "/api").trim();
    if (!raw) return "/api";
    if (!raw.startsWith("/")) return `/${raw}`;
    return raw.replace(/\/+$/, "");
  }

  function url(route) {
    const r = String(route || "").replace(/^\/+/, "");
    return `${state.baseUrl}${state.apiPrefix}/${r}`;
  }

  async function request(method, route, data) {
    if (!state.enabled) {
      throw new Error("Backend deshabilitado. Configura window.Backend.configure({ enabled:true }).");
    }

    const options = {
      method,
      headers: { "Content-Type": "application/json" }
    };
    if (data !== undefined) options.body = JSON.stringify(data);

    const res = await fetch(url(route), options);
    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");
    const payload = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const error = new Error(`Backend error ${res.status} ${res.statusText}`);
      error.status = res.status;
      error.payload = payload;
      throw error;
    }

    return payload;
  }

  const Backend = {
    configure(cfg = {}) {
      state.enabled = Boolean(cfg.enabled ?? state.enabled);
      state.baseUrl = normalizarBaseUrl(cfg.baseUrl ?? state.baseUrl);
      state.apiPrefix = normalizarApiPrefix(cfg.apiPrefix ?? state.apiPrefix);
    },
    isEnabled() {
      return Boolean(state.enabled);
    },
    url,
    get(route) {
      return request("GET", route);
    },
    post(route, data) {
      return request("POST", route, data);
    },
    put(route, data) {
      return request("PUT", route, data);
    },
    delete(route, data) {
      return request("DELETE", route, data);
    }
  };

  // Permite preconfigurar desde HTML: window.LunaConfig = { backend: { enabled:true, baseUrl:'', apiPrefix:'/api' } }
  try {
    const cfg = window.LunaConfig && window.LunaConfig.backend;
    if (cfg) Backend.configure(cfg);
  } catch (e) {
    // noop
  }

  window.Backend = Backend;
})();

