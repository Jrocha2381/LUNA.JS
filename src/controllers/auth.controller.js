'use strict';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../../models');

function validateLoginBody(body) {
  const username = typeof body.username === 'string' ? body.username.trim() : '';
  const password = typeof body.password === 'string' ? body.password : '';

  if (!username || !password) {
    return {
      error: 'Username y password son obligatorios'
    };
  }

  return { username, password };
}

async function login(req, res, next) {
  try {
    const { username, password, error } = validateLoginBody(req.body);

    if (error) {
      return res.status(400).json({ error });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ error: 'JWT_SECRET no esta configurado' });
    }

    const usuario = await Usuario.unscoped().findOne({
      where: { username }
    });

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);

    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales invalidas' });
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        username: usuario.username,
        role: usuario.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      }
    );

    return res.json({
      token,
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

module.exports = {
  login,
  me
};
