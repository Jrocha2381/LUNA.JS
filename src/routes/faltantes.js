'use strict';

const express = require('express');
const ctrl = require('../controllers/faltantes.controller');
const {
  createFaltanteValidator,
  markResolvedValidator,
  listFaltantesFilterValidator
} = require('../validators/faltante.validator');
const { idValidator } = require('./crudRouter');
const authJwt = require('../middlewares/authJwt');
const requireRole = require('../middlewares/requireRole');

const router = express.Router();

// Lectura: admin/usuario (según sesión, como el resto de la app usa auth en routers)
router.get('/', authJwt, listFaltantesFilterValidator, ctrl.list);
router.get('/:id', authJwt, idValidator, ctrl.getById);

// Escritura: ADMIN
router.post('/', authJwt, requireRole('ADMIN'), createFaltanteValidator, ctrl.create);
router.put('/:id/resuelto', authJwt, requireRole('ADMIN'), markResolvedValidator, ctrl.markResolved);

router.get('/insights', authJwt, listFaltantesFilterValidator, ctrl.insights);

module.exports = router;

