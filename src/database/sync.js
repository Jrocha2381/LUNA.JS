'use strict';

const { sequelize } = require('../../models');

async function syncDatabase() {
  if (process.env.DB_AUTO_SYNC === 'false') {
    return;
  }

  const alter = process.env.DB_SYNC_ALTER === 'true';
  await sequelize.sync({ alter });
  console.log(`Database schema synchronized${alter ? ' with alter' : ''}.`);
}

module.exports = syncDatabase;
