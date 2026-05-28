'use strict';

const express = require('express');
const ctrl = require('../controllers/detalleventas.controller');
const authJwt = require('../middlewares/authJwt');
const requireRole = require('../middlewares/requireRole');
const {
  createDetalleVentaValidator,
  updateDetalleVentaValidator
} = require('../validators/detalleVenta.validator');
const { idValidator } = require('./crudRouter');

const router = express.Router();
const requireAdmin = [authJwt, requireRole('ADMIN')];

router.get('/', requireAdmin, ctrl.list);
router.get('/:id', requireAdmin, idValidator, ctrl.getById);
router.post('/', requireAdmin, createDetalleVentaValidator, ctrl.create);
router.put('/:id', requireAdmin, idValidator, updateDetalleVentaValidator, ctrl.update);
router.delete('/:id', requireAdmin, idValidator, ctrl.remove);

module.exports = router;
