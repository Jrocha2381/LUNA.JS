'use strict';

const { body } = require('express-validator');
const validationHandler = require('./validationHandler');
const { optionalEmail, optionalString, requiredString } = require('./commonRules');

const createContactoValidator = [
  requiredString('nombre', 'El nombre'),
  optionalString('telefono', 'El telefono', 30),
  optionalEmail(),
  validationHandler
];

const updateContactoValidator = [
  body('nombre')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacio')
    .isLength({ max: 160 })
    .withMessage('El nombre no puede superar 160 caracteres'),
  optionalString('telefono', 'El telefono', 30),
  optionalEmail(),
  validationHandler
];

module.exports = {
  createContactoValidator,
  updateContactoValidator
};
