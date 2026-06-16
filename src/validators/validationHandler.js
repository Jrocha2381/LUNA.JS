'use strict';

const { validationResult } = require('express-validator');

function validationHandler(req, res, next) {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    error: 'Validation error',
    details: errors.array().map(({ msg, path, location, value }) => ({
      field: path,
      location,
      message: msg,
      value
    }))
  });
}

module.exports = validationHandler;
