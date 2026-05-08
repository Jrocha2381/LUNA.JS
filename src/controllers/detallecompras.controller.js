'use strict';

const { DetalleCompra } = require('../../models');
const createCrudController = require('./crud.controller');

module.exports = createCrudController(DetalleCompra);
