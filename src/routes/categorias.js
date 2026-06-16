'use strict';

const express = require('express');
const ctrl = require('../controllers/categorias.controller');
const {
  createCategoriaValidator,
  updateCategoriaValidator
} = require('../validators/categoria.validator');
const { idValidator } = require('./crudRouter');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', idValidator, ctrl.getById);
router.post('/', createCategoriaValidator, ctrl.create);
router.put('/:id', idValidator, updateCategoriaValidator, ctrl.update);
router.delete('/:id', idValidator, ctrl.remove);

module.exports = router;

