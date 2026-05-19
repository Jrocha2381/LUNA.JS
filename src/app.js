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
app.use('/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi', authRouter);
app.use(sanitizeIds);
app.use(express.static(path.join(__dirname, '..')));

app.get('/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi/health', async (_req, res, next) => {
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
    { nombre: 'Compañero', codigo: '0000002' }
  ]);
});

app.use('/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi/users', authJwt, requireRole('ADMIN'), usuariosRouter);
app.use('/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi/usuarios', usuariosRouter);
app.use('/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi/categorias', categoriasRouter);
app.use('/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi/productos', productosRouter);
app.use('/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi/clientes', clientesRouter);
app.use('/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi/proveedores', proveedoresRouter);
app.use('/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi/ventas', ventasRouter);
app.use('/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi/detalle_ventas', detallevRouter);
app.use('/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi/detalle_compras', detallecRouter);
app.use('/JuanSebastianRocha Rodriguez_JeronimoRubio_Ibrahim Safadi/compras', comprasRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

module.exports = app;
