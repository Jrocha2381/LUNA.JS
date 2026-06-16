'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios', {
      id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true, autoIncrement: true },
      nombre: { type: Sequelize.STRING(160), allowNull: false },
      correo: { type: Sequelize.STRING(160), allowNull: true, unique: true },
      rol: { type: Sequelize.STRING(40), allowNull: false, defaultValue: 'cajero' },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('usuarios');
  }
};

