'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('proveedores', [
      { id: 1, nombre: 'Distribuidora Escolar S.A.S', telefono: '6025550000', correo: 'ventas@distribuidoraescolar.co', createdAt: now, updatedAt: now },
      { id: 2, nombre: 'Papeles del Norte', telefono: '6014441122', correo: 'pedidos@papelesnorte.co', createdAt: now, updatedAt: now }
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('proveedores', { id: [1, 2] });
  }
};

