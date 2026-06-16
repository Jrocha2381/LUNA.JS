'use strict';

const jwt = require('jsonwebtoken');
const { Usuario } = require('../../models');

const AUTHORS = [
  { nombre: 'Jeronimo Rubio', codigo: '0000001' },
  { nombre: 'Sebastian Rocha', codigo: '0000002' },
  { nombre: 'Ibrahim Safadi', codigo: '0000003' }
];

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const err = new Error('JWT_SECRET no esta configurado');
    err.status = 500;
    throw err;
  }
  return secret;
}

function validateLoginBody(body) {
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password) {
    return {
      error: 'username y password son requeridos'
    };
  }

  return { username, password };
}

async function login(req, res, next) {
  try {
    const { username, password, error } = validateLoginBody(req.body || {});

    if (error) {
      return res.status(400).json({ error });
    }

    const usuario = await Usuario.findOne({
      where: { username }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const passwordValida = await usuario.verifyPassword(password);

    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        sub: usuario.id,
        username: usuario.username,
        role: usuario.role
      },
      getJwtSecret(),
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      }
    );

    return res.json({
      token,
      token_type: 'bearer',
      user: {
        id: usuario.id,
        username: usuario.username,
        role: usuario.role
      }
    });
  } catch (err) {
    next(err);
  }
}

function me(req, res) {
  return res.json({
    user: req.user
  });
}

function getAuthors(_req, res) {
  return res.json(AUTHORS);
}

module.exports = {
  login,
  me,
  getAuthors,
  AUTHORS
};
