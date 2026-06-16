'use strict';

const { Producto } = require('../../models');
const createCrudController = require('./crud.controller');

const controller = createCrudController(Producto);

const SAFE_USER_ATTRIBUTES = [
  'id',
  'nombre',
  'categoriaId',
  'precio',
  'stock',
  'seguimientoInventario',
  'createdAt',
  'updatedAt'
];

function canSeeCosto(req) {
  return req.user && req.user.role === 'ADMIN';
}

async function list(req, res, next) {
  try {
    const rows = await Producto.findAll({
      attributes: canSeeCosto(req) ? undefined : SAFE_USER_ATTRIBUTES
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const row = await Producto.findByPk(req.params.id, {
      attributes: canSeeCosto(req) ? undefined : SAFE_USER_ATTRIBUTES
    });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  ...controller,
  list,
  getById
};
