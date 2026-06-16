'use strict';

const { faker } = require('@faker-js/faker');

async function scalar(queryInterface, sql) {
  const [rows] = await queryInterface.sequelize.query(sql);
  return rows?.[0] || {};
}

async function count(queryInterface, table) {
  const r = await scalar(queryInterface, `SELECT COUNT(*) as c FROM ${table};`);
  return Number(r.c || 0);
}

async function maxId(queryInterface, table) {
  const r = await scalar(queryInterface, `SELECT COALESCE(MAX(id),0) as m FROM ${table};`);
  return Number(r.m || 0);
}

async function syncPostgresSequence(queryInterface, table) {
  if (queryInterface.sequelize.getDialect() !== 'postgres') return;

  await queryInterface.sequelize.query(
    `SELECT setval(
      pg_get_serial_sequence(:table, 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 0) FROM "${table}"), 1),
      (SELECT COALESCE(MAX(id), 0) FROM "${table}") > 0
    );`,
    { replacements: { table } }
  );
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    faker.seed(20260507);
    const now = new Date();


    // 1) Categorías (mínimo 6, por nombre único)
    const categoriasObjetivo = [
      'Cuadernos',
      'Lápices y Marcadores',
      'Papelería',
      'Arte',
      'Oficina',
      'Accesorios'
    ];
    const [catRows] = await queryInterface.sequelize.query('SELECT nombre FROM categorias;');
    const catSet = new Set(catRows.map(c => c.nombre));
    const cats = categoriasObjetivo
      .filter(n => !catSet.has(n))
      .map(nombre => ({ nombre, created_at: now, updated_at: now }));
    if (cats.length) await queryInterface.bulkInsert('categorias', cats);

    // 3) Proveedores (mínimo 5)
    const proveedoresMin = 5;
    const proveedoresActual = await count(queryInterface, 'proveedores');
    const proveedoresFaltan = Math.max(0, proveedoresMin - proveedoresActual);
    if (proveedoresFaltan > 0) {
      const proveedores = [];
      for (let i = 0; i < proveedoresFaltan; i++) {
        proveedores.push({
          nombre: `${faker.company.name()} S.A.S`,
          telefono: faker.phone.number('60########'),
          correo: faker.internet.email({ provider: 'proveedor.co' }).toLowerCase(),
          created_at: now,
          updated_at: now
        });
      }
      await queryInterface.bulkInsert('proveedores', proveedores);
    }

    // 4) Clientes (mínimo 20)
    const clientesMin = 20;
    const clientesActual = await count(queryInterface, 'clientes');
    const clientesFaltan = Math.max(0, clientesMin - clientesActual);
    if (clientesFaltan > 0) {
      const clientes = [];
      for (let i = 0; i < clientesFaltan; i++) {
        const nombre = faker.person.fullName();
        clientes.push({
          nombre,
          telefono: faker.phone.number('3#########'),
          correo: faker.internet
            .email({ firstName: nombre.split(' ')[0], lastName: nombre.split(' ').slice(1).join(' ') })
            .toLowerCase(),
          created_at: now,
          updated_at: now
        });
      }
      await queryInterface.bulkInsert('clientes', clientes);
    }

    // 5) Productos (mínimo 30)
    const productosMin = 30;
    const productosActual = await count(queryInterface, 'productos');
    const productosFaltan = Math.max(0, productosMin - productosActual);
    if (productosFaltan > 0) {
      const [catIdsRows] = await queryInterface.sequelize.query('SELECT id FROM categorias ORDER BY id;');
      const categoriaIds = catIdsRows.map(r => r.id);
      if (!categoriaIds.length) throw new Error('No hay categorías para asociar productos.');

      const productos = [];
      for (let i = 0; i < productosFaltan; i++) {
        const costo = faker.number.int({ min: 500, max: 30000 });
        const margen = faker.number.int({ min: 200, max: 15000 });
        productos.push({
          nombre: faker.commerce.productName(),
          categoriaId: faker.helpers.arrayElement(categoriaIds),
          precio: costo + margen,
          costo,
          stock: faker.number.int({ min: 0, max: 80 }),
          seguimientoInventario: true,
          created_at: now,
          updated_at: now
        });
      }
      await queryInterface.bulkInsert('productos', productos);
    }

    // Ventas y compras se omiten intencionalmente del seeder.
    // Son datos transaccionales que deben generarse desde el uso real del sistema.
  },

  async down() {
    // Intencional: no hacemos "undo" automático para evitar borrar data real.
  }
};

