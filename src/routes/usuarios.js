'use strict';

const crudRouter = require('./crudRouter');
const { Usuario } = require('../../models');

module.exports = crudRouter(Usuario);

