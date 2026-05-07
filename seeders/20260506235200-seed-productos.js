'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('productos', [
      {
        id: 1,
        nombre: 'Cuaderno argollado 100 hojas',
        categoriaId: 1,
        precio: 12000,
        costo: 8000,
        stock: 20,
        seguimientoInventario: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 2,
        nombre: 'Cuaderno cosido 50 hojas',
        categoriaId: 1,
        precio: 6000,
        costo: 3500,
        stock: 35,
        seguimientoInventario: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 3,
        nombre: 'Lápiz HB',
        categoriaId: 2,
        precio: 1000,
        costo: 500,
        stock: 120,
        seguimientoInventario: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 4,
        nombre: 'Marcador permanente negro',
        categoriaId: 2,
        precio: 3500,
        costo: 2000,
        stock: 40,
        seguimientoInventario: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 5,
        nombre: 'Resma papel carta 500 hojas',
        categoriaId: 3,
        precio: 26000,
        costo: 21000,
        stock: 10,
        seguimientoInventario: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 6,
        nombre: 'Pegante en barra',
        categoriaId: 3,
        precio: 4500,
        costo: 2500,
        stock: 25,
        seguimientoInventario: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 7,
        nombre: 'Pintura acrílica 60ml',
        categoriaId: 4,
        precio: 9000,
        costo: 5500,
        stock: 15,
        seguimientoInventario: true,
        createdAt: now,
        updatedAt: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('productos', { id: [1, 2, 3, 4, 5, 6, 7] });
  }
};

