'use strict';

const { Descuento } = require('../../models');
const createCrudController = require('./crud.controller');

module.exports = createCrudController(Descuento);

