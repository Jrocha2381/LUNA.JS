'use strict';

const { Venta } = require('../../models');
const createCrudController = require('./crud.controller');

module.exports = createCrudController(Venta);
