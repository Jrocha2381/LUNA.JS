'use strict';

const express = require('express');
const ctrl = require('../controllers/compras.controller');
const {
  createCompraValidator,
  updateCompraValidator
} = require('../validators/compra.validator');
const { idValidator } = require('./crudRouter');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', idValidator, ctrl.getById);
router.post('/', createCompraValidator, ctrl.create);
router.put('/:id', idValidator, updateCompraValidator, ctrl.update);
router.delete('/:id', idValidator, ctrl.remove);

module.exports = router;

