'use strict';

const express = require('express');
const { param } = require('express-validator');
const createCrudController = require('../controllers/crud.controller');
const validationHandler = require('../validators/validationHandler');

const idValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El id debe ser un entero positivo')
    .toInt(),
  validationHandler
];

function crudRouter(model, validators = {}) {
  const router = express.Router();
  const controller = createCrudController(model);

  router.get('/', controller.list);
  router.get('/:id', idValidator, controller.getById);
  router.post('/', validators.create || [], controller.create);
  router.put('/:id', idValidator, validators.update || [], controller.update);
  router.delete('/:id', idValidator, controller.remove);

  return router;
}

module.exports = crudRouter;
module.exports.idValidator = idValidator;

