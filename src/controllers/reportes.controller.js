'use strict';

const { Venta, DetalleVenta, Compra, Faltante, Producto, Proveedor, sequelize } = require('../../models');
const { Op } = require('sequelize');

const MS_PER_DAY = 24 * 60 * 60 * 1000;
let faltantesTableExistsCache;

function parseDateOnly(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseRange(query) {
  const desde = parseDateOnly(query.desde);
  const hastaBase = parseDateOnly(query.hasta);

  if (!desde || !hastaBase) {
    const err = new Error('Debes enviar fechas validas en formato YYYY-MM-DD: desde y hasta');
    err.status = 400;
    throw err;
  }

  const hasta = new Date(hastaBase.getTime() + MS_PER_DAY - 1);
  if (hasta < desde) {
    const err = new Error('La fecha hasta no puede ser anterior a la fecha desde');
    err.status = 400;
    throw err;
  }

  return { desde, hasta };
}

function toNumber(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n : 0;
}

function round2(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

function ventaActivaWhere(extra = {}) {
  return {
    estado: { [Op.ne]: 'papelera' },
    ...extra
  };
}

async function hasFaltantesTable() {
  if (typeof faltantesTableExistsCache === 'boolean') return faltantesTableExistsCache;
  const tables = await sequelize.getQueryInterface().showAllTables();
  const names = tables.map((table) => (typeof table === 'string' ? table : table.tableName)).filter(Boolean);
  faltantesTableExistsCache = names.includes('faltantes');
  return faltantesTableExistsCache;
}

async function resumen(req, res, next) {
  try {
    const { desde, hasta } = parseRange(req.query);
    const ventasWhere = ventaActivaWhere({ fecha: { [Op.between]: [desde, hasta] } });
    const comprasWhere = { fecha: { [Op.between]: [desde, hasta] } };
    const faltantesWhere = { fechaSolicitado: { [Op.between]: [desde, hasta] } };

    const [ventas, compras, faltantes] = await Promise.all([
      Venta.findAll({
        where: ventasWhere,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidadVentas'],
          [sequelize.fn('SUM', sequelize.col('total')), 'totalVentas'],
          [sequelize.fn('SUM', sequelize.col('totalReembolsado')), 'totalReembolsado']
        ],
        raw: true
      }),
      Compra.findAll({
        where: comprasWhere,
        attributes: [
          [sequelize.fn('COUNT', sequelize.col('id')), 'cantidadCompras'],
          [sequelize.fn('SUM', sequelize.col('total')), 'totalCompras']
        ],
        raw: true
      }),
      hasFaltantesTable().then((exists) => (
        exists
          ? Faltante.findAll({
              where: faltantesWhere,
              attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'cantidadFaltantes'],
                [sequelize.fn('SUM', sequelize.col('cantidadSolicitada')), 'unidadesSolicitadas']
              ],
              raw: true
            })
          : [{ cantidadFaltantes: 0, unidadesSolicitadas: 0 }]
      ))
    ]);

    const ventaRow = ventas[0] || {};
    const compraRow = compras[0] || {};
    const faltanteRow = faltantes[0] || {};
    const totalVentas = round2(ventaRow.totalVentas);
    const totalReembolsado = round2(ventaRow.totalReembolsado);

    res.json({
      rango: { desde: req.query.desde, hasta: req.query.hasta },
      ventas: {
        cantidad: toNumber(ventaRow.cantidadVentas),
        total: totalVentas,
        totalReembolsado,
        totalNeto: round2(totalVentas - totalReembolsado)
      },
      compras: {
        cantidad: toNumber(compraRow.cantidadCompras),
        total: round2(compraRow.totalCompras)
      },
      faltantes: {
        solicitudes: toNumber(faltanteRow.cantidadFaltantes),
        unidadesSolicitadas: toNumber(faltanteRow.unidadesSolicitadas)
      }
    });
  } catch (err) {
    next(err);
  }
}

async function ventasTotales(req, res, next) {
  try {
    const { desde, hasta } = parseRange(req.query);
    const rows = await Venta.findAll({
      where: ventaActivaWhere({ fecha: { [Op.between]: [desde, hasta] } }),
      order: [['fecha', 'DESC']],
      attributes: ['id', 'fecha', 'metodoPago', 'subtotal', 'descuentoAplicado', 'total', 'totalReembolsado', 'estado'],
      raw: true
    });

    const total = rows.reduce((sum, row) => sum + toNumber(row.total), 0);
    const totalReembolsado = rows.reduce((sum, row) => sum + toNumber(row.totalReembolsado), 0);

    res.json({
      rango: { desde: req.query.desde, hasta: req.query.hasta },
      cantidad: rows.length,
      total: round2(total),
      totalReembolsado: round2(totalReembolsado),
      totalNeto: round2(total - totalReembolsado),
      ventas: rows
    });
  } catch (err) {
    next(err);
  }
}

async function productosMasVendidos(req, res, next) {
  try {
    const { desde, hasta } = parseRange(req.query);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 10)));

    const rows = await DetalleVenta.findAll({
      attributes: [
        'productoId',
        [sequelize.fn('SUM', sequelize.col('DetalleVenta.cantidad')), 'cantidadVendida'],
        [sequelize.fn('SUM', sequelize.col('DetalleVenta.subtotal')), 'subtotalVendido']
      ],
      include: [
        {
          model: Venta,
          as: 'venta',
          attributes: [],
          where: ventaActivaWhere({ fecha: { [Op.between]: [desde, hasta] } })
        },
        {
          model: Producto,
          as: 'producto',
          attributes: ['id', 'nombre', 'precio']
        }
      ],
      group: ['DetalleVenta.productoId', 'producto.id', 'producto.nombre', 'producto.precio'],
      order: [[sequelize.literal('cantidadVendida'), 'DESC']],
      limit,
      raw: true,
      nest: true
    });

    res.json({
      rango: { desde: req.query.desde, hasta: req.query.hasta },
      productos: rows.map((row) => ({
        productoId: row.productoId,
        producto: row.producto,
        cantidadVendida: toNumber(row.cantidadVendida),
        subtotalVendido: round2(row.subtotalVendido)
      }))
    });
  } catch (err) {
    next(err);
  }
}

async function comprasRegistradas(req, res, next) {
  try {
    if (!(await hasFaltantesTable())) {
      return res.json({
        rango: { desde: req.query.desde, hasta: req.query.hasta },
        faltantes: []
      });
    }

    const { desde, hasta } = parseRange(req.query);
    const rows = await Compra.findAll({
      where: { fecha: { [Op.between]: [desde, hasta] } },
      order: [['fecha', 'DESC']],
      include: [{ model: Proveedor, as: 'proveedor', attributes: ['id', 'nombre'] }]
    });

    const total = rows.reduce((sum, row) => sum + toNumber(row.total), 0);

    res.json({
      rango: { desde: req.query.desde, hasta: req.query.hasta },
      cantidad: rows.length,
      total: round2(total),
      compras: rows
    });
  } catch (err) {
    next(err);
  }
}

async function faltantesFrecuentes(req, res, next) {
  try {
    const { desde, hasta } = parseRange(req.query);
    const limit = Math.max(1, Math.min(100, Number(req.query.limit || 10)));

    if (!(await hasFaltantesTable())) {
      return res.json({
        rango: { desde: req.query.desde, hasta: req.query.hasta },
        faltantes: []
      });
    }

    const rows = await Faltante.findAll({
      where: { fechaSolicitado: { [Op.between]: [desde, hasta] } },
      attributes: [
        'productoId',
        'productoNombre',
        'productoCodigo',
        'tipo',
        [sequelize.fn('COUNT', sequelize.col('Faltante.id')), 'solicitudes'],
        [sequelize.fn('SUM', sequelize.col('cantidadSolicitada')), 'cantidadSolicitada'],
        [sequelize.fn('SUM', sequelize.col('cantidadResuelta')), 'cantidadResuelta']
      ],
      include: [{ model: Producto, as: 'producto', attributes: ['id', 'nombre'] }],
      group: [
        'Faltante.productoId',
        'Faltante.productoNombre',
        'Faltante.productoCodigo',
        'Faltante.tipo',
        'producto.id',
        'producto.nombre'
      ],
      order: [[sequelize.literal('solicitudes'), 'DESC']],
      limit,
      raw: true,
      nest: true
    });

    res.json({
      rango: { desde: req.query.desde, hasta: req.query.hasta },
      faltantes: rows.map((row) => {
        const solicitada = toNumber(row.cantidadSolicitada);
        const resuelta = toNumber(row.cantidadResuelta);
        return {
          productoId: row.productoId,
          productoNombre: row.producto?.nombre || row.productoNombre || 'Producto no registrado',
          productoCodigo: row.productoCodigo || null,
          tipo: row.tipo,
          solicitudes: toNumber(row.solicitudes),
          cantidadSolicitada: solicitada,
          cantidadPendiente: Math.max(0, solicitada - resuelta)
        };
      })
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  resumen,
  ventasTotales,
  productosMasVendidos,
  comprasRegistradas,
  faltantesFrecuentes
};
