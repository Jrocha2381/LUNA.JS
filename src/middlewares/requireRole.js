'use strict';

function requireRole(requiredRole) {
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];

  return function roleMiddleware(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acceso prohibido. Se requiere rol ${allowedRoles.join(' o ')}.`
      });
    }

    return next();
  };
}

module.exports = requireRole;
