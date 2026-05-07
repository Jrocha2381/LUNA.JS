'use strict';

const { faker } = require('@faker-js/faker');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    faker.seed(20260507);
    const now = new Date();

    const categoriaIds = [1, 2, 3, 4, 5, 6];
    const productos = [];

    for (let i = 0; i < 23; i++) {
      const costo = faker.number.int({ min: 500, max: 30000 });
      const margen = faker.number.int({ min: 200, max: 15000 });
      const precio = costo + margen;

      productos.push({
        id: 8 + i,
        nombre: faker.commerce.productName(),
        categoriaId: categoriaIds[faker.number.int({ min: 0, max: categoriaIds.length - 1 })],
        precio,
        costo,
        stock: faker.number.int({ min: 0, max: 80 }),
        seguimientoInventario: true,
        createdAt: now,
        updatedAt: now
      });
    }

    await queryInterface.bulkInsert('productos', productos);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('productos', { id: Array.from({ length: 23 }, (_, i) => 8 + i) });
  }
};

