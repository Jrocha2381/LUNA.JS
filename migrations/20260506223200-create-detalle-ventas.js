'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('detalle_ventas', {
      id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      ventaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'ventas', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      productoId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'productos', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      cantidad: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      precioUnitario: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      subtotal: { type: Sequelize.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.addIndex('detalle_ventas', ['ventaId']);
    await queryInterface.addIndex('detalle_ventas', ['productoId']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('detalle_ventas');
  }
};

