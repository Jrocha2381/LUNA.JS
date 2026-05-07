'use strict';

const crudRouter = require('./crudRouter');
const { Categoria } = require('../../models');

module.exports = crudRouter(Categoria);

