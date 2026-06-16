'use strict';

const { Compra, DetalleCompra, Producto, Proveedor, Usuario, sequelize } = require('../../models');

function coerceItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .map((item) => {
      const cantidad = Math.max(1, Math.floor(Number(item.cantidad ?? item.quantity ?? 1)));
      const costoUnitario = Number(item.costoUnitario ?? item.costo ?? item.cost ?? item.precio ?? 0);
      const subtotal = Number(item.subtotal ?? cantidad * costoUnitario);

      return {
        productoId: Number(item.productoId ?? item.productId ?? item.idProducto ?? item.id ?? item.producto?.id),
        cantidad,
        costoUnitario,
        subtotal
      };
    })
    .filter((item) => (
      Number.isInteger(item.productoId) &&
      item.productoId > 0 &&
      Number.isInteger(item.cantidad) &&
      item.cantidad > 0 &&
      Number.isFinite(item.costoUnitario) &&
      item.costoUnitario >= 0
    ));
}

function includeCompra() {
  return [
    { model: Proveedor, as: 'proveedor' },
    { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo', 'rol'] },
    {
      model: DetalleCompra,
      as: 'detalles',
      include: [{ model: Producto, as: 'producto' }]
    }
  ];
}

async function list(_req, res, next) {
  try {
    const rows = await Compra.findAll({
      order: [['id', 'DESC']],
      include: includeCompra()
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const row = await Compra.findByPk(req.params.id, { include: includeCompra() });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  const { proveedorId = null, usuarioId = null, fecha = null } = req.body || {};
  const items = coerceItems(req.body?.items);

  if (items.length === 0) {
    return res.status(400).json({ error: 'La compra debe tener al menos un producto valido' });
  }

  try {
    const created = await sequelize.transaction(async (transaction) => {
      const totalFromItems = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
      const total = Number.isFinite(Number(req.body?.total)) ? Number(req.body.total) : totalFromItems;

      const compra = await Compra.create(
        {
          fecha: fecha || new Date(),
          proveedorId: proveedorId || null,
          usuarioId: usuarioId || null,
          total,
          items: req.body?.items || []
        },
        { transaction }
      );

      await DetalleCompra.bulkCreate(
        items.map((item) => ({
          compraId: compra.id,
          productoId: item.productoId,
          cantidad: item.cantidad,
          costoUnitario: item.costoUnitario,
          subtotal: item.subtotal
        })),
        { transaction }
      );

      for (const item of items) {
        const producto = await Producto.findByPk(item.productoId, { transaction });
        if (!producto) {
          const error = new Error(`Producto ${item.productoId} no encontrado`);
          error.status = 400;
          throw error;
        }

        await producto.update(
          {
            costo: item.costoUnitario,
            stock: Number(producto.stock || 0) + item.cantidad
          },
          { transaction }
        );
      }

      return compra;
    });

    const hydrated = await Compra.findByPk(created.id, { include: includeCompra() });
    res.status(201).json(hydrated);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const row = await Compra.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await row.update(req.body);
    res.json(row);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const row = await Compra.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    await row.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
