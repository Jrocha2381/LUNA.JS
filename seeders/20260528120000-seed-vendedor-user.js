'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const password = await bcrypt.hash('lunaUser123', 10);

    await queryInterface.sequelize.query(
      `UPDATE usuarios
       SET password = :password,
           role = 'USER',
           rol = 'cajero',
           updated_at = :updated_at
       WHERE username = 'vendedor@pos.local' OR correo = 'vendedor@pos.local';`,
      {
        replacements: {
          password,
          updated_at: now
        }
      }
    );

    const [rows] = await queryInterface.sequelize.query(
      "SELECT id FROM usuarios WHERE username = 'vendedor@pos.local' OR correo = 'vendedor@pos.local' LIMIT 1;"
    );

    if (rows.length) return;

    await queryInterface.bulkInsert('usuarios', [
      {
        nombre: 'Vendedor Luna',
        correo: 'vendedor@pos.local',
        rol: 'cajero',
        username: 'vendedor@pos.local',
        password,
        role: 'USER',
        created_at: now,
        updated_at: now
      }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', {
      username: 'vendedor@pos.local'
    });
  }
};
