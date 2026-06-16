'use strict';

const express = require('express');
const authController = require('../controllers/auth.controller');
const authJwt = require('../middlewares/authJwt');

const router = express.Router();

router.post('/login', authController.login);
router.get('/me', authJwt, authController.me);
router.get('/authors', authController.getAuthors);

module.exports = router;
