'use strict';

const crudRouter = require('./crudRouter');
const { Cliente } = require('../../models');

module.exports = crudRouter(Cliente);

