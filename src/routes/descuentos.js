'use strict';

const express = require('express');
const ctrl = require('../controllers/descuentos.controller');
const { createDescuentoValidator, updateDescuentoValidator } = require('../validators/descuento.validator');
const { idValidator } = require('./crudRouter');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', idValidator, ctrl.getById);
router.post('/', createDescuentoValidator, ctrl.create);
router.put('/:id', idValidator, updateDescuentoValidator, ctrl.update);
router.delete('/:id', idValidator, ctrl.remove);

module.exports = router;

