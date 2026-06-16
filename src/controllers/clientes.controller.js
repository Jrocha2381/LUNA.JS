'use strict';

const { Cliente } = require('../../models');
const createCrudController = require('./crud.controller');

module.exports = createCrudController(Cliente);
