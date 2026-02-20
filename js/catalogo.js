// js/catalogo.js
import { productos } from "./data.js";
import { agregarAlCarrito } from "../carritopage/js/carrito.js";

const contenedor = document.querySelector(".productos__container");
// 1. Referencia al input de búsqueda (asegúrate de que tu HTML tenga un <input id="buscador">)
const buscador = document.querySelector("#buscador"); 

function renderizarProductos(productosFiltrados = productos) {
    if (!contenedor) return;
    contenedor.innerHTML = "";

    productosFiltrados.forEach(producto => {
        // 2. Lógica de stock: verificamos si queda algo
        const tieneStock = producto.stock > 0;

        contenedor.innerHTML += `
            <div class="card" style="${!tieneStock ? 'opacity: 0.6;' : ''}">
                <img src="${producto.imagen}" alt="${producto.nombre}" />
                <h3>${producto.nombre}</h3>
                <p class="precio">$${producto.precio.toLocaleString()}</p>
                <p class="stock">Disponibles: ${producto.stock}</p>
                <button class="btn-agregar" 
                        data-id="${producto.id}" 
                        ${!tieneStock ? 'disabled style="background: #ccc; border-color: #ccc; cursor: not-allowed;"' : ''}>
                    ${tieneStock ? 'Añadir al carrito' : 'Agotado'}
                </button>
            </div>
        `;
    });

    activarBotones();
}

function activarBotones() {
    const botones = document.querySelectorAll(".btn-agregar");
    botones.forEach(boton => {
        boton.addEventListener("click", () => {
            const id = Number(boton.dataset.id);
            const productoParaAgregar = productos.find(p => p.id === id);
            
            if (productoParaAgregar) {
                agregarAlCarrito(productoParaAgregar);
                // Opcional: Refrescar catálogo si quieres que el stock baje visualmente de inmediato
                // renderizarProductos(); 
            }
        });
    });
}

// 4. FUNCIONALIDAD DE BÚSQUEDA (Requerimiento del reto)
if (buscador) {
    buscador.addEventListener("input", (e) => {
        const texto = e.target.value.toLowerCase();
        const filtrados = productos.filter(p => 
            p.nombre.toLowerCase().includes(texto)
        );
        renderizarProductos(filtrados);
    });
}

// Inicializar
renderizarProductos();