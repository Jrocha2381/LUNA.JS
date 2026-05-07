'use strict';

const crudRouter = require('./crudRouter');
const { DetalleVenta } = require('../../models');

module.exports = crudRouter(DetalleVenta);
