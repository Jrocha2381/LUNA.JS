'use strict';

const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('JWT_SECRET no esta configurado');
    err.status = 500;
    throw err;
  }
  return secret;
}

function optionalAuthJwt(req, _res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  try {
    req.user = jwt.verify(authHeader.substring(7), getJwtSecret());
  } catch (_err) {
    req.user = null;
  }

  return next();
}

module.exports = optionalAuthJwt;
