'use strict';

const express = require('express');
const ctrl = require('../controllers/detalleventas.controller');
const {
  createDetalleVentaValidator,
  updateDetalleVentaValidator
} = require('../validators/detalleVenta.validator');
const { idValidator } = require('./crudRouter');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', idValidator, ctrl.getById);
router.post('/', createDetalleVentaValidator, ctrl.create);
router.put('/:id', idValidator, updateDetalleVentaValidator, ctrl.update);
router.delete('/:id', idValidator, ctrl.remove);

module.exports = router;
