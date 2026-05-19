'use strict';

const { body } = require('express-validator');
const validationHandler = require('./validationHandler');
const { optionalItems, optionalMoney, optionalPositiveInt } = require('./commonRules');

const createVentaValidator = [
  optionalPositiveInt('clienteId', 'clienteId'),
  optionalPositiveInt('usuarioId', 'usuarioId'),
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

module.exports = {
  createVentaValidator,
  updateVentaValidator
};
