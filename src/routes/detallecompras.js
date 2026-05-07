'use strict';

const crudRouter = require('./crudRouter');
const { DetalleCompra } = require('../../models');

module.exports = crudRouter(DetalleCompra);
