'use strict';

const { Categoria } = require('../../models');

// GET /  -> listar
const list = async (_req, res, next) => {
  try {
    const categorias = await Categoria.findAll();
    res.json(categorias);
  } catch (err) {
    next(err);
  }
};

// GET /:id -> mostrar
const show = async (req, res, next) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) return res.status(404).json({ error: 'Categoria no encontrada' });
    res.json(categoria);
  } catch (err) {
    next(err);
  }
};

// POST / -> crear
const create = async (req, res, next) => {
  try {
    const nueva = await Categoria.create(req.body);
    res.status(201).json(nueva);
  } catch (err) {
    next(err);
  }
};

// PUT /:id -> actualizar
const update = async (req, res, next) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) return res.status(404).json({ error: 'Categoria no encontrada' });

    await categoria.update(req.body);
    res.json(categoria);
  } catch (err) {
    next(err);
  }
};

// DELETE /:id -> eliminar
const remove = async (req, res, next) => {
  try {
    const categoria = await Categoria.findByPk(req.params.id);
    if (!categoria) return res.status(404).json({ error: 'Categoria no encontrada' });

    await categoria.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  show,
  create,
  update,
  remove,
};

