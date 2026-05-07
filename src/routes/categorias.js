'use strict';

const express = require('express');
const { Categoria } = require('../../models');

const ctrl = require('../controllers/categorias.controller');
const {
  createRules,
  updateRules,
  handleValidationErrors,
} = require('../validators/categoria.validator');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.show);

router.post('/', createRules, handleValidationErrors, ctrl.create);
router.put('/:id', updateRules, handleValidationErrors, ctrl.update);
router.delete('/:id', ctrl.remove);

module.exports = router;


