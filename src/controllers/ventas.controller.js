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

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_error) {
      return [];
    }
  }
  return [];
}

function coerceRefundItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];
  const grouped = new Map();
  rawItems
    .map((item) => ({
      productoId: Number(item.productoId),
      cantidad: Math.floor(Number(item.cantidad || 0)),
      retornaInventario: Boolean(item.retornaInventario)
    }))
    .filter((item) => Number.isFinite(item.productoId) && item.productoId > 0 && item.cantidad > 0)
    .forEach((item) => {
      const current = grouped.get(item.productoId) || { ...item, cantidad: 0, retornaInventario: false };
      current.cantidad += item.cantidad;
      current.retornaInventario = current.retornaInventario || item.retornaInventario;
      grouped.set(item.productoId, current);
    });

  return [...grouped.values()];
}

function groupSoldItems(detalles) {
  const grouped = new Map();

  detalles.forEach((detalle) => {
    const productoId = Number(detalle.productoId);
    if (!Number.isFinite(productoId) || productoId <= 0) return;

    const current = grouped.get(productoId) || {
      productoId,
      nombre: detalle.producto?.nombre || 'Producto',
      cantidad: 0,
      subtotal: 0,
      producto: detalle.producto || null
    };

    const cantidad = Number(detalle.cantidad || 0);
    const subtotal = Number(detalle.subtotal || 0);
    current.cantidad += Number.isFinite(cantidad) ? cantidad : 0;
    current.subtotal += Number.isFinite(subtotal) ? subtotal : 0;
    if (!current.producto && detalle.producto) current.producto = detalle.producto;
    grouped.set(productoId, current);
  });

  return grouped;
}

function groupRefundedQuantities(reembolsos) {
  const grouped = new Map();
  parseJsonArray(reembolsos).forEach((reembolso) => {
    const items = Array.isArray(reembolso?.items) ? reembolso.items : [];
    items.forEach((item) => {
      const productoId = Number(item.productoId);
      const cantidad = Number(item.cantidad || 0);
      if (!Number.isFinite(productoId) || productoId <= 0 || !Number.isFinite(cantidad)) return;
      grouped.set(productoId, (grouped.get(productoId) || 0) + cantidad);
    });
  });
  return grouped;
}

async function hydrateVenta(id) {
  return Venta.findByPk(id, {
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

async function createRefund(req, res, next) {
  const requestedItems = coerceRefundItems(req.body?.items);

  try {
    const updated = await sequelize.transaction(async (t) => {
      const venta = await Venta.findByPk(req.params.id, { transaction: t });
      if (!venta) {
        const err = new Error('Not found');
        err.status = 404;
        throw err;
      }

      if (venta.estado === 'papelera') {
        const err = new Error('No se puede reembolsar una venta en papelera');
        err.status = 400;
        throw err;
      }

      if (!requestedItems.length) {
        const err = new Error('Selecciona al menos un producto para reembolsar');
        err.status = 400;
        throw err;
      }

      const detalles = await DetalleVenta.findAll({
        where: { ventaId: venta.id },
        include: [{ model: Producto, as: 'producto' }],
        transaction: t
      });

      const soldByProduct = groupSoldItems(detalles);
      const previousRefunds = parseJsonArray(venta.reembolsos);
      const refundedByProduct = groupRefundedQuantities(previousRefunds);
      const subtotalVenta = await inferSubtotalForVenta(venta, { transaction: t });
      const totalVenta = round2(venta.total);
      const factorDescuento = subtotalVenta > 0 ? Math.min(1, Math.max(0, totalVenta / subtotalVenta)) : 1;
      const refundItems = [];

      for (const item of requestedItems) {
        const sold = soldByProduct.get(item.productoId);
        if (!sold) {
          const err = new Error(`El producto ${item.productoId} no pertenece a esta venta`);
          err.status = 400;
          throw err;
        }

        const alreadyRefunded = refundedByProduct.get(item.productoId) || 0;
        const available = Math.max(0, Number(sold.cantidad || 0) - alreadyRefunded);
        if (item.cantidad > available) {
          const err = new Error(`Solo quedan ${available} unidades disponibles para reembolsar de ${sold.nombre}`);
          err.status = 400;
          throw err;
        }

        const precioUnitario = sold.cantidad > 0 ? Number(sold.subtotal || 0) / Number(sold.cantidad) : 0;
        const subtotalLinea = round2(precioUnitario * item.cantidad);
        const valorReembolso = round2(subtotalLinea * factorDescuento);

        refundItems.push({
          productoId: item.productoId,
          nombre: sold.nombre,
          cantidad: item.cantidad,
          precioUnitario: round2(precioUnitario),
          subtotal: subtotalLinea,
          valorReembolso,
          retornaInventario: item.retornaInventario
        });

        if (item.retornaInventario && sold.producto && sold.producto.seguimientoInventario !== false) {
          await sold.producto.update(
            { stock: Number(sold.producto.stock || 0) + item.cantidad },
            { transaction: t }
          );
        }
      }

      const valorTotal = round2(refundItems.reduce((sum, item) => sum + Number(item.valorReembolso || 0), 0));
      if (valorTotal <= 0) {
        const err = new Error('El valor del reembolso debe ser mayor a cero');
        err.status = 400;
        throw err;
      }

      const totalReembolsado = round2(Math.min(totalVenta, Number(venta.totalReembolsado || 0) + valorTotal));
      const totalUnidadesVendidas = [...soldByProduct.values()].reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
      const totalUnidadesReembolsadas = [...refundedByProduct.values()].reduce((sum, qty) => sum + Number(qty || 0), 0)
        + refundItems.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
      const estado = totalUnidadesReembolsadas >= totalUnidadesVendidas || totalReembolsado >= totalVenta
        ? 'reembolsada_total'
        : 'reembolsada_parcial';

      const reembolso = {
        id: Date.now(),
        fecha: new Date().toISOString(),
        motivo: req.body?.motivo || '',
        tipo: estado === 'reembolsada_total' ? 'total' : 'parcial',
        valorTotal,
        items: refundItems
      };

      await venta.update(
        {
          reembolsos: [...previousRefunds, reembolso],
          totalReembolsado,
          estado
        },
        { transaction: t }
      );

      return venta;
    });

    res.status(201).json(await hydrateVenta(updated.id));
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

module.exports = { list, getById, create, update, applyDiscount, removeDiscount, createRefund, remove };
