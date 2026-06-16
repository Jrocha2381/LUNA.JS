'use strict';

const { body } = require('express-validator');
const validationHandler = require('./validationHandler');
const { optionalEmail, requiredString } = require('./commonRules');

const createUsuarioValidator = [
  requiredString('nombre', 'El nombre'),
  requiredString('username', 'El username'),
  requiredString('password', 'El password'),
  optionalEmail(),
  body('rol')
    .optional()
    .trim()
    .isLength({ max: 40 })
    .withMessage('El rol no puede superar 40 caracteres'),
  body('role')
    .optional()
    .trim()
    .isIn(['USER', 'ADMIN'])
    .withMessage('El role debe ser USER o ADMIN'),
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
  body('username')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El username no puede estar vacio')
    .isLength({ max: 160 })
    .withMessage('El username no puede superar 160 caracteres'),
  body('password')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El password no puede estar vacio')
    .isLength({ max: 200 })
    .withMessage('El password no puede superar 200 caracteres'),
  body('rol')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('El rol no puede estar vacio')
    .isLength({ max: 40 })
    .withMessage('El rol no puede superar 40 caracteres'),
  body('role')
    .optional()
    .trim()
    .isIn(['USER', 'ADMIN'])
    .withMessage('El role debe ser USER o ADMIN'),
  validationHandler
];

module.exports = {
  createUsuarioValidator,
  updateUsuarioValidator
};
