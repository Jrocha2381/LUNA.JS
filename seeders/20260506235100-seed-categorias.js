'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('categorias', [
      { id: 1, nombre: 'Cuadernos', createdAt: now, updatedAt: now },
      { id: 2, nombre: 'Lápices y Marcadores', createdAt: now, updatedAt: now },
      { id: 3, nombre: 'Papelería', createdAt: now, updatedAt: now },
      { id: 4, nombre: 'Arte', createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('categorias', { id: [1, 2, 3, 4] });
  }
};

