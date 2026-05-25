require('./config/env').requireEnv('JWT_SECRET');

const path = require('path');
const express = require('express');
const { sequelize } = require('../models');
const requestLogger = require('./middlewares/requestLogger');
const sanitizeIds = require('./middlewares/sanitizeIds');
const authJwt = require('./middlewares/authJwt');
const requireRole = require('./middlewares/requireRole');
const requireAdminForWrite = require('./middlewares/requireAdminForWrite');

const authRouter = require('./routes/auth');
const usuariosRouter = require('./routes/usuarios');
const categoriasRouter = require('./routes/categorias');
const productosRouter = require('./routes/productos');
const descuentosRouter = require('./routes/descuentos');
const clientesRouter = require('./routes/clientes');
const proveedoresRouter = require('./routes/proveedores');
const ventasRouter = require('./routes/ventas');
const detallevRouter = require('./routes/detalleventas');
const detallecRouter = require('./routes/detallecompras');
const comprasRouter = require('./routes/compras');

const app = express();
const API_PREFIX = '/Jeronimo Rubio_Sebastian Rocha_Ibrahim Safadi';
const ENCODED_API_PREFIX = '/Jeronimo%20Rubio_Sebastian%20Rocha_Ibrahim%20Safadi';
const LEGACY_API_PREFIX = '/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi';
const SIMPLE_API_PREFIX = '/api';
const ADMIN_PAGE = path.join(__dirname, '..', 'carritopage', 'acceso-admin.html');

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

app.use(express.json());
app.use(requestLogger);
app.use(API_PREFIX, authRouter);
app.use(ENCODED_API_PREFIX, authRouter);
app.use(LEGACY_API_PREFIX, authRouter);
app.use(SIMPLE_API_PREFIX, authRouter);
app.use(sanitizeIds);
app.use(express.static(path.join(__dirname, '..')));

app.get([API_PREFIX, ENCODED_API_PREFIX], (_req, res) => {
  res.sendFile(ADMIN_PAGE);
});

app.get([`${API_PREFIX}/health`, `${ENCODED_API_PREFIX}/health`], async (_req, res, next) => {
  try {
    await sequelize.authenticate();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.get(`${LEGACY_API_PREFIX}/health`, async (_req, res, next) => {
  try {
    await sequelize.authenticate();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.get('/authors', (_req, res) => {
  res.json([
    { nombre: 'Jeronimo Rubio', codigo: '0000001' },
    { nombre: 'Sebastian Rocha', codigo: '0000002' },
    { nombre: 'Ibrahim Safadi', codigo: '0000003' }
  ]);
});

function mountApiRoutes(prefix) {
  // Usuarios: solo ADMIN (lectura/escritura)
  app.use(`${prefix}/users`, authJwt, requireRole('ADMIN'), usuariosRouter);
  app.use(`${prefix}/usuarios`, authJwt, requireRole('ADMIN'), usuariosRouter);

  // Catálogos/maestros: autenticación requerida; escritura solo ADMIN
  app.use(`${prefix}/categorias`, authJwt, requireAdminForWrite, categoriasRouter);
  app.use(`${prefix}/productos`, authJwt, requireAdminForWrite, productosRouter);
  app.use(`${prefix}/descuentos`, authJwt, requireAdminForWrite, descuentosRouter);
  app.use(`${prefix}/clientes`, authJwt, requireAdminForWrite, clientesRouter);
  app.use(`${prefix}/proveedores`, authJwt, requireAdminForWrite, proveedoresRouter);

  // Operaciones: autenticación requerida (USER o ADMIN)
  app.use(`${prefix}/ventas`, authJwt, ventasRouter);
  app.use(`${prefix}/detalle_ventas`, authJwt, detallevRouter);
  app.use(`${prefix}/compras`, authJwt, comprasRouter);
  app.use(`${prefix}/detalle_compras`, authJwt, detallecRouter);
}

mountApiRoutes(API_PREFIX);
mountApiRoutes(ENCODED_API_PREFIX);
mountApiRoutes(LEGACY_API_PREFIX);
mountApiRoutes(SIMPLE_API_PREFIX);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
