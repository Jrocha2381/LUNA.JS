'use strict';

const { faker } = require('@faker-js/faker');

async function nextId(queryInterface, tableName) {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT COALESCE(MAX(id), 0) AS maxId FROM ${tableName};`
  );
  return Number(rows?.[0]?.maxId || 0) + 1;
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    faker.seed(20260507);
    const now = new Date();

    const [productoRows] = await queryInterface.sequelize.query('SELECT COUNT(*) as count FROM productos;');
    const productosCount = Number(productoRows?.[0]?.count || 0);
    if (productosCount === 0) {
      throw new Error('No hay productos para crear compras de ejemplo.');
    }

    const [proveedorRows] = await queryInterface.sequelize.query('SELECT COUNT(*) as count FROM proveedores;');
    const proveedoresCount = Number(proveedorRows?.[0]?.count || 0);
    if (proveedoresCount === 0) {
      throw new Error('No hay proveedores para crear compras de ejemplo.');
    }

    let compraId = await nextId(queryInterface, 'compras');
    let detalleId = await nextId(queryInterface, 'detalle_compras');

    const compras = [];
    const detalles = [];

    const compraCount = 5; // mínimo útil para demo
    for (let i = 0; i < compraCount; i++) {
      const lineas = faker.number.int({ min: 1, max: 5 });
      const fecha = faker.date.recent({ days: 30 });
      const proveedorId = faker.number.int({ min: 1, max: 5 });

      let total = 0;
      const usados = new Set();
      for (let j = 0; j < lineas; j++) {
        let productoId = faker.number.int({ min: 1, max: 30 });
        while (usados.has(productoId)) productoId = faker.number.int({ min: 1, max: 30 });
        usados.add(productoId);

        const cantidad = faker.number.int({ min: 1, max: 10 });
        const costoUnitario = faker.number.int({ min: 400, max: 25000 });
        const subtotal = Number((cantidad * costoUnitario).toFixed(2));
        total += subtotal;

        detalles.push({
          id: detalleId++,
          compraId,
          productoId,
          cantidad,
          costoUnitario,
          subtotal,
          createdAt: now,
          updatedAt: now
        });
      }

      compras.push({
        id: compraId,
        fecha,
        proveedorId,
        usuarioId: 1,
        total: Number(total.toFixed(2)),
        items: '[]',
        createdAt: now,
        updatedAt: now
      });

      compraId++;
    }

    await queryInterface.bulkInsert('compras', compras);
    await queryInterface.bulkInsert('detalle_compras', detalles);
  },

  async down(queryInterface) {
    const [compraRows] = await queryInterface.sequelize.query(
      "SELECT id FROM compras WHERE usuarioId = 1 AND items = '[]' ORDER BY id DESC LIMIT 5;"
    );
    const compraIds = compraRows.map(r => r.id);

    if (compraIds.length) {
      await queryInterface.bulkDelete('detalle_compras', { compraId: compraIds });
      await queryInterface.bulkDelete('compras', { id: compraIds });
    }
  }
};
