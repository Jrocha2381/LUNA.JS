'use strict';

async function tableExists(queryInterface, tableName) {
  const tables = await queryInterface.showAllTables();
  return tables.includes(tableName);
}

async function columnExists(queryInterface, tableName, columnName) {
  const table = await queryInterface.describeTable(tableName);
  return Boolean(table[columnName]);
}

module.exports = {
  async up(queryInterface) {
    const tableName = 'faltantes';
    if (!(await tableExists(queryInterface, tableName))) return;

    if ((await columnExists(queryInterface, tableName, 'createdAt')) && !(await columnExists(queryInterface, tableName, 'created_at'))) {
      await queryInterface.renameColumn(tableName, 'createdAt', 'created_at');
    }

    if ((await columnExists(queryInterface, tableName, 'updatedAt')) && !(await columnExists(queryInterface, tableName, 'updated_at'))) {
      await queryInterface.renameColumn(tableName, 'updatedAt', 'updated_at');
    }
  },

  async down(queryInterface) {
    const tableName = 'faltantes';
    if (!(await tableExists(queryInterface, tableName))) return;

    if ((await columnExists(queryInterface, tableName, 'created_at')) && !(await columnExists(queryInterface, tableName, 'createdAt'))) {
      await queryInterface.renameColumn(tableName, 'created_at', 'createdAt');
    }

    if ((await columnExists(queryInterface, tableName, 'updated_at')) && !(await columnExists(queryInterface, tableName, 'updatedAt'))) {
      await queryInterface.renameColumn(tableName, 'updated_at', 'updatedAt');
    }
  }
};
