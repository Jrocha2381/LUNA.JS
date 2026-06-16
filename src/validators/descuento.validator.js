'use strict';

const { body } = require('express-validator');
const validationHandler = require('./validationHandler');
const { requiredString } = require('./commonRules');

function tipoRule(required) {
  const r = body('tipo');
  const chain = required ? r : r.optional({ nullable: true, checkFalsy: true });
  return chain
    .trim()
    .isIn(['porcentaje', 'fijo'])
    .withMessage("tipo debe ser 'porcentaje' o 'fijo'");
}

function valorRule(required) {
  const r = body('valor');
  const chain = required ? r : r.optional({ nullable: true });
  return chain
    .isFloat({ min: 0 })
    .withMessage('valor debe ser un numero mayor o igual a 0')
    .toFloat()
    .custom((v, { req }) => {
      const tipo = (req.body?.tipo || '').toString().trim();
      if (tipo === 'porcentaje' && v > 100) {
        throw new Error('valor no puede ser mayor a 100 cuando tipo es porcentaje');
      }
      return true;
    });
}

const createDescuentoValidator = [
  requiredString('nombre', 'nombre', 160),
  tipoRule(true),
  valorRule(true),
  body('activo')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('activo debe ser booleano')
    .toBoolean(),
  validationHandler
];

const updateDescuentoValidator = [
  body('nombre')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .notEmpty()
    .withMessage('nombre no puede estar vacio')
    .isLength({ max: 160 })
    .withMessage('nombre no puede superar 160 caracteres'),
  tipoRule(false),
  valorRule(false),
  body('activo')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('activo debe ser booleano')
    .toBoolean(),
  validationHandler
];

module.exports = {
  createDescuentoValidator,
  updateDescuentoValidator
};
