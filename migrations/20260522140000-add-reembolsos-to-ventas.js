'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ventas', 'totalReembolsado', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('ventas', 'reembolsos', {
      type: Sequelize.JSON,
      allowNull: false,
      defaultValue: []
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ventas', 'reembolsos');
    await queryInterface.removeColumn('ventas', 'totalReembolsado');
  }
};
