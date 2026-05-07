'use strict';

const crudRouter = require('./crudRouter');
const { Compra } = require('../../models');

module.exports = crudRouter(Compra);

