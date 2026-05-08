'use strict';

const { Categoria } = require('../../models');
const createCrudController = require('./crud.controller');

module.exports = createCrudController(Categoria);
