'use strict';

const validationHandler = require('./validationHandler');
const { optionalItems, optionalMoney, optionalPositiveInt } = require('./commonRules');

const createCompraValidator = [
  optionalPositiveInt('proveedorId', 'proveedorId'),
  optionalPositiveInt('usuarioId', 'usuarioId'),
  optionalMoney('total', 'total'),
  optionalItems(),
  validationHandler
];

const updateCompraValidator = createCompraValidator;

module.exports = {
  createCompraValidator,
  updateCompraValidator
};
