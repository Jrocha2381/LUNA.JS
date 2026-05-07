'use strict';

const crudRouter = require('./crudRouter');
const { Producto } = require('../../models');

module.exports = crudRouter(Producto);

