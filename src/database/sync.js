'use strict';

const { sequelize } = require('../../models');

async function syncDatabase() {
  // En producción, SIEMPRE usar migraciones explícitas
  // NUNCA usar sync automático
  if (process.env.NODE_ENV === 'production') {
    console.log('Production environment: skipping automatic sync (use migrations instead)');
    return;
  }

  // En desarrollo, solo sincronizar si DB_AUTO_SYNC está explícitamente habilitado
  if (process.env.DB_AUTO_SYNC !== 'true') {
    console.log('DB_AUTO_SYNC not enabled: skipping automatic sync');
    return;
  }

  const alter = process.env.DB_SYNC_ALTER === 'true';
  await sequelize.sync({ alter });
  console.log(`Database schema synchronized${alter ? ' with alter' : ''}.`);
}

module.exports = syncDatabase;
