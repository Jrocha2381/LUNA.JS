'use strict';

const express = require('express');

function crudRouter(model) {
  const router = express.Router();

  router.get('/', async (_req, res, next) => {
    try {
      const rows = await model.findAll();
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const row = await model.findByPk(req.params.id);
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(row);
    } catch (err) {
      next(err);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const created = await model.create(req.body);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  });

  router.put('/:id', async (req, res, next) => {
    try {
      const row = await model.findByPk(req.params.id);
      if (!row) return res.status(404).json({ error: 'Not found' });
      await row.update(req.body);
      res.json(row);
    } catch (err) {
      next(err);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const row = await model.findByPk(req.params.id);
      if (!row) return res.status(404).json({ error: 'Not found' });
      await row.destroy();
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = crudRouter;

