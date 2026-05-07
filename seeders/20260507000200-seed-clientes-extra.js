'use strict';

const { faker } = require('@faker-js/faker');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    faker.seed(20260507);
    const now = new Date();

    const clientes = [];
    for (let i = 0; i < 17; i++) {
      const nombre = faker.person.fullName();
      clientes.push({
        id: 4 + i,
        nombre,
        telefono: faker.phone.number('3#########'),
        correo: faker.internet.email({ firstName: nombre.split(' ')[0], lastName: nombre.split(' ').slice(1).join(' ') }).toLowerCase(),
        createdAt: now,
        updatedAt: now
      });
    }

    await queryInterface.bulkInsert('clientes', clientes);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('clientes', { id: Array.from({ length: 17 }, (_, i) => 4 + i) });
  }
};

