'use strict';

const express = require('express');
const ctrl = require('../controllers/detallecompras.controller');
const {
  createDetalleCompraValidator,
  updateDetalleCompraValidator
} = require('../validators/detalleCompra.validator');
const { idValidator } = require('./crudRouter');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', idValidator, ctrl.getById);
router.post('/', createDetalleCompraValidator, ctrl.create);
router.put('/:id', idValidator, updateDetalleCompraValidator, ctrl.update);
router.delete('/:id', idValidator, ctrl.remove);

module.exports = router;
