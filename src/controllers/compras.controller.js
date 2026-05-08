'use strict';

const { Compra } = require('../../models');
const createCrudController = require('./crud.controller');

module.exports = createCrudController(Compra);
