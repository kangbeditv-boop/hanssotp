const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const config = require('../config/env');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token tidak ditemukan');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret);

    const [users] = await pool.query(
      'SELECT id, username, email, balance, is_banned, language, theme FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      throw new UnauthorizedError('User tidak ditemukan');
    }

    if (users[0].is_banned) {
      throw new ForbiddenError('Akun anda telah dibanned');
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token tidak valid atau expired'));
    }
    next(error);
  }
}

async function adminMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Token admin tidak ditemukan');
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.adminSecret);

    const [admins] = await pool.query(
      'SELECT id, username, email, role FROM admins WHERE id = ? AND is_active = 1',
      [decoded.adminId]
    );

    if (admins.length === 0) {
      throw new UnauthorizedError('Admin tidak ditemukan');
    }

    req.admin = admins[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token admin tidak valid atau expired'));
    }
    next(error);
  }
}

async function resellerApiMiddleware(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) {
      throw new UnauthorizedError('API key tidak ditemukan');
    }

    const [keys] = await pool.query(
      `SELECT rak.*, u.id as user_id, u.username, u.balance, u.is_banned,
              u.max_active_orders, u.max_orders_per_minute
       FROM reseller_api_keys rak
       JOIN users u ON rak.user_id = u.id
       WHERE rak.api_key = ? AND rak.is_active = 1`,
      [apiKey]
    );

    if (keys.length === 0) {
      throw new UnauthorizedError('API key tidak valid');
    }

    if (keys[0].is_banned) {
      throw new ForbiddenError('Akun terkait API key telah dibanned');
    }

    await pool.query(
      'UPDATE reseller_api_keys SET last_used_at = NOW() WHERE id = ?',
      [keys[0].id]
    );

    req.apiKeyData = keys[0];
    req.user = {
      id: keys[0].user_id,
      username: keys[0].username,
      balance: keys[0].balance,
      max_active_orders: keys[0].max_active_orders,
      max_orders_per_minute: keys[0].max_orders_per_minute,
    };
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { authMiddleware, adminMiddleware, resellerApiMiddleware };
