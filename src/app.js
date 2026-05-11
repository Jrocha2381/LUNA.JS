require('dotenv').config();

const path = require('path');
const express = require('express');
const { sequelize } = require('../models');
const requestLogger = require('./middlewares/requestLogger');
const sanitizeIds = require('./middlewares/sanitizeIds');
const authJwt = require('./middlewares/authJwt');
const requireRole = require('./middlewares/requireRole');

const authRouter = require('./routes/auth');
const usuariosRouter = require('./routes/usuarios');
const categoriasRouter = require('./routes/categorias');
const productosRouter = require('./routes/productos');
const clientesRouter = require('./routes/clientes');
const proveedoresRouter = require('./routes/proveedores');
const ventasRouter = require('./routes/ventas');
const detallevRouter = require('./routes/detalleventas');
const detallecRouter = require('./routes/detallecompras');
const comprasRouter = require('./routes/compras');

const app = express();

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
app.use('/api', authRouter);
app.use(sanitizeIds);
app.use(express.static(path.join(__dirname, '..')));

app.get('/api/health', async (_req, res, next) => {
  try {
    await sequelize.authenticate();
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.use('/api/users', authJwt, requireRole('ADMIN'), usuariosRouter);
app.use('/api/usuarios', usuariosRouter);
app.use('/api/categorias', categoriasRouter);
app.use('/api/productos', productosRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/proveedores', proveedoresRouter);
app.use('/api/ventas', ventasRouter);
app.use('/api/detalle_ventas', detallevRouter);
app.use('/api/detalle_compras', detallecRouter);
app.use('/api/compras', comprasRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
