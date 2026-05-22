'use strict';

const { Venta, DetalleVenta, Producto, Cliente, Usuario, Descuento, sequelize } = require('../../models');

function round2(n) {
  const num = Number(n || 0);
  return Math.round((Number.isFinite(num) ? num : 0) * 100) / 100;
}

function computeDiscountAmount(subtotal, descuento) {
  const base = Math.max(0, Number(subtotal || 0));
  if (!descuento) return 0;

  const tipo = (descuento.tipo || '').toString().trim();
  const valor = Number(descuento.valor || 0);

  let amount = 0;
  if (tipo === 'porcentaje') {
    amount = base * (Math.max(0, Math.min(100, valor)) / 100);
  } else if (tipo === 'fijo') {
    amount = Math.max(0, valor);
  } else {
    amount = 0;
  }

  amount = Math.min(base, amount);
  return round2(amount);
}

async function inferSubtotalForVenta(venta, { transaction } = {}) {
  const currentSubtotal = Number(venta.subtotal || 0);
  if (Number.isFinite(currentSubtotal) && currentSubtotal > 0) return currentSubtotal;

  const itemsArray = Array.isArray(venta.items) ? venta.items : [];
  const itemsTotal = itemsArray.reduce((sum, item) => sum + Number(item?.subtotal || 0), 0);
  if (Number.isFinite(itemsTotal) && itemsTotal > 0) return itemsTotal;

  const detalles = await DetalleVenta.findAll({
    where: { ventaId: venta.id },
    attributes: ['subtotal'],
    transaction
  });
  const detallesTotal = detalles.reduce((sum, d) => sum + Number(d.subtotal || 0), 0);
  if (Number.isFinite(detallesTotal) && detallesTotal > 0) return detallesTotal;

  const total = Number(venta.total || 0);
  const aplicado = Number(venta.descuentoAplicado || 0);
  return Math.max(0, total + aplicado);
}

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
        { model: Descuento, as: 'descuento' },
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
        { model: Descuento, as: 'descuento' },
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
  const { clienteId = null, usuarioId = null, metodoPago = null, descuentoId = null } = req.body || {};
  const items = coerceItems(req.body?.items);

  try {
    const created = await sequelize.transaction(async (t) => {
      const totalFromItems = items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
      const subtotal = Number.isFinite(Number(req.body?.total)) ? Number(req.body.total) : totalFromItems;

      let descuento = null;
      if (descuentoId) {
        descuento = await Descuento.findByPk(descuentoId, { transaction: t });
        if (!descuento) {
          const err = new Error('Descuento no encontrado');
          err.status = 404;
          throw err;
        }
        if (!descuento.activo) {
          const err = new Error('El descuento no está activo');
          err.status = 400;
          throw err;
        }
      }

      const descuentoAplicado = computeDiscountAmount(subtotal, descuento);
      const total = round2(Math.max(0, Number(subtotal || 0) - descuentoAplicado));

      const venta = await Venta.create(
        {
          clienteId: clienteId || null,
          usuarioId: usuarioId || null,
          metodoPago: metodoPago || null,
          subtotal,
          descuentoId: descuento ? descuento.id : null,
          descuentoAplicado,
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
        { model: Descuento, as: 'descuento' },
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
    if (Object.prototype.hasOwnProperty.call(req.body || {}, 'total') && Number(req.body.total) < 0) {
      return res.status(400).json({ error: 'No se permiten totales negativos' });
    }
    await row.update(req.body);
    res.json(row);
  } catch (err) {
    next(err);
  }
}

async function applyDiscount(req, res, next) {
  const descuentoId = Number(req.body?.descuentoId);

  try {
    const updated = await sequelize.transaction(async (t) => {
      const venta = await Venta.findByPk(req.params.id, { transaction: t });
      if (!venta) {
        const err = new Error('Not found');
        err.status = 404;
        throw err;
      }

      const descuento = await Descuento.findByPk(descuentoId, { transaction: t });
      if (!descuento) {
        const err = new Error('Descuento no encontrado');
        err.status = 404;
        throw err;
      }
      if (!descuento.activo) {
        const err = new Error('El descuento no está activo');
        err.status = 400;
        throw err;
      }

      const subtotal = await inferSubtotalForVenta(venta, { transaction: t });
      const descuentoAplicado = computeDiscountAmount(subtotal, descuento);
      const total = round2(Math.max(0, Number(subtotal || 0) - descuentoAplicado));

      await venta.update(
        {
          subtotal,
          descuentoId: descuento.id,
          descuentoAplicado,
          total
        },
        { transaction: t }
      );

      return venta;
    });

    const hydrated = await Venta.findByPk(updated.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo', 'rol'] },
        { model: Descuento, as: 'descuento' },
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });

    res.json(hydrated);
  } catch (err) {
    next(err);
  }
}

async function removeDiscount(req, res, next) {
  try {
    const updated = await sequelize.transaction(async (t) => {
      const venta = await Venta.findByPk(req.params.id, { transaction: t });
      if (!venta) {
        const err = new Error('Not found');
        err.status = 404;
        throw err;
      }

      const subtotal = await inferSubtotalForVenta(venta, { transaction: t });
      await venta.update(
        {
          subtotal,
          descuentoId: null,
          descuentoAplicado: 0,
          total: round2(Math.max(0, Number(subtotal || 0)))
        },
        { transaction: t }
      );

      return venta;
    });

    const hydrated = await Venta.findByPk(updated.id, {
      include: [
        { model: Cliente, as: 'cliente' },
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo', 'rol'] },
        { model: Descuento, as: 'descuento' },
        {
          model: DetalleVenta,
          as: 'detalles',
          include: [{ model: Producto, as: 'producto' }]
        }
      ]
    });

    res.json(hydrated);
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

module.exports = { list, getById, create, update, applyDiscount, removeDiscount, remove };
