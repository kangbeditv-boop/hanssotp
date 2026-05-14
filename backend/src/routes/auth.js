const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const config = require('../config/env');
const { validate } = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiter');
const { authMiddleware } = require('../middleware/auth');
const { logActivity } = require('../middleware/activityLog');
const { registerSchema, loginSchema } = require('../validators/auth');
const { generateReferralCode, generateApiKey, sanitizeUser } = require('../utils/helpers');
const { BadRequestError, ConflictError } = require('../utils/errors');

const router = express.Router();

router.post('/register', validate(registerSchema), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { username, email, password, phone, referral_code } = req.validatedBody;

    const [existing] = await connection.query(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username]
    );
    if (existing.length > 0) {
      throw new ConflictError('Email atau username sudah terdaftar');
    }

    let referredBy = null;
    if (referral_code) {
      const [referrer] = await connection.query(
        'SELECT id FROM users WHERE referral_code = ?',
        [referral_code]
      );
      if (referrer.length > 0) {
        referredBy = referrer[0].id;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userReferralCode = generateReferralCode();
    const apiKey = generateApiKey();

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO users (username, email, password, phone, referral_code, referred_by, api_key)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, phone || null, userReferralCode, referredBy, apiKey]
    );

    const userId = result.insertId;

    await connection.query(
      `INSERT INTO affiliates (user_id) VALUES (?)`,
      [userId]
    );

    if (referredBy) {
      await connection.query(
        'UPDATE affiliates SET total_referrals = total_referrals + 1 WHERE user_id = ?',
        [referredBy]
      );
    }

    await connection.query(
      `INSERT INTO reseller_api_keys (user_id, api_key, name, rate_limit) VALUES (?, ?, 'Default', 60)`,
      [userId, apiKey]
    );

    await connection.commit();

    const token = jwt.sign({ userId }, config.jwt.secret, { expiresIn: config.jwt.expiresIn });

    await pool.query(
      `INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [userId, token, req.ip, req.get('user-agent')]
    );

    await logActivity('user', userId, 'register', 'user', userId, null, req);

    res.status(201).json({
      success: true,
      message: 'Registrasi berhasil',
      data: {
        token,
        user: {
          id: userId,
          username,
          email,
          balance: 0,
          referral_code: userReferralCode,
        },
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.validatedBody;

    const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      throw new BadRequestError('Email atau password salah');
    }

    const user = users[0];
    if (user.is_banned) {
      throw new BadRequestError(`Akun anda telah dibanned: ${user.ban_reason || 'Pelanggaran'}`);
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new BadRequestError('Email atau password salah');
    }

    const token = jwt.sign({ userId: user.id }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });

    await pool.query(
      `INSERT INTO user_sessions (user_id, token, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
      [user.id, token, req.ip, req.get('user-agent')]
    );

    await logActivity('user', user.id, 'login', 'user', user.id, null, req);

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        user: sanitizeUser(user),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const [users] = await pool.query(
      `SELECT id, username, email, phone, balance, total_deposit, total_order,
              referral_code, api_key, language, theme, max_active_orders,
              max_orders_per_minute, created_at
       FROM users WHERE id = ?`,
      [req.user.id]
    );

    res.json({ success: true, data: users[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
