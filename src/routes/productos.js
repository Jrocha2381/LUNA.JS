'use strict';

const crudRouter = require('./crudRouter');
const { Producto } = require('../../models');
const {
  createProductoValidator,
  updateProductoValidator
} = require('../validators/producto.validator');

module.exports = crudRouter(Producto, {
  create: createProductoValidator,
  update: updateProductoValidator
});

