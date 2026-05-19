'use strict';

const { Venta, DetalleVenta, Producto, Cliente, Usuario, sequelize } = require('../../models');

function coerceItems(rawItems) {
  if (!rawItems) return [];
  if (!Array.isArray(rawItems)) return [];
  return rawItems
    .map((item) => ({
      productoId: Number(item.productoId ?? item.productId ?? item.idProducto ?? item.producto?.id),
      cantidad: Number(item.cantidad ?? item.quantity ?? 1),
      precioUnitario: Number(item.precioUnitario ?? item.price ?? item.precio ?? 0),
      subtotal: Number(item.subtotal ?? (Number(item.cantidad ?? item.quantity ?? 1) * Number(item.precioUnitario ?? item.price ?? item.precio ?? 0)))
    }))
    .filter((item) => Number.isFinite(item.productoId) && item.productoId > 0 && Number.isFinite(item.cantidad) && item.cantidad > 0);
}

async function list(_req, res, next) {
  try {
    const rows = await Venta.findAll({
      order: [['id', 'DESC']],
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo', 'rol'] },
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const row = await Venta.findByPk(req.params.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo', 'rol'] },
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  const { clienteId = null, usuarioId = null, metodoPago = null } = req.body || {};
  const items = coerceItems(req.body?.items);

  try {
    const created = await sequelize.transaction(async (t) => {
      const totalFromItems = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
      const total = Number.isFinite(Number(req.body?.total)) ? Number(req.body.total) : totalFromItems;

      const venta = await Venta.create(
        {
          clienteId: clienteId || null,
          usuarioId: usuarioId || null,
          metodoPago: metodoPago || null,
          total,
          items: req.body?.items || []
        },
        { transaction: t }
      );

      if (items.length > 0) {
        const detalleRows = items.map((item) => ({
          ventaId: venta.id,
          productoId: item.productoId,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.subtotal
        }));
        await DetalleVenta.bulkCreate(detalleRows, { transaction: t });
      }

      return venta;
    });

    const hydrated = await Venta.findByPk(created.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo', 'rol'] },
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });

    res.status(201).json(hydrated);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const row = await Venta.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await row.update(req.body);
    res.json(row);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const row = await Venta.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await row.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
