'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ventas', 'subtotal', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addColumn('ventas', 'descuentoId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'descuentos', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addColumn('ventas', 'descuentoAplicado', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0
    });

    await queryInterface.addIndex('ventas', ['descuentoId']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('ventas', ['descuentoId']);
    await queryInterface.removeColumn('ventas', 'descuentoAplicado');
    await queryInterface.removeColumn('ventas', 'descuentoId');
    await queryInterface.removeColumn('ventas', 'subtotal');
  }
};

