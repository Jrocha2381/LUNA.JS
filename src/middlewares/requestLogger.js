const { RequestLog } = require('../../models');

/**
 * Middleware pre-procesamiento: registra cada llamada.
 * No bloquea la petición si el log falla.
 */
module.exports = async (req, res, next) => {
  try {
    // Si la tabla/modelo no existe o falla, no tumbar la request.
    if (RequestLog && typeof RequestLog.create === 'function') {
      await RequestLog.create({
        method: req.method,
        path: req.originalUrl,
        ip: req.ip
      });
    }
  } catch (err) {
    console.error('Error guardando request log:', err);
  }
  next();
};

