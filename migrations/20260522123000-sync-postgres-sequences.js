'use strict';

const TABLES = [
  'categorias',
  'productos',
  'clientes',
  'proveedores',
  'usuarios',
  'ventas',
  'compras',
  'detalle_ventas',
  'detalle_compras',
  'request_log'
];

async function tableExists(queryInterface, tableName) {
  try {
    await queryInterface.describeTable(tableName);
    return true;
  } catch (_error) {
    return false;
  }
}

async function syncSequence(queryInterface, tableName) {
  if (!(await tableExists(queryInterface, tableName))) return;

  await queryInterface.sequelize.query(
    `SELECT setval(
      pg_get_serial_sequence(:tableName, 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 0) FROM "${tableName}"), 1),
      (SELECT COALESCE(MAX(id), 0) FROM "${tableName}") > 0
    );`,
    { replacements: { tableName } }
  );
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    if (queryInterface.sequelize.getDialect() !== 'postgres') return;

    for (const tableName of TABLES) {
      await syncSequence(queryInterface, tableName);
    }
  },

  async down() {
    // No rollback needed: this only aligns serial sequences with existing rows.
  }
};
