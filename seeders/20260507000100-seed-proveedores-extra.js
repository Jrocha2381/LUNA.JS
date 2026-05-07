'use strict';

const { faker } = require('@faker-js/faker');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    faker.seed(20260507);
    const now = new Date();

    const proveedores = [];
    for (let i = 0; i < 3; i++) {
      proveedores.push({
        id: 3 + i,
        nombre: `${faker.company.name()} S.A.S`,
        telefono: faker.phone.number('60########'),
        correo: faker.internet.email({ provider: 'proveedor.co' }).toLowerCase(),
        createdAt: now,
        updatedAt: now
      });
    }

    await queryInterface.bulkInsert('proveedores', proveedores);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('proveedores', { id: [3, 4, 5] });
  }
};

