'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('usuarios', 'username', {
      type: Sequelize.STRING(160),
      allowNull: true
    });

    await queryInterface.addColumn('usuarios', 'password', {
      // Guarda el hash (bcrypt), no el texto plano
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('usuarios', 'role', {
      type: Sequelize.STRING(16),
      allowNull: false,
      defaultValue: 'USER'
    });

    // SQLite no permite agregar una columna con UNIQUE directamente; usamos un índice único.
    await queryInterface.addIndex('usuarios', ['username'], {
      unique: true,
      name: 'usuarios_username_unique'
    });

    // Backfill: usa correo como username cuando exista
    await queryInterface.sequelize.query(
      "UPDATE usuarios SET username = correo WHERE (username IS NULL OR username = '') AND correo IS NOT NULL AND correo <> '';"
    );

    // Backfill: mapea rol legacy -> role (admin => ADMIN, resto => USER)
    await queryInterface.sequelize.query(
      "UPDATE usuarios SET role = CASE WHEN lower(rol) = 'admin' THEN 'ADMIN' ELSE 'USER' END WHERE role IS NULL OR role = '';"
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('usuarios', 'usuarios_username_unique');
    await queryInterface.removeColumn('usuarios', 'role');
    await queryInterface.removeColumn('usuarios', 'password');
    await queryInterface.removeColumn('usuarios', 'username');
  }
};
