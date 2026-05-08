'use strict';

const SENSITIVE_KEYS = new Set(['password', 'clave', 'token', 'accessToken', 'refreshToken']);

function isInternalIdKey(key) {
  return key.endsWith('_id') || key.endsWith('Id');
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (!value || typeof value !== 'object') {
    return value;
  }

  const plainValue = typeof value.toJSON === 'function' ? value.toJSON() : value;

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
