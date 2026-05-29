// js/backend.js
// Cliente HTTP ligero para consumir la API Sequelize/SQLite.

(function () {
  const DEFAULT_API_PREFIX = "/Jeronimo Rubio_Sebastian Rocha_Ibrahim Safadi";

  const state = {
    enabled: false,
    baseUrl: "",
    apiPrefix: DEFAULT_API_PREFIX
  };

  function normalizarBaseUrl(baseUrl) {
    return String(baseUrl || "").trim().replace(/\/+$/, "");
  }

  function normalizarApiPrefix(apiPrefix) {
    const raw = String(apiPrefix || DEFAULT_API_PREFIX).trim();
    if (!raw) return DEFAULT_API_PREFIX;
    return raw.startsWith("/") ? raw.replace(/\/+$/, "") : `/${raw.replace(/\/+$/, "")}`;
  }

  function construirBaseUrlAutomatica() {
    if (window.location.protocol === "file:") {
      return "http://localhost:3000";
    }
    return window.location.origin;
  }

  function url(route) {
    const r = String(route || "").replace(/^\/+/, "");
    return `${state.baseUrl}${state.apiPrefix}/${r}`;
  }

  function getStoredToken() {
    try {
      return (
        (typeof window.sessionStorage !== "undefined" && window.sessionStorage.getItem("token")) ||
        (typeof window.localStorage !== "undefined" && window.localStorage.getItem("token")) ||
        null
      );
    } catch (_err) {
      return null;
    }
  }

  async function request(method, route, data) {
    if (!state.enabled) {
      throw new Error("Backend deshabilitado. Configura window.Backend.configure({ enabled:true }).");
    }

    const options = {
      method,
      headers: { "Content-Type": "application/json" }
    };

    const token = getStoredToken();
    if (token) {
      options.headers.Authorization = `Bearer ${token}`;
    }

    if (data !== undefined) {
      options.body = JSON.stringify(data);
    }

    const res = await fetch(url(route), options);
    const contentType = res.headers.get("content-type") || "";
    const payload = contentType.includes("application/json") ? await res.json() : await res.text();

    if (!res.ok) {
      const detalle =
        payload && typeof payload === "object"
          ? payload.error || payload.message || (Array.isArray(payload.details) && payload.details[0] && payload.details[0].message)
          : payload;
      const error = new Error(detalle || `Backend error ${res.status} ${res.statusText}`);
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
    delete(route) {
      return request("DELETE", route);
    }
  };

  try {
    const cfg = window.LunaConfig && window.LunaConfig.backend;
    if (cfg) {
      Backend.configure(cfg);
    } else {
      Backend.configure({
        enabled: true,
        baseUrl: construirBaseUrlAutomatica(),
        apiPrefix: DEFAULT_API_PREFIX
      });
    }
  } catch (_error) {
    Backend.configure({
      enabled: true,
      baseUrl: construirBaseUrlAutomatica(),
      apiPrefix: DEFAULT_API_PREFIX
    });
  }

  window.Backend = Backend;
})();
