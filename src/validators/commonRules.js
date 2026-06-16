'use strict';

const { body } = require('express-validator');

function requiredString(field, label, max = 160) {
  return body(field)
    .trim()
    .notEmpty()
    .withMessage(`${label} es obligatorio`)
    .isLength({ max })
    .withMessage(`${label} no puede superar ${max} caracteres`);
}

function optionalString(field, label, max = 160) {
  return body(field)
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max })
    .withMessage(`${label} no puede superar ${max} caracteres`);
}

function optionalEmail(field = 'correo') {
  return body(field)
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage('El correo debe tener un formato valido')
    .isLength({ max: 160 })
    .withMessage('El correo no puede superar 160 caracteres');
}

function requiredPositiveInt(field, label) {
  return body(field)
    .isInt({ min: 1 })
    .withMessage(`${label} debe ser un entero positivo`)
    .toInt();
}

function optionalPositiveInt(field, label) {
  return body(field)
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage(`${label} debe ser un entero positivo`)
    .toInt();
}

function optionalMoney(field, label) {
  return body(field)
    .optional()
    .isFloat({ min: 0 })
    .withMessage(`${label} debe ser un numero mayor o igual a 0`)
    .toFloat();
}

function optionalItems() {
  return body('items')
    .optional()
    .isArray()
    .withMessage('items debe ser un arreglo');
}

module.exports = {
  optionalEmail,
  optionalItems,
  optionalMoney,
  optionalPositiveInt,
  optionalString,
  requiredPositiveInt,
  requiredString
};
