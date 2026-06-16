'use strict';

const { body } = require('express-validator');
const validationHandler = require('./validationHandler');

function nombreRule() {
  return body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es obligatorio')
    .isLength({ max: 160 })
    .withMessage('El nombre no puede superar 160 characteres');
}

function categoriaRule() {
  return body('categoriaId')
    .isInt({ min: 1 })
    .withMessage('La categoriaId debe ser un entero positivo')
    .toInt();
}

function precioRule() {
  return body('precio')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El precio debe ser un numero mayor o igual a 0')
    .toFloat();
}

function costoRule() {
  return body('costo')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El costo debe ser un numero mayor o igual a 0')
    .toFloat();
}

function stockRule() {
  return body('stock')
    .optional()
    .isInt({ min: 0 })
    .withMessage('El stock debe ser un entero mayor o igual a 0')
    .toInt();
}

function seguimientoRule() {
  return body('seguimientoInventario')
    .optional()
    .isBoolean()
    .withMessage('seguimientoInventario debe ser booleano')
    .toBoolean();
}

const createProductoValidator = [
  nombreRule(),
  categoriaRule(),
  precioRule(),
  costoRule(),
  stockRule(),
  seguimientoRule(),
  validationHandler
];

const updateProductoValidator = [
  body('nombre')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacio')
    .isLength({ max: 160 })
    .withMessage('El nombre no puede superar 160 caracteres'),
  body('categoriaId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La categoriaId debe ser un entero positivo')
    .toInt(),
  precioRule(),
  costoRule(),
  stockRule(),
  seguimientoRule(),
  validationHandler
];

module.exports = {
  createProductoValidator,
  updateProductoValidator
};
