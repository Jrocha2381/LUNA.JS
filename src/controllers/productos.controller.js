// Controlador de Productos
const { Producto } = require('../../models');

// GET /api/productos
exports.list = async (req, res, next) => {
  try {
    const { nombre, precio } = req.query;

    const where = {};
    if (nombre) where.nombre = nombre;
    if (precio !== undefined) where.precio = precio;

    const productos = await Producto.findAll({ where });
    return res.status(200).json(productos);
  } catch (err) {
    return next(err);
  }
};

// GET /api/productos/:id
exports.show = async (req, res, next) => {
  try {
    const { id } = req.params;

    const producto = await Producto.findByPk(id);
    if (!producto) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    return res.status(200).json(producto);
  } catch (err) {
    return next(err);
  }
};

// POST /api/productos
exports.create = async (req, res, next) => {
  try {
    const nuevo = await Producto.create(req.body);
    return res.status(201).json(nuevo);
  } catch (err) {
    return next(err);
  }
};

// PUT /api/productos/:id
exports.update = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [updated] = await Producto.update(req.body, { where: { id } });
    if (!updated) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const producto = await Producto.findByPk(id);
    return res.status(200).json(producto);
  } catch (err) {
    return next(err);
  }
};

// DELETE /api/productos/:id
exports.remove = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await Producto.destroy({ where: { id } });
    if (!deleted) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
};

