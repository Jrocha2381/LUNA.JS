'use strict';

const express = require('express');
const ctrl = require('../controllers/descuentos.controller');
const authJwt = require('../middlewares/authJwt');
const requireRole = require('../middlewares/requireRole');
const { createDescuentoValidator, updateDescuentoValidator } = require('../validators/descuento.validator');
const { idValidator } = require('./crudRouter');

const router = express.Router();
const requireAdmin = [authJwt, requireRole('ADMIN')];

router.get('/', ctrl.list);
router.get('/:id', idValidator, ctrl.getById);
router.post('/', requireAdmin, createDescuentoValidator, ctrl.create);
router.put('/:id', requireAdmin, idValidator, updateDescuentoValidator, ctrl.update);
router.delete('/:id', requireAdmin, idValidator, ctrl.remove);

module.exports = router;

