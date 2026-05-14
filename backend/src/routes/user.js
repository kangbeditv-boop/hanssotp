const express = require('express');
const { pool } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { paginationMeta } = require('../utils/helpers');

const router = express.Router();

router.use(authMiddleware);

router.get('/dashboard', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [userRows] = await pool.query(
      'SELECT balance, total_deposit, total_order FROM users WHERE id = ?',
      [userId]
    );

    const [activeOrders] = await pool.query(
      "SELECT COUNT(*) as count FROM otp_orders WHERE user_id = ? AND status IN ('pending','waiting_otp')",
      [userId]
    );

    const [recentOrders] = await pool.query(
      `SELECT oo.*, c.name as country_name, os.name as service_name, op.name as provider_name
       FROM otp_orders oo
       LEFT JOIN countries c ON oo.country_id = c.id
       LEFT JOIN otp_services os ON oo.service_id = os.id
       LEFT JOIN otp_providers op ON oo.provider_id = op.id
       WHERE oo.user_id = ?
       ORDER BY oo.created_at DESC LIMIT 10`,
      [userId]
    );

    const [recentTransactions] = await pool.query(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    res.json({
      success: true,
      data: {
        balance: userRows[0].balance,
        total_deposit: userRows[0].total_deposit,
        total_order: userRows[0].total_order,
        active_orders: activeOrders[0].count,
        recent_orders: recentOrders,
        recent_transactions: recentTransactions,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/transactions', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const type = req.query.type;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE user_id = ?';
    const params = [userId];

    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM transactions ${whereClause}`,
      params
    );

    const [transactions] = await pool.query(
      `SELECT * FROM transactions ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: transactions,
      meta: paginationMeta(countResult[0].total, page, limit),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE oo.user_id = ?';
    const params = [userId];

    if (status) {
      whereClause += ' AND oo.status = ?';
      params.push(status);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM otp_orders oo ${whereClause}`,
      params
    );

    const [orders] = await pool.query(
      `SELECT oo.*, c.name as country_name, c.flag_emoji,
              os.name as service_name, opr.name as operator_name,
              op.name as provider_name
       FROM otp_orders oo
       LEFT JOIN countries c ON oo.country_id = c.id
       LEFT JOIN otp_services os ON oo.service_id = os.id
       LEFT JOIN operators opr ON oo.operator_id = opr.id
       LEFT JOIN otp_providers op ON oo.provider_id = op.id
       ${whereClause}
       ORDER BY oo.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: orders,
      meta: paginationMeta(countResult[0].total, page, limit),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/affiliate', async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [affiliate] = await pool.query(
      'SELECT * FROM affiliates WHERE user_id = ?',
      [userId]
    );

    const [commissions] = await pool.query(
      `SELECT ac.*, u.username as referred_username
       FROM affiliate_commissions ac
       LEFT JOIN users u ON ac.referred_user_id = u.id
       WHERE ac.user_id = ?
       ORDER BY ac.created_at DESC LIMIT 50`,
      [userId]
    );

    const [user] = await pool.query(
      'SELECT referral_code FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      data: {
        affiliate: affiliate[0] || null,
        referral_code: user[0]?.referral_code,
        commissions,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.put('/profile', async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { language, theme, phone } = req.body;

    const updates = [];
    const values = [];

    if (language && ['id', 'en'].includes(language)) {
      updates.push('language = ?');
      values.push(language);
    }
    if (theme && ['light', 'dark'].includes(theme)) {
      updates.push('theme = ?');
      values.push(theme);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }

    if (updates.length > 0) {
      values.push(userId);
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    const [user] = await pool.query(
      'SELECT id, username, email, phone, language, theme FROM users WHERE id = ?',
      [userId]
    );

    res.json({ success: true, data: user[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
