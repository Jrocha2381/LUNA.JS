'use strict';

const { RequestLog } = require('../../models');

async function requestLogger(req, _res, next) {
  try {
    await RequestLog.create({
      method: req.method,
      path: req.originalUrl,
      ip: req.ip
    });
  } catch (err) {
    console.error('Error guardando log:', err.message);
  }

  next();
}

module.exports = requestLogger;
