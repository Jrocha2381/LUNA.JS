'use strict';

const { body, param, validationResult } = require('express-validator');

// Reglas básicas para Categoria
const createRules = [
  body('nombre').exists({ checkFalsy: true }).withMessage('El campo "nombre" es obligatorio').isString().notEmpty(),
  body('descripcion').optional().isString(),
];

const updateRules = [
  param('id').exists().withMessage('El parámetro "id" es obligatorio').isInt().withMessage('El "id" debe ser un entero'),
  body('nombre').optional().isString(),
  body('descripcion').optional().isString(),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  createRules,
  updateRules,
  handleValidationErrors,
};

