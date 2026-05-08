// Controlador de Ventas
const { Venta } = require('../../models');

// GET /api/ventas
exports.list = async (req, res, next) => {
  try {
    const ventas = await Venta.findAll();
    return res.status(200).json(ventas);
  } catch (err) {
    return next(err);
  }
};

// GET /api/ventas/:id
exports.show = async (req, res, next) => {
  try {
    const { id } = req.params;

    const venta = await Venta.findByPk(id);
    if (!venta) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    return res.status(200).json(venta);
  } catch (err) {
    return next(err);
  }
};

// POST /api/ventas
exports.create = async (req, res, next) => {
  try {
    const nueva = await Venta.create(req.body);
    return res.status(201).json(nueva);
  } catch (err) {
    return next(err);
  }
};

// PUT /api/ventas/:id
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [updated] = await Venta.update(req.body, { where: { id } });
    if (!updated) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    const venta = await Venta.findByPk(id);
    return res.status(200).json(venta);
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/ventas/:id
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await Venta.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ error: 'Venta no encontrada' });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

