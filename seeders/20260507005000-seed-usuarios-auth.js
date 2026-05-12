'use strict';

const bcrypt = require('bcrypt');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    const adminPassword = await bcrypt.hash('admin123', 10);
    const cajeroPassword = await bcrypt.hash('cajero123', 10);

    await queryInterface.sequelize.query(
      `UPDATE usuarios
       SET password = :password,
           role = 'ADMIN',
           rol = 'admin',
           updatedAt = :updatedAt
       WHERE username = 'admin@pos.local' OR correo = 'admin@pos.local';`,
      {
        replacements: {
          password: adminPassword,
          updatedAt: now
        }
      }
    );

    await queryInterface.sequelize.query(
      `UPDATE usuarios
       SET password = :password,
           role = 'USER',
           rol = 'cajero',
           updatedAt = :updatedAt
       WHERE username = 'cajero1@pos.local' OR correo = 'cajero1@pos.local';`,
      {
        replacements: {
          password: cajeroPassword,
          updatedAt: now
        }
      }
    );

    const [rows] = await queryInterface.sequelize.query(
      "SELECT correo, username FROM usuarios WHERE correo IN ('admin@pos.local','cajero1@pos.local') OR username IN ('admin@pos.local','cajero1@pos.local');"
    );
    const existentesCorreo = new Set(rows.map(r => r.correo).filter(Boolean));
    const existentesUsername = new Set(rows.map(r => r.username).filter(Boolean));

    const usuarios = [];

    if (!existentesCorreo.has('admin@pos.local') && !existentesUsername.has('admin@pos.local')) {
      usuarios.push({
        nombre: 'Admin',
        correo: 'admin@pos.local',
        rol: 'admin',
        username: 'admin@pos.local',
        password: adminPassword,
        role: 'ADMIN',
        createdAt: now,
        updatedAt: now
      });
    }

    if (!existentesCorreo.has('cajero1@pos.local') && !existentesUsername.has('cajero1@pos.local')) {
      usuarios.push({
        nombre: 'Cajero 1',
        correo: 'cajero1@pos.local',
        rol: 'cajero',
        username: 'cajero1@pos.local',
        password: cajeroPassword,
        role: 'USER',
        createdAt: now,
        updatedAt: now
      });
    }

    if (usuarios.length) await queryInterface.bulkInsert('usuarios', usuarios);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('usuarios', {
      username: ['admin@pos.local', 'cajero1@pos.local']
    });
  }
};

