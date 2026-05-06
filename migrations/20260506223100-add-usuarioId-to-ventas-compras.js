'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ventas', 'usuarioId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'usuarios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('compras', 'usuarioId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'usuarios', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ventas', 'usuarioId');
    await queryInterface.removeColumn('compras', 'usuarioId');
  }
};

