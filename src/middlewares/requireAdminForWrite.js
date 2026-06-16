'use strict';

const requireRole = require('./requireRole');

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function requireAdminForWrite(req, res, next) {
  if (!WRITE_METHODS.has(req.method)) return next();
  return requireRole('ADMIN')(req, res, next);
}

module.exports = requireAdminForWrite;

