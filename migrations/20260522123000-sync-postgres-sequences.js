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

async function syncSequence(queryInterface, tableName) {
  await queryInterface.sequelize.query(
    `
    DO $$
    DECLARE
      sequence_name text;
      max_id bigint;
    BEGIN
      SELECT pg_get_serial_sequence(:tableName, 'id') INTO sequence_name;

      IF sequence_name IS NOT NULL THEN
        EXECUTE format('SELECT COALESCE(MAX(id), 0) FROM %I', :tableName) INTO max_id;
        EXECUTE format('SELECT setval(%L, %s, %s)', sequence_name, GREATEST(max_id, 1), max_id > 0);
      END IF;
    END $$;
    `,
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
