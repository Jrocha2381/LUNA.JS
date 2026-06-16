'use strict';

const validationHandler = require('./validationHandler');
const { optionalMoney, requiredPositiveInt } = require('./commonRules');

const createDetalleVentaValidator = [
  requiredPositiveInt('ventaId', 'ventaId'),
  requiredPositiveInt('productoId', 'productoId'),
  requiredPositiveInt('cantidad', 'cantidad'),
  optionalMoney('precioUnitario', 'precioUnitario'),
  optionalMoney('subtotal', 'subtotal'),
  validationHandler
];

const updateDetalleVentaValidator = [
  requiredPositiveInt('ventaId', 'ventaId').optional(),
  requiredPositiveInt('productoId', 'productoId').optional(),
  requiredPositiveInt('cantidad', 'cantidad').optional(),
  optionalMoney('precioUnitario', 'precioUnitario'),
  optionalMoney('subtotal', 'subtotal'),
  validationHandler
];

module.exports = {
  createDetalleVentaValidator,
  updateDetalleVentaValidator
};
