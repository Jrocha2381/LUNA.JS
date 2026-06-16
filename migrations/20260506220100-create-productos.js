'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('productos', {
      id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      nombre: { type: Sequelize.STRING(160), allowNull: false },
      categoriaId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'categorias', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      precio: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      costo: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      stock: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      seguimientoInventario: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('productos');
  }
};

