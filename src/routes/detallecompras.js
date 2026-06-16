'use strict';

const express = require('express');
const ctrl = require('../controllers/detallecompras.controller');
const authJwt = require('../middlewares/authJwt');
const requireRole = require('../middlewares/requireRole');
const {
  createDetalleCompraValidator,
  updateDetalleCompraValidator
} = require('../validators/detalleCompra.validator');
const { idValidator } = require('./crudRouter');

const router = express.Router();
const requireAdmin = [authJwt, requireRole('ADMIN')];

router.get('/', requireAdmin, ctrl.list);
router.get('/:id', requireAdmin, idValidator, ctrl.getById);
router.post('/', requireAdmin, createDetalleCompraValidator, ctrl.create);
router.put('/:id', requireAdmin, idValidator, updateDetalleCompraValidator, ctrl.update);
router.delete('/:id', requireAdmin, idValidator, ctrl.remove);

module.exports = router;
