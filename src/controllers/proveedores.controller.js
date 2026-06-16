'use strict';

const { Proveedor } = require('../../models');
const createCrudController = require('./crud.controller');

module.exports = createCrudController(Proveedor);
