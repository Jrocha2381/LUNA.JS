'use strict';

const express = require('express');
const ctrl = require('../controllers/reportes.controller');

const router = express.Router();

router.get('/resumen', ctrl.resumen);
router.get('/ventas-totales', ctrl.ventasTotales);
router.get('/productos-mas-vendidos', ctrl.productosMasVendidos);
router.get('/compras-registradas', ctrl.comprasRegistradas);
router.get('/faltantes-frecuentes', ctrl.faltantesFrecuentes);

module.exports = router;
