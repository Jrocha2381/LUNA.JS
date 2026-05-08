'use strict';

const { Producto } = require('../../models');
const createCrudController = require('./crud.controller');

module.exports = createCrudController(Producto);
