'use strict';

const crudRouter = require('./crudRouter');
const { Proveedor } = require('../../models');

module.exports = crudRouter(Proveedor);

