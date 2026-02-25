// Usar variables/globales expuestas por data.js y carrito.js

document.addEventListener("click", (e) => {
  // Verificamos que sea un botón de agregar
  if (e.target.classList.contains("btn-agregar")) {
    const idCapturado = Number(e.target.dataset.id);
    
    // Buscamos en tu array de data.js
    const productoEncontrado = productos.find(p => p.id === idCapturado);

    if (productoEncontrado) {
      // Enviamos el objeto completo (nombre, precio, imagen, etc.)
      agregarAlCarrito(productoEncontrado);
    }
  }
});