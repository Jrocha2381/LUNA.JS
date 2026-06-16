/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('ventas', 'estado', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'activa'
    });

    // Asegurar consistencia: si existen filas previas, deberían quedar como 'activa'
    await queryInterface.sequelize.query(
      "UPDATE ventas SET estado = 'activa' WHERE estado IS NULL OR estado = ''",
      { type: queryInterface.sequelize.QueryTypes.UPDATE }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('ventas', 'estado');
  }
};

