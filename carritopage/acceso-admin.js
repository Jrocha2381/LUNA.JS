if (window.top !== window.self) {
  // Frame-breaker: Si el panel admin intenta cargarse dentro de un iframe, 
  // forzamos la recarga en la ventana principal para evitar anidamiento infinito.
  window.top.location.href = window.location.href;
}

// Acceso libre: La sesión siempre es válida
window.sesionAdminActiva = () => true;

document.addEventListener("DOMContentLoaded", () => {
  const dashboardContainer = document.getElementById("dashboard-container");
  const adminFrame = document.getElementById("admin-frame");
  const navItems = document.querySelectorAll(".nav-item");
  const viewTitle = document.getElementById("view-title");

  // Función para inicializar el panel sin necesidad de login
  const inicializarPanel = () => {
    if (dashboardContainer) {
      dashboardContainer.classList.remove("oculto");
      document.body.classList.add("admin-mode");

      // Carga inicial del iframe
      if (adminFrame && !adminFrame.src) {
        adminFrame.src = "admin-dashboard.html";
      }
    }
  };

  // Navegación del Dashboard
  navItems.forEach(item => {
    item.addEventListener("click", (e) => {
      const src = item.dataset.src;
      const href = item.getAttribute("href");

      // BUG FIX: Si el destino es volver a la tienda (index.html), redirigimos la ventana principal.
      // Esto evita que la tienda se abra DENTRO del panel administrativo.
      if ((src && src.includes("index.html")) || (href && href.includes("index.html"))) {
        e.preventDefault();
        window.top.location.href = href || src;
        return;
      }

      // Si el elemento no tiene data-src, es un enlace normal (como el de Volver) 
      // o un botón de acción, por lo que dejamos que siga su curso natural.
      if (!src) {
        return;
      }

      e.preventDefault(); // Solo prevenimos el default si vamos a cargar contenido en el iframe
      navItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      adminFrame.src = src;
      viewTitle.textContent = item.innerText.replace(/[^\w\s]/gi, '').trim();
    });
  });

  inicializarPanel();
});
