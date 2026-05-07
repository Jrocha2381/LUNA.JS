'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('usuarios', [
      { id: 1, nombre: 'Admin', correo: 'admin@pos.local', rol: 'admin', createdAt: now, updatedAt: now },
      { id: 2, nombre: 'Cajero 1', correo: 'cajero1@pos.local', rol: 'cajero', createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', { id: [1, 2] });
  }
};

