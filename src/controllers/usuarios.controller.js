'use strict';

const { Usuario } = require('../../models');
const createCrudController = require('./crud.controller');

module.exports = createCrudController(Usuario);
