'use strict';

const { body } = require('express-validator');
const validationHandler = require('./validationHandler');
const { optionalItems, optionalMoney, optionalPositiveInt, requiredPositiveInt } = require('./commonRules');

const createVentaValidator = [
  optionalPositiveInt('clienteId', 'clienteId'),
  optionalPositiveInt('usuarioId', 'usuarioId'),
  optionalPositiveInt('descuentoId', 'descuentoId'),
  body('metodoPago')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('metodoPago no puede superar 50 caracteres'),
  optionalMoney('total', 'total'),
  optionalItems(),
  body('estado')
    .optional({ nullable: true })
    .isIn(['activa', 'papelera'])
    .withMessage('estado inválido'),
  validationHandler
];


const updateVentaValidator = createVentaValidator;

const applyVentaDescuentoValidator = [
  requiredPositiveInt('descuentoId', 'descuentoId'),
  validationHandler
];

module.exports = {
  createVentaValidator,
  updateVentaValidator,
  applyVentaDescuentoValidator
};
