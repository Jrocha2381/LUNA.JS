'use strict';

function createCrudController(model) {
  async function list(_req, res, next) {
    try {
      const rows = await model.findAll();
      res.json(rows);
    } catch (err) {
      next(err);
    }
  }

  async function getById(req, res, next) {
    try {
      const row = await model.findByPk(req.params.id);
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    } catch (err) {
      next(err);
    }
  }

  async function create(req, res, next) {
    try {
      const created = await model.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }

  async function update(req, res, next) {
    try {
      const row = await model.findByPk(req.params.id);
      if (!row) return res.status(404).json({ error: 'Not found' });
      await row.update(req.body);
      res.json(row);
    } catch (err) {
      next(err);
    }
  }

  async function remove(req, res, next) {
    try {
      const row = await model.findByPk(req.params.id);
      if (!row) return res.status(404).json({ error: 'Not found' });
      await row.destroy();
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }

  return { list, getById, create, update, remove };
}

module.exports = createCrudController;
