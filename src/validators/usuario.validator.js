'use strict';

const { body } = require('express-validator');
const validationHandler = require('./validationHandler');
const { optionalEmail, requiredString } = require('./commonRules');

const createUsuarioValidator = [
  requiredString('nombre', 'El nombre'),
  optionalEmail(),
  body('rol')
    .optional()
    .trim()
    .isLength({ max: 40 })
    .withMessage('El rol no puede superar 40 caracteres'),
  validationHandler
];

const updateUsuarioValidator = [
  body('nombre')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El nombre no puede estar vacio')
    .isLength({ max: 160 })
    .withMessage('El nombre no puede superar 160 caracteres'),
  optionalEmail(),
  body('rol')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El rol no puede estar vacio')
    .isLength({ max: 40 })
    .withMessage('El rol no puede superar 40 caracteres'),
  validationHandler
];

module.exports = {
  createUsuarioValidator,
  updateUsuarioValidator
};
