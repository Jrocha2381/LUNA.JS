'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('categorias', [
      { id: 5, nombre: 'Oficina', createdAt: now, updatedAt: now },
      { id: 6, nombre: 'Accesorios', createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('categorias', { id: [5, 6] });
  }
};

