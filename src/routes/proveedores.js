'use strict';

const express = require('express');
const ctrl = require('../controllers/proveedores.controller');
const {
  createContactoValidator,
  updateContactoValidator
} = require('../validators/personaContacto.validator');
const { idValidator } = require('./crudRouter');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', idValidator, ctrl.getById);
router.post('/', createContactoValidator, ctrl.create);
router.put('/:id', idValidator, updateContactoValidator, ctrl.update);
router.delete('/:id', idValidator, ctrl.remove);

module.exports = router;

