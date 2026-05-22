'use strict';

const express = require('express');
const ctrl = require('../controllers/ventas.controller');
const {
  createVentaValidator,
  updateVentaValidator,
  applyVentaDescuentoValidator
} = require('../validators/venta.validator');
const { idValidator } = require('./crudRouter');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', idValidator, ctrl.getById);
router.post('/', createVentaValidator, ctrl.create);
router.post('/:id/descuento', idValidator, applyVentaDescuentoValidator, ctrl.applyDiscount);
router.delete('/:id/descuento', idValidator, ctrl.removeDiscount);
router.put('/:id', idValidator, updateVentaValidator, ctrl.update);
router.delete('/:id', idValidator, ctrl.remove);

module.exports = router;

