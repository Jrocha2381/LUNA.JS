'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('clientes', [
      { id: 1, nombre: 'Cliente General', telefono: null, correo: null, createdAt: now, updatedAt: now },
      { id: 2, nombre: 'Ana Pérez', telefono: '3001234567', correo: 'ana.perez@email.com', createdAt: now, updatedAt: now },
      { id: 3, nombre: 'Juan Gómez', telefono: '3019876543', correo: 'juan.gomez@email.com', createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('clientes', { id: [1, 2, 3] });
  }
};

