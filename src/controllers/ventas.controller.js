'use strict';

const { Venta, DetalleVenta, Producto, Cliente, Usuario, Descuento, sequelize } = require('../../models');
const { Op } = require('sequelize');

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

function coerceCorrectionItems(rawItems) {
  const grouped = new Map();
  coerceItems(rawItems).forEach((item) => {
    const current = grouped.get(item.productoId) || {
      productoId: item.productoId,
      cantidad: 0,
      precioUnitario: item.precioUnitario
    };
    current.cantidad += Math.floor(Number(item.cantidad || 0));
    current.precioUnitario = Number.isFinite(Number(item.precioUnitario))
      ? Number(item.precioUnitario)
      : Number(current.precioUnitario || 0);
    current.subtotal = round2(current.cantidad * current.precioUnitario);
    grouped.set(item.productoId, current);
  });

  return [...grouped.values()].filter((item) => item.cantidad > 0);
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
      porcentajeReembolso: Math.max(0, Math.min(100, Number(item.porcentajeReembolso ?? 100))),
      retornaInventario: Boolean(item.retornaInventario)
    }))
    .filter((item) => Number.isFinite(item.productoId) && item.productoId > 0 && item.cantidad > 0 && item.porcentajeReembolso > 0)
    .forEach((item) => {
      const key = `${item.productoId}-${item.porcentajeReembolso}-${item.retornaInventario ? 'stock' : 'no-stock'}`;
      const current = grouped.get(key) || { ...item, cantidad: 0, retornaInventario: false };
      current.cantidad += item.cantidad;
      current.retornaInventario = current.retornaInventario || item.retornaInventario;
      grouped.set(key, current);
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
      const porcentaje = Math.max(0, Math.min(100, Number(item.porcentajeReembolso ?? 100)));
      if (!Number.isFinite(productoId) || productoId <= 0 || !Number.isFinite(cantidad)) return;
      grouped.set(productoId, (grouped.get(productoId) || 0) + (cantidad * porcentaje / 100));
    });
  });
  return grouped;
}

function groupReturnedQuantities(reembolsos) {
  const grouped = new Map();
  parseJsonArray(reembolsos).forEach((reembolso) => {
    const items = Array.isArray(reembolso?.items) ? reembolso.items : [];
    items.forEach((item) => {
      const productoId = Number(item.productoId);
      const cantidad = Number(item.cantidad || 0);
      if (!item.retornaInventario || !Number.isFinite(productoId) || productoId <= 0 || !Number.isFinite(cantidad)) return;
      grouped.set(productoId, (grouped.get(productoId) || 0) + cantidad);
    });
  });
  return grouped;
}

function groupQuantitiesByProduct(items) {
  const grouped = new Map();
  items.forEach((item) => {
    const productoId = Number(item.productoId);
    if (!Number.isFinite(productoId) || productoId <= 0) return;
    grouped.set(productoId, (grouped.get(productoId) || 0) + Number(item.cantidad || 0));
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

async function list(req, res, next) {
  try {
    const where = req.user && req.user.role === 'USER'
      ? { [Op.or]: [{ usuarioId: req.user.id }, { usuarioId: null }] }
      : undefined;

    const rows = await Venta.findAll({
      where,
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
    if (!canAccessVenta(req, row)) {
      return res.status(403).json({ error: 'No puedes administrar pedidos ajenos' });
    }
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
          usuarioId: req.user?.role === 'ADMIN' ? (usuarioId || req.user.id || null) : (req.user?.id || null),
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

        for (const item of items) {
          const producto = await Producto.findByPk(item.productoId, { transaction: t });
          if (!producto || producto.seguimientoInventario === false) continue;

          const nuevoStock = Number(producto.stock || 0) - Number(item.cantidad || 0);
          if (nuevoStock < 0) {
            const err = new Error(`Stock insuficiente para ${producto.nombre}`);
            err.status = 400;
            throw err;
          }

          await producto.update({ stock: nuevoStock }, { transaction: t });
        }
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
    if (!canAccessVenta(req, row)) {
      return res.status(403).json({ error: 'No puedes administrar pedidos ajenos' });
    }
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
      if (!canAccessVenta(req, venta)) {
        const err = new Error('No puedes administrar pedidos ajenos');
        err.status = 403;
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
      if (!canAccessVenta(req, venta)) {
        const err = new Error('No puedes administrar pedidos ajenos');
        err.status = 403;
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
      if (!canAccessVenta(req, venta)) {
        const err = new Error('No puedes administrar pedidos ajenos');
        err.status = 403;
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
      const returnedByProduct = groupReturnedQuantities(previousRefunds);
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
        const equivalentRefundQuantity = item.cantidad * item.porcentajeReembolso / 100;
        if (equivalentRefundQuantity > available) {
          const err = new Error(`Solo queda ${round2(available)} equivalente disponible para reembolsar de ${sold.nombre}`);
          err.status = 400;
          throw err;
        }

        const precioUnitario = sold.cantidad > 0 ? Number(sold.subtotal || 0) / Number(sold.cantidad) : 0;
        const subtotalLinea = round2(precioUnitario * item.cantidad);
        const valorReembolso = round2(subtotalLinea * factorDescuento * (item.porcentajeReembolso / 100));
        const alreadyReturned = returnedByProduct.get(item.productoId) || 0;
        const canReturn = Math.max(0, Number(sold.cantidad || 0) - alreadyReturned);
        if (item.retornaInventario && item.cantidad > canReturn) {
          const err = new Error(`Solo quedan ${canReturn} unidades disponibles para retornar al inventario de ${sold.nombre}`);
          err.status = 400;
          throw err;
        }

        refundItems.push({
          productoId: item.productoId,
          nombre: sold.nombre,
          cantidad: item.cantidad,
          porcentajeReembolso: item.porcentajeReembolso,
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

async function correctSale(req, res, next) {
  const items = coerceCorrectionItems(req.body?.items);

  try {
    const updated = await sequelize.transaction(async (t) => {
      const venta = await Venta.findByPk(req.params.id, {
        include: [{ model: DetalleVenta, as: 'detalles' }],
        transaction: t
      });

      if (!venta) {
        const err = new Error('Not found');
        err.status = 404;
        throw err;
      }

      if (!canAccessVenta(req, venta)) {
        const err = new Error('No puedes administrar pedidos ajenos');
        err.status = 403;
        throw err;
      }

      if (venta.estado === 'papelera') {
        const err = new Error('No se puede corregir una venta en papelera');
        err.status = 400;
        throw err;
      }

      if (Number(venta.totalReembolsado || 0) > 0 || parseJsonArray(venta.reembolsos).length > 0) {
        const err = new Error('No se puede corregir una venta con reembolsos registrados');
        err.status = 400;
        throw err;
      }

      if (!items.length) {
        const err = new Error('Selecciona al menos un producto para corregir la venta');
        err.status = 400;
        throw err;
      }

      const productIds = [...new Set(items.map((item) => item.productoId))];
      const productos = await Producto.findAll({
        where: { id: productIds },
        transaction: t
      });
      const productosById = new Map(productos.map((producto) => [Number(producto.id), producto]));

      if (productos.length !== productIds.length) {
        const err = new Error('Uno o mas productos de la correccion no existen');
        err.status = 400;
        throw err;
      }

      const oldQuantities = groupQuantitiesByProduct(venta.detalles || []);
      const newQuantities = groupQuantitiesByProduct(items);
      const affectedIds = new Set([...oldQuantities.keys(), ...newQuantities.keys()]);

      for (const productoId of affectedIds) {
        const producto = productosById.get(productoId) || await Producto.findByPk(productoId, { transaction: t });
        if (!producto || producto.seguimientoInventario === false) continue;

        const oldQty = Number(oldQuantities.get(productoId) || 0);
        const newQty = Number(newQuantities.get(productoId) || 0);
        const nuevoStock = Number(producto.stock || 0) + oldQty - newQty;

        if (nuevoStock < 0) {
          const err = new Error(`Stock insuficiente para corregir ${producto.nombre}`);
          err.status = 400;
          throw err;
        }

        await producto.update({ stock: nuevoStock }, { transaction: t });
      }

      await DetalleVenta.destroy({ where: { ventaId: venta.id }, transaction: t });

      const detalleRows = items.map((item) => ({
        ventaId: venta.id,
        productoId: item.productoId,
        cantidad: item.cantidad,
        precioUnitario: item.precioUnitario,
        subtotal: item.subtotal
      }));
      await DetalleVenta.bulkCreate(detalleRows, { transaction: t });

      const subtotal = round2(items.reduce((sum, item) => sum + Number(item.subtotal || 0), 0));
      const descuento = venta.descuentoId
        ? await Descuento.findByPk(venta.descuentoId, { transaction: t })
        : null;
      const descuentoAplicado = computeDiscountAmount(subtotal, descuento);
      const total = round2(Math.max(0, subtotal - descuentoAplicado));

      await venta.update(
        {
          clienteId: Object.prototype.hasOwnProperty.call(req.body || {}, 'clienteId') ? req.body.clienteId : venta.clienteId,
          metodoPago: req.body?.metodoPago || venta.metodoPago,
          subtotal,
          descuentoAplicado,
          total,
          items
        },
        { transaction: t }
      );

      return venta;
    });

    res.json(await hydrateVenta(updated.id));
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const row = await Venta.findByPk(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (!canAccessVenta(req, row)) {
      return res.status(403).json({ error: 'No puedes administrar pedidos ajenos' });
    }
    await row.destroy();
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

function canAccessVenta(req, venta) {
  if (!req.user) return false;
  if (req.user.role === 'ADMIN') return true;
  return Number(venta.usuarioId) === Number(req.user.id) || venta.usuarioId === null;
}

module.exports = { list, getById, create, update, applyDiscount, removeDiscount, createRefund, correctSale, remove };
