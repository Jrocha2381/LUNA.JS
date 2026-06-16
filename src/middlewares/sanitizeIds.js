'use strict';

// Nota: el endpoint de login debe devolver un JWT en la clave `token`.
// Por eso NO se elimina `token` aquí; solo credenciales y otros tokens opcionales.
const SENSITIVE_KEYS = new Set(['password', 'clave', 'accessToken', 'refreshToken']);

function isInternalIdKey(key) {
  return key === '_id';
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const plainValue = typeof value.toJSON === 'function' ? value.toJSON() : value;

  // Ej: Date#toJSON() devuelve string ISO. En ese caso, no debemos perder el valor.
  if (!plainValue || typeof plainValue !== 'object') {
    return plainValue;
  }

  return Object.entries(plainValue).reduce((sanitized, [key, entry]) => {
    if (SENSITIVE_KEYS.has(key) || isInternalIdKey(key)) {
      return sanitized;
    }

    sanitized[key] = sanitizeValue(entry);
    return sanitized;
  }, {});
}

function sanitizeIds(_req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (body) => originalJson(sanitizeValue(body));

  next();
}

module.exports = sanitizeIds;
