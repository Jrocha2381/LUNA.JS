'use strict';

const { body, param, query } = require('express-validator');
const validationHandler = require('./validationHandler');

function clienteIdRule() {
  return body('clienteId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('clienteId debe ser un entero positivo')
    .toInt();
}

function clienteNombreRule() {
  return body('clienteNombre')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 160 })
    .withMessage('clienteNombre no puede superar 160 caracteres');
}

function proveedorIdRule() {
  return body('proveedorId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('proveedorId debe ser un entero positivo')
    .toInt();
}

function proveedorNombreRule() {
  return body('proveedorNombre')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 160 })
    .withMessage('proveedorNombre no puede superar 160 caracteres');
}

function tipoRule() {
  return body('tipo')
    .trim()
    .notEmpty()
    .withMessage('tipo es obligatorio')
    .isLength({ max: 80 })
    .withMessage('tipo no puede superar 80 caracteres');
}

function productoIdRule() {
  return body('productoId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('productoId debe ser un entero positivo')
    .toInt();
}

function productoNombreRule() {
  return body('productoNombre')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 160 })
    .withMessage('productoNombre no puede superar 160 caracteres');
}

function productoCodigoRule() {
  return body('productoCodigo')
    .optional({ nullable: true })
    .isString()
    .isLength({ max: 80 })
    .withMessage('productoCodigo no puede superar 80 caracteres');
}

function cantidadSolicitadaRule() {
  return body('cantidadSolicitada')
    .optional()
    .isInt({ min: 1 })
    .withMessage('cantidadSolicitada debe ser un entero >= 1')
    .toInt();
}

function comentariosRule() {
  return body('comentarios')
    .optional({ nullable: true })
    .isString();
}

// Para marcar resuelto
function cantidadResueltaRule() {
  return body('cantidadResuelta')
    .optional()
    .isInt({ min: 0 })
    .withMessage('cantidadResuelta debe ser un entero >= 0')
    .toInt();
}

const createFaltanteValidator = [
  clienteIdRule(),
  clienteNombreRule(),
  proveedorIdRule(),
  proveedorNombreRule(),
  tipoRule(),
  productoIdRule(),
  productoNombreRule(),
  productoCodigoRule(),
  cantidadSolicitadaRule(),
  comentariosRule(),
  validationHandler
];

const markResolvedValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El id debe ser un entero positivo')
    .toInt(),
  cantidadResueltaRule(),
  comentariosRule(),
  validationHandler
];

const listFaltantesFilterValidator = [
  query('tipo')
    .optional()
    .isString()
    .isLength({ max: 80 })
    .withMessage('tipo no puede superar 80 caracteres'),
  query('proveedorId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('proveedorId debe ser un entero positivo')
    .toInt(),
  query('resuelto')
    .optional()
    .isBoolean()
    .withMessage('resuelto debe ser booleano')
    .toBoolean(),
  validationHandler
];

module.exports = {
  createFaltanteValidator,
  markResolvedValidator,
  listFaltantesFilterValidator
};

