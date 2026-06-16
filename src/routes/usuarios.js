'use strict';

const express = require('express');
const ctrl = require('../controllers/usuarios.controller');
const {
  createUsuarioValidator,
  updateUsuarioValidator
} = require('../validators/usuario.validator');
const { idValidator } = require('./crudRouter');

const router = express.Router();

router.get('/', ctrl.list);
router.get('/:id', idValidator, ctrl.getById);
router.post('/', createUsuarioValidator, ctrl.create);
router.put('/:id', idValidator, updateUsuarioValidator, ctrl.update);
router.delete('/:id', idValidator, ctrl.remove);

module.exports = router;

