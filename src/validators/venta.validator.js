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

const createReembolsoValidator = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('items debe tener al menos un producto a reembolsar'),
  body('items.*.productoId')
    .isInt({ min: 1 })
    .withMessage('productoId debe ser un entero positivo'),
  body('items.*.cantidad')
    .isInt({ min: 1 })
    .withMessage('cantidad debe ser un entero positivo'),
  body('items.*.retornaInventario')
    .optional({ nullable: true })
    .isBoolean()
    .withMessage('retornaInventario debe ser booleano'),
  body('motivo')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 250 })
    .withMessage('motivo no puede superar 250 caracteres'),
  validationHandler
];

module.exports = {
  createVentaValidator,
  updateVentaValidator,
  applyVentaDescuentoValidator,
  createReembolsoValidator
};
