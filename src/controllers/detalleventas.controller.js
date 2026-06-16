'use strict';

const { DetalleVenta } = require('../../models');
const createCrudController = require('./crud.controller');

module.exports = createCrudController(DetalleVenta);
