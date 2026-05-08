'use strict';

const { body } = require('express-validator');
const validationHandler = require('./validationHandler');
const { requiredString } = require('./commonRules');

const createCategoriaValidator = [
  requiredString('nombre', 'El nombre', 120),
  validationHandler
];

const updateCategoriaValidator = [
  body('nombre')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacio')
    .isLength({ max: 120 })
    .withMessage('El nombre no puede superar 120 caracteres'),
  validationHandler
];

module.exports = {
  createCategoriaValidator,
  updateCategoriaValidator
};
