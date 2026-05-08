// Controlador de Clientes
const { Cliente } = require('../../models');

// GET /api/clientes
exports.list = async (req, res, next) => {
  try {
    const { nombre, telefono, correo } = req.query;

    const where = {};
    if (nombre) where.nombre = nombre;
    if (telefono) where.telefono = telefono;
    if (correo) where.correo = correo;

    const clientes = await Cliente.findAll({ where });
    return res.status(200).json(clientes);
  } catch (err) {
    return next(err);
  }
};

// GET /api/clientes/:id
exports.show = async (req, res, next) => {
  try {
    const { id } = req.params;

    const cliente = await Cliente.findByPk(id);

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    return res.status(200).json(cliente);
  } catch (err) {
    return next(err);
  }
};

// POST /api/clientes
exports.create = async (req, res, next) => {
  try {
    const nuevo = await Cliente.create(req.body);
    return res.status(201).json(nuevo);
  } catch (err) {
    return next(err);
  }
};

// PUT /api/clientes/:id
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [updated] = await Cliente.update(req.body, { where: { id } });

    if (!updated) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const cliente = await Cliente.findByPk(id);
    return res.status(200).json(cliente);
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/clientes/:id
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await Cliente.destroy({ where: { id } });

    if (!deleted) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

