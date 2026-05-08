// Controlador de Compras
const { Compra } = require('../../models');

// GET /api/compras
exports.list = async (req, res, next) => {
  try {
    const compras = await Compra.findAll();
    return res.status(200).json(compras);
  } catch (err) {
    return next(err);
  }
};

// GET /api/compras/:id
exports.show = async (req, res, next) => {
  try {
    const { id } = req.params;

    const compra = await Compra.findByPk(id);
    if (!compra) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    return res.status(200).json(compra);
  } catch (err) {
    return next(err);
  }
};

// POST /api/compras
exports.create = async (req, res, next) => {
  try {
    const nueva = await Compra.create(req.body);
    return res.status(201).json(nueva);
  } catch (err) {
    return next(err);
  }
};

// PUT /api/compras/:id
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [updated] = await Compra.update(req.body, { where: { id } });
    if (!updated) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    const compra = await Compra.findByPk(id);
    return res.status(200).json(compra);
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/compras/:id
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await Compra.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ error: 'Compra no encontrada' });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

