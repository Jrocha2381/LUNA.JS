'use strict';

const express = require('express');
const ctrl = require('../controllers/productos.controller');
const {
  createProductoValidator,
  updateProductoValidator
} = require('../validators/producto.validator');
const { idValidator } = require('./crudRouter');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', idValidator, ctrl.getById);
router.post('/', createProductoValidator, ctrl.create);
router.put('/:id', idValidator, updateProductoValidator, ctrl.update);
router.delete('/:id', idValidator, ctrl.remove);

module.exports = router;

