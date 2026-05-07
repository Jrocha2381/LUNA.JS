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
      throw new Error('No hay productos para crear ventas de ejemplo.');
    }

    const [clienteRows] = await queryInterface.sequelize.query('SELECT COUNT(*) as count FROM clientes;');
    const clientesCount = Number(clienteRows?.[0]?.count || 0);
    if (clientesCount === 0) {
      throw new Error('No hay clientes para crear ventas de ejemplo.');
    }

    let ventaId = await nextId(queryInterface, 'ventas');
    let detalleId = await nextId(queryInterface, 'detalle_ventas');

    const ventas = [];
    const detalles = [];

    const ventaCount = 10; // mínimo útil para demo
    for (let i = 0; i < ventaCount; i++) {
      const lineas = faker.number.int({ min: 1, max: 4 });
      const fecha = faker.date.recent({ days: 15 });
      const clienteId = faker.number.int({ min: 1, max: 20 });

      let total = 0;
      const usados = new Set();
      for (let j = 0; j < lineas; j++) {
        let productoId = faker.number.int({ min: 1, max: 30 });
        while (usados.has(productoId)) productoId = faker.number.int({ min: 1, max: 30 });
        usados.add(productoId);

        const cantidad = faker.number.int({ min: 1, max: 3 });
        const precioUnitario = faker.number.int({ min: 800, max: 35000 });
        const subtotal = Number((cantidad * precioUnitario).toFixed(2));
        total += subtotal;

        detalles.push({
          id: detalleId++,
          ventaId,
          productoId,
          cantidad,
          precioUnitario,
          subtotal,
          createdAt: now,
          updatedAt: now
        });
      }

      ventas.push({
        id: ventaId,
        fecha,
        clienteId,
        usuarioId: 2,
        metodoPago: faker.helpers.arrayElement(['efectivo', 'tarjeta', 'transferencia']),
        total: Number(total.toFixed(2)),
        items: '[]',
        createdAt: now,
        updatedAt: now
      });

      ventaId++;
    }

    await queryInterface.bulkInsert('ventas', ventas);
    await queryInterface.bulkInsert('detalle_ventas', detalles);
  },

  async down(queryInterface) {
    const [ventaRows] = await queryInterface.sequelize.query(
      "SELECT id FROM ventas WHERE usuarioId = 2 AND items = '[]' ORDER BY id DESC LIMIT 10;"
    );
    const ventaIds = ventaRows.map(r => r.id);

    if (ventaIds.length) {
      await queryInterface.bulkDelete('detalle_ventas', { ventaId: ventaIds });
      await queryInterface.bulkDelete('ventas', { id: ventaIds });
    }
  }
};
