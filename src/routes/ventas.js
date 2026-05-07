'use strict';

const crudRouter = require('./crudRouter');
const { Venta } = require('../../models');

module.exports = crudRouter(Venta);

