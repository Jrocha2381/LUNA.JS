'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('descuentos', {
      id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      nombre: { type: Sequelize.STRING(160), allowNull: false },
      tipo: { type: Sequelize.STRING(20), allowNull: false },
      valor: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('descuentos');
  }
};

