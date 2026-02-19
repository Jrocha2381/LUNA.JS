// js/data.js
const productosIniciales = [
  { id: 1, nombre: "Cuaderno Profesional", categoria: "Escolar", precio: 12000, imagen: "../../images/cuaderno.png", descripcion: "Cuaderno argollado profesional", stock: 15 },
  { id: 2, nombre: "Pegastick", categoria: "Escolar", precio: 3000, imagen: "../../images/Pegastick.png", descripcion: "Pegante en barra de alta calidad", stock: 25 },
  { id: 3, nombre: "Marcador Permanente", categoria: "Escolar", precio: 4000, imagen: "../../images/marcadores.png", descripcion: "Marcador negro punta gruesa", stock: 30 },
  { id: 4, nombre: "Pinturas", categoria: "Arte", precio: 12000, imagen: "../../images/pintura.png", descripcion: "Set de pinturas acrílicas", stock: 12 },
  { id: 5, nombre: "Plastilina", categoria: "Arte", precio: 3000, imagen: "../../images/plastilina.png", descripcion: "Barra de plastilina de colores", stock: 40 },
  { id: 6, nombre: "Pinceles", categoria: "Arte", precio: 4000, imagen: "../../images/pinceles.jpeg", descripcion: "Set de pinceles variados", stock: 20 },
  { id: 7, nombre: "Carpeta Plástica", categoria: "Oficina", precio: 5000, imagen: "../../images/carpeta.png", descripcion: "Carpeta con broche resistente", stock: 50 },
  { id: 8, nombre: "Calculadora Básica", categoria: "Oficina", precio: 25000, imagen: "../../images/calculadora.webp", descripcion: "Calculadora de 8 dígitos", stock: 15 },
  { id: 9, nombre: "Agenda 2026", categoria: "Oficina", precio: 18000, imagen: "../../images/agenda.png", descripcion: "Agenda diaria ejecutiva", stock: 100 },
  { id: 10, nombre: "Cinta Adhesiva", categoria: "Papelería", precio: 12000, imagen: "../../images/cinta.png", descripcion: "Cinta adhesiva transparente", stock: 60 },
  { id: 11, nombre: "Papel de Pintura", categoria: "Papelería", precio: 3000, imagen: "../../images/papelp.jpeg", descripcion: "Pliego de papel para arte", stock: 80 },
  { id: 12, nombre: "Tijeras", categoria: "Papelería", precio: 4000, imagen: "../../images/tijeras.png", descripcion: "Tijeras de corte preciso", stock: 35 }
];

// si hay productos guardados, úsalos; si no, inicializa con productosIniciales
const saved = localStorage.getItem("productos");
export let productos = saved ? JSON.parse(saved) : productosIniciales.slice();

// función para persistir cambios de stock
export function guardarProductos() {
  localStorage.setItem("productos", JSON.stringify(productos));
}
