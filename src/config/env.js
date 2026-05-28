'use strict';

const fs = require('fs');
const path = require('path');

require('dotenv').config();

function hasLocalEnvFile() {
  try {
    return fs.existsSync(path.join(process.cwd(), '.env'));
  } catch {
    return false;
  }
}

function requireEnv(name) {
  const value = process.env[name];
  if (typeof value === 'string' && value.trim() !== '') return value;

  const hasEnv = hasLocalEnvFile();
  const hint = hasEnv
    ? `Falta la variable ${name} en tu archivo .env.`
    : `No se encontró archivo .env. Crea uno basado en .env.example y define ${name}.`;

  const message = `${hint} (Requerida para JWT/login)`;

  if (process.env.NODE_ENV === 'test') {
    const err = new Error(message);
    err.status = 500;
    throw err;
  }

  // Fail fast: evita que el sistema "arranque" y luego falle con 500 en /login.
  // eslint-disable-next-line no-console
  console.error(message);
  process.exit(1);
}

module.exports = {
  requireEnv
};

