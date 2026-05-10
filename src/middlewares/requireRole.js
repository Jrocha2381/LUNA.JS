'use strict';

function requireRole(...allowedRoles) {
  return function roleMiddleware(req, res, next) {
    const userRole = req.user && req.user.role;

    if (!userRole) {
      return res.status(403).json({ error: 'Rol requerido' });
    }

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'No tienes permisos para acceder a este recurso' });
    }

    return next();
  };
}

module.exports = requireRole;
