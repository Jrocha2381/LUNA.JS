'use strict';

const express = require('express');
const ctrl = require('../controllers/productos.controller');
const authJwt = require('../middlewares/authJwt');
const optionalAuthJwt = require('../middlewares/optionalAuthJwt');
const requireRole = require('../middlewares/requireRole');
const {
  createProductoValidator,
  updateProductoValidator
} = require('../validators/producto.validator');
const { idValidator } = require('./crudRouter');

const router = express.Router();
const requireAdmin = [authJwt, requireRole('ADMIN')];

router.get('/', optionalAuthJwt, ctrl.list);
router.get('/:id', optionalAuthJwt, idValidator, ctrl.getById);
router.post('/', requireAdmin, createProductoValidator, ctrl.create);
router.put('/:id', requireAdmin, idValidator, updateProductoValidator, ctrl.update);
router.delete('/:id', requireAdmin, idValidator, ctrl.remove);

module.exports = router;

