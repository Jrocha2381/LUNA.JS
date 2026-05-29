'use strict';

const { Faltante, Cliente, Proveedor, Producto, sequelize } = require('../../models');
const { Op } = require('sequelize');

function likeOperator() {
  return sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
}

function coerceResolvedQuantity(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.floor(n));
}

function normalizeBooleanQuery(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean') return value;
  const s = value.toString().toLowerCase().trim();
  if (s === 'true') return true;
  if (s === 'false') return false;
  return undefined;
}

function cleanName(value) {
  const text = String(value || '').trim();
  return text || null;
}

function positiveIntOrNull(value) {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function includeFaltante() {
  return [
    { model: Cliente, as: 'cliente' },
    { model: Proveedor, as: 'proveedor' },
    { model: Producto, as: 'producto' }
  ];
}

async function list(req, res, next) {
  try {
    const { tipo, proveedorId } = req.query;
    const resuelto = normalizeBooleanQuery(req.query.resuelto);

    const where = {};
    if (tipo) where.tipo = { [likeOperator()]: `%${tipo}%` };
    if (proveedorId) where.proveedorId = Number(proveedorId);
    if (typeof resuelto === 'boolean') where.resuelto = resuelto;

    const rows = await Faltante.findAll({
      where,
      order: [['id', 'DESC']],
      include: includeFaltante()
    });

    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const row = await Faltante.findByPk(req.params.id, { include: includeFaltante() });
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const body = req.body || {};

    const cantidadSolicitada = Number(body.cantidadSolicitada ?? 1);
    const fechaSolicitado = body.fechaSolicitado ? new Date(body.fechaSolicitado) : new Date();
    const clienteNombre = cleanName(body.clienteNombre);
    const proveedorNombre = cleanName(body.proveedorNombre);

    const payload = {
      clienteId: positiveIntOrNull(body.clienteId),
      proveedorId: positiveIntOrNull(body.proveedorId),
      productoId: positiveIntOrNull(body.productoId),
      productoNombre: body.productoNombre ?? null,
      productoCodigo: body.productoCodigo ?? null,
      tipo: (body.tipo || '').toString(),
      cantidadSolicitada: Number.isFinite(cantidadSolicitada) ? Math.max(1, Math.floor(cantidadSolicitada)) : 1,
      comentarios: body.comentarios ?? null,
      fechaSolicitado
    };

    const created = await sequelize.transaction(async (t) => {
      // Si viene productoId, verificamos que exista. Si no existe, fallamos.
      if (payload.productoId) {
        const producto = await Producto.findByPk(payload.productoId, { transaction: t });
        if (!producto) {
          const err = new Error('productoId no encontrado');
          err.status = 400;
          throw err;
        }
      }

      // validar proveedor si existe proveedorId
      if (payload.proveedorId) {
        const proveedor = await Proveedor.findByPk(payload.proveedorId, { transaction: t });
        if (!proveedor) {
          const err = new Error('proveedorId no encontrado');
          err.status = 400;
          throw err;
        }
      }

      if (!payload.proveedorId && proveedorNombre) {
        const [proveedor] = await Proveedor.findOrCreate({
          where: { nombre: proveedorNombre },
          defaults: { nombre: proveedorNombre },
          transaction: t
        });
        payload.proveedorId = proveedor.id;
      }

      // validar clienteId siempre
      if (!payload.clienteId && clienteNombre) {
        const [cliente] = await Cliente.findOrCreate({
          where: { nombre: clienteNombre },
          defaults: { nombre: clienteNombre },
          transaction: t
        });
        payload.clienteId = cliente.id;
      }

      const cliente = payload.clienteId ? await Cliente.findByPk(payload.clienteId, { transaction: t }) : null;
      if (!cliente) {
        const err = new Error('Selecciona o registra un cliente valido');
        err.status = 400;
        throw err;
      }

      return Faltante.create(payload, { transaction: t });
    });

    const hydrated = await Faltante.findByPk(created.id, { include: includeFaltante() });
    res.status(201).json(hydrated);
  } catch (err) {
    next(err);
  }
}

async function markResolved(req, res, next) {
  try {
    const faltante = await Faltante.findByPk(req.params.id);
    if (!faltante) return res.status(404).json({ error: 'Not found' });

    const cantidadResuelta = coerceResolvedQuantity(req.body?.cantidadResuelta ?? faltante.cantidadResuelta);
    const comentarios = req.body?.comentarios ?? faltante.comentarios ?? null;

    const updated = await sequelize.transaction(async (t) => {
      await faltante.update(
        {
          resuelto: true,
          cantidadResuelta,
          fechaResuelto: new Date(),
          comentarios
        },
        { transaction: t }
      );
      return faltante;
    });

    const hydrated = await Faltante.findByPk(updated.id, { include: includeFaltante() });
    res.json(hydrated);
  } catch (err) {
    next(err);
  }
}

async function insights(req, res, next) {
  try {
    const { proveedorId, tipo, soloPendientes } = req.query;

    const where = {};
    if (proveedorId) where.proveedorId = Number(proveedorId);
    if (tipo) where.tipo = { [likeOperator()]: `%${tipo}%` };
    if (soloPendientes !== undefined) {
      const pending = normalizeBooleanQuery(soloPendientes);
      if (pending) where.resuelto = false;
    } else {
      // por defecto: solo pendientes para insights
      where.resuelto = false;
    }

    // Agrupar pendientes para compras futuras.
    const rows = await Faltante.findAll({
      where,
      attributes: [
        'proveedorId',
        'tipo',
        [sequelize.fn('COALESCE', sequelize.col('productoCodigo'), sequelize.col('productoNombre')), 'productoKey'],
        'productoNombre',
        'productoCodigo'
      ],
      raw: true
    });

    const map = new Map();
    for (const r of rows) {
      const key = [r.proveedorId ?? 'null', r.tipo, r.productoCodigo ?? '', r.productoNombre ?? ''].join('|');
      const current = map.get(key) || {
        proveedorId: r.proveedorId ?? null,
        tipo: r.tipo,
        productoCodigo: r.productoCodigo ?? null,
        productoNombre: r.productoNombre ?? null,
        cantidadPendiente: 0
      };
      const pendiente = Number(r.cantidadSolicitada || 0) - Number(r.cantidadResuelta || 0);
      // Como raw: true no trae cantidades agregadas; la cantidad está fuera. Para no dañar, recalculamos con otra consulta.
      map.set(key, current);
    }

    // Segunda pasada correcta con sumas.
    const sumRows = await Faltante.findAll({
      where,
      attributes: [
        'proveedorId',
        'tipo',
        'productoNombre',
        'productoCodigo',
        [sequelize.fn('COUNT', sequelize.col('id')), 'solicitudes'],
        [sequelize.fn('SUM', sequelize.literal('"cantidadSolicitada" - "cantidadResuelta"')), 'cantidadPendiente']
      ],
      group: ['proveedorId', 'tipo', 'productoNombre', 'productoCodigo'],
      raw: true
    });

    sumRows.sort((a, b) => Number(b.cantidadPendiente || 0) - Number(a.cantidadPendiente || 0));
    res.json(sumRows);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  list,
  getById,
  create,
  markResolved,
  insights
};

