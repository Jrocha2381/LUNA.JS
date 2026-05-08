'use strict';

const validationHandler = require('./validationHandler');
const { optionalMoney, requiredPositiveInt } = require('./commonRules');

const createDetalleCompraValidator = [
  requiredPositiveInt('compraId', 'compraId'),
  requiredPositiveInt('productoId', 'productoId'),
  requiredPositiveInt('cantidad', 'cantidad'),
  optionalMoney('costoUnitario', 'costoUnitario'),
  optionalMoney('subtotal', 'subtotal'),
  validationHandler
];

const updateDetalleCompraValidator = [
  requiredPositiveInt('compraId', 'compraId').optional(),
  requiredPositiveInt('productoId', 'productoId').optional(),
  requiredPositiveInt('cantidad', 'cantidad').optional(),
  optionalMoney('costoUnitario', 'costoUnitario'),
  optionalMoney('subtotal', 'subtotal'),
  validationHandler
];

module.exports = {
  createDetalleCompraValidator,
  updateDetalleCompraValidator
};
