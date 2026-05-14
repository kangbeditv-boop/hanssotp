const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const config = require('../config/env');
const { adminMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { loginLimiter } = require('../middleware/rateLimiter');
const { logActivity } = require('../middleware/activityLog');
const {
  updateBalanceSchema,
  createServiceSchema,
  updateServiceSchema,
  updateSettingSchema,
  refundSchema,
} = require('../validators/admin');
const { adminLoginSchema } = require('../validators/auth');
const { paginationMeta } = require('../utils/helpers');
const { BadRequestError, NotFoundError } = require('../utils/errors');

const router = express.Router();

router.post('/login', loginLimiter, validate(adminLoginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.validatedBody;

    const [admins] = await pool.query('SELECT * FROM admins WHERE username = ? AND is_active = 1', [username]);
    if (admins.length === 0) {
      throw new BadRequestError('Username atau password salah');
    }

    const admin = admins[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throw new BadRequestError('Username atau password salah');
    }

    const token = jwt.sign({ adminId: admin.id, role: admin.role }, config.jwt.adminSecret, {
      expiresIn: config.jwt.adminExpiresIn,
    });

    await pool.query(
      `INSERT INTO admin_sessions (admin_id, token, ip_address, user_agent, expires_at)
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR))`,
      [admin.id, token, req.ip, req.get('user-agent')]
    );

    await logActivity('admin', admin.id, 'admin_login', 'admin', admin.id, null, req);

    res.json({
      success: true,
      data: {
        token,
        admin: { id: admin.id, username: admin.username, email: admin.email, role: admin.role },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.use(adminMiddleware);

router.get('/dashboard', async (req, res, next) => {
  try {
    const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM users');
    const [totalDeposit] = await pool.query(
      "SELECT COALESCE(SUM(amount),0) as total FROM deposits WHERE status = 'paid'"
    );
    const [totalOrder] = await pool.query('SELECT COUNT(*) as count FROM otp_orders');
    const [totalRevenue] = await pool.query(
      "SELECT COALESCE(SUM(price),0) as total FROM otp_orders WHERE status = 'received'"
    );
    const [totalCost] = await pool.query(
      "SELECT COALESCE(SUM(cost_price),0) as total FROM otp_orders WHERE status = 'received'"
    );

    const [todayDeposit] = await pool.query(
      "SELECT COALESCE(SUM(amount),0) as total FROM deposits WHERE status = 'paid' AND DATE(paid_at) = CURDATE()"
    );
    const [todayOrders] = await pool.query(
      'SELECT COUNT(*) as count FROM otp_orders WHERE DATE(created_at) = CURDATE()'
    );

    const [recentDeposits] = await pool.query(
      `SELECT d.*, u.username FROM deposits d
       LEFT JOIN users u ON d.user_id = u.id
       ORDER BY d.created_at DESC LIMIT 10`
    );

    const [recentOrders] = await pool.query(
      `SELECT oo.*, u.username, os.name as service_name
       FROM otp_orders oo
       LEFT JOIN users u ON oo.user_id = u.id
       LEFT JOIN otp_services os ON oo.service_id = os.id
       ORDER BY oo.created_at DESC LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        total_users: totalUsers[0].count,
        total_deposit: totalDeposit[0].total,
        total_orders: totalOrder[0].count,
        total_revenue: totalRevenue[0].total,
        total_cost: totalCost[0].total,
        profit: parseFloat(totalRevenue[0].total) - parseFloat(totalCost[0].total),
        today_deposit: todayDeposit[0].total,
        today_orders: todayOrders[0].count,
        recent_deposits: recentDeposits,
        recent_orders: recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const search = req.query.search;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    if (search) {
      whereClause = 'WHERE username LIKE ? OR email LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [countResult] = await pool.query(`SELECT COUNT(*) as total FROM users ${whereClause}`, params);
    const [users] = await pool.query(
      `SELECT id, username, email, phone, balance, total_deposit, total_order,
              referral_code, is_banned, ban_reason, max_active_orders, created_at
       FROM users ${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: users,
      meta: paginationMeta(countResult[0].total, page, limit),
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/ban', async (req, res, next) => {
  try {
    const userId = req.params.id;
    const { is_banned, reason } = req.body;

    await pool.query('UPDATE users SET is_banned = ?, ban_reason = ? WHERE id = ?', [
      is_banned ? 1 : 0,
      reason || null,
      userId,
    ]);

    await logActivity('admin', req.admin.id, is_banned ? 'ban_user' : 'unban_user', 'user', userId, { reason }, req);

    res.json({ success: true, message: is_banned ? 'User berhasil di-ban' : 'User berhasil di-unban' });
  } catch (error) {
    next(error);
  }
});

router.patch('/users/:id/balance', validate(updateBalanceSchema), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.params.id;
    const { amount, type, reason } = req.validatedBody;

    const [users] = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
    if (users.length === 0) throw new NotFoundError('User tidak ditemukan');

    const balanceBefore = parseFloat(users[0].balance);
    const adjustedAmount = type === 'add' ? amount : -amount;
    const balanceAfter = balanceBefore + adjustedAmount;

    if (balanceAfter < 0) throw new BadRequestError('Saldo tidak cukup untuk dikurangi');

    await connection.beginTransaction();

    await connection.query('UPDATE users SET balance = ? WHERE id = ?', [balanceAfter, userId]);

    const txType = type === 'add' ? 'manual_add' : 'manual_deduct';
    await connection.query(
      `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, description)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, txType, adjustedAmount, balanceBefore, balanceAfter, `Admin: ${reason}`]
    );

    await connection.commit();

    await logActivity('admin', req.admin.id, `manual_${type}_balance`, 'user', parseInt(userId), { amount, reason }, req);

    res.json({ success: true, message: 'Saldo berhasil diupdate', data: { balance: balanceAfter } });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.get('/orders', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    if (status) {
      whereClause = 'WHERE oo.status = ?';
      params.push(status);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM otp_orders oo ${whereClause}`,
      params
    );

    const [orders] = await pool.query(
      `SELECT oo.*, u.username, c.name as country_name,
              os.name as service_name, op.name as provider_name
       FROM otp_orders oo
       LEFT JOIN users u ON oo.user_id = u.id
       LEFT JOIN countries c ON oo.country_id = c.id
       LEFT JOIN otp_services os ON oo.service_id = os.id
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

router.get('/deposits', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '20', 10);
    const status = req.query.status;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params = [];
    if (status) {
      whereClause = 'WHERE d.status = ?';
      params.push(status);
    }

    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM deposits d ${whereClause}`,
      params
    );

    const [deposits] = await pool.query(
      `SELECT d.*, u.username, pg.name as gateway_name
       FROM deposits d
       LEFT JOIN users u ON d.user_id = u.id
       LEFT JOIN payment_gateways pg ON d.gateway_id = pg.id
       ${whereClause}
       ORDER BY d.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: deposits,
      meta: paginationMeta(countResult[0].total, page, limit),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/refund', validate(refundSchema), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const { order_id, reason } = req.validatedBody;

    const [orders] = await connection.query('SELECT * FROM otp_orders WHERE id = ?', [order_id]);
    if (orders.length === 0) throw new NotFoundError('Order tidak ditemukan');

    const order = orders[0];
    if (['refunded', 'cancelled', 'expired'].includes(order.status))
      throw new BadRequestError('Order sudah di-refund atau dibatalkan');

    const [user] = await connection.query('SELECT balance FROM users WHERE id = ?', [order.user_id]);
    const balanceBefore = parseFloat(user[0].balance);
    const balanceAfter = balanceBefore + parseFloat(order.price);

    await connection.beginTransaction();

    await connection.query("UPDATE otp_orders SET status = 'refunded', cancel_reason = ? WHERE id = ?", [
      reason,
      order_id,
    ]);

    await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [order.price, order.user_id]);

    await connection.query(
      `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
       VALUES (?, 'refund', ?, ?, ?, 'order', ?, ?)`,
      [order.user_id, order.price, balanceBefore, balanceAfter, order_id, `Admin refund: ${reason}`]
    );

    await connection.commit();

    await logActivity('admin', req.admin.id, 'manual_refund', 'order', order_id, { reason, amount: order.price }, req);

    res.json({ success: true, message: 'Refund berhasil' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

// CRUD Services (pricing)
router.get('/services', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const offset = (page - 1) * limit;

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM otp_pricing');
    const [services] = await pool.query(
      `SELECT op.*, c.name as country_name, os.name as service_name,
              opr.name as operator_name, prov.name as provider_name
       FROM otp_pricing op
       LEFT JOIN countries c ON op.country_id = c.id
       LEFT JOIN otp_services os ON op.service_id = os.id
       LEFT JOIN operators opr ON op.operator_id = opr.id
       LEFT JOIN otp_providers prov ON op.provider_id = prov.id
       ORDER BY c.name ASC, os.name ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    res.json({
      success: true,
      data: services,
      meta: paginationMeta(countResult[0].total, page, limit),
    });
  } catch (error) {
    next(error);
  }
});

router.post('/services', validate(createServiceSchema), async (req, res, next) => {
  try {
    const data = req.validatedBody;
    const [result] = await pool.query(
      `INSERT INTO otp_pricing (country_id, service_id, operator_id, provider_id, provider_product_code,
       cost_price, markup_percent, sell_price, auto_pricing, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.country_id, data.service_id, data.operator_id || null, data.provider_id,
        data.provider_product_code || null, data.cost_price, data.markup_percent,
        data.sell_price, data.auto_pricing ? 1 : 0, data.is_active !== false ? 1 : 0,
      ]
    );

    await logActivity('admin', req.admin.id, 'create_service_pricing', 'pricing', result.insertId, data, req);
    res.status(201).json({ success: true, message: 'Layanan berhasil ditambahkan', data: { id: result.insertId } });
  } catch (error) {
    next(error);
  }
});

router.put('/services/:id', validate(updateServiceSchema), async (req, res, next) => {
  try {
    const pricingId = req.params.id;
    const data = req.validatedBody;

    const [existing] = await pool.query('SELECT * FROM otp_pricing WHERE id = ?', [pricingId]);
    if (existing.length === 0) throw new NotFoundError('Layanan tidak ditemukan');

    const updates = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        const dbKey = key === 'auto_pricing' || key === 'is_active' ? key : key;
        updates.push(`${dbKey} = ?`);
        values.push(key === 'auto_pricing' || key === 'is_active' ? (value ? 1 : 0) : value);
      }
    }

    if (updates.length > 0) {
      values.push(pricingId);
      await pool.query(`UPDATE otp_pricing SET ${updates.join(', ')} WHERE id = ?`, values);

      await pool.query(
        `INSERT INTO pricing_history (pricing_id, old_cost_price, new_cost_price, old_sell_price, new_sell_price, old_markup, new_markup, reason, changed_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'Admin update', 'admin')`,
        [
          pricingId,
          existing[0].cost_price, data.cost_price || existing[0].cost_price,
          existing[0].sell_price, data.sell_price || existing[0].sell_price,
          existing[0].markup_percent, data.markup_percent || existing[0].markup_percent,
        ]
      );
    }

    res.json({ success: true, message: 'Layanan berhasil diupdate' });
  } catch (error) {
    next(error);
  }
});

router.delete('/services/:id', async (req, res, next) => {
  try {
    const [result] = await pool.query('DELETE FROM otp_pricing WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) throw new NotFoundError('Layanan tidak ditemukan');

    await logActivity('admin', req.admin.id, 'delete_service_pricing', 'pricing', parseInt(req.params.id), null, req);
    res.json({ success: true, message: 'Layanan berhasil dihapus' });
  } catch (error) {
    next(error);
  }
});

// Settings
router.get('/settings', async (req, res, next) => {
  try {
    const [settings] = await pool.query('SELECT * FROM website_settings ORDER BY setting_key ASC');
    res.json({ success: true, data: settings });
  } catch (error) {
    next(error);
  }
});

router.put('/settings', validate(updateSettingSchema), async (req, res, next) => {
  try {
    const { setting_key, setting_value } = req.validatedBody;
    await pool.query(
      'UPDATE website_settings SET setting_value = ? WHERE setting_key = ?',
      [setting_value, setting_key]
    );

    await logActivity('admin', req.admin.id, 'update_setting', 'setting', null, { setting_key }, req);
    res.json({ success: true, message: 'Setting berhasil diupdate' });
  } catch (error) {
    next(error);
  }
});

router.put('/settings/bulk', async (req, res, next) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) throw new BadRequestError('Settings harus berupa array');

    for (const setting of settings) {
      await pool.query(
        'UPDATE website_settings SET setting_value = ? WHERE setting_key = ?',
        [setting.setting_value, setting.setting_key]
      );
    }

    await logActivity('admin', req.admin.id, 'bulk_update_settings', 'setting', null, { count: settings.length }, req);
    res.json({ success: true, message: 'Settings berhasil diupdate' });
  } catch (error) {
    next(error);
  }
});

// Activity logs
router.get('/activity-logs', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page || '1', 10);
    const limit = parseInt(req.query.limit || '50', 10);
    const offset = (page - 1) * limit;

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM activity_logs');
    const [logs] = await pool.query(
      'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    res.json({
      success: true,
      data: logs,
      meta: paginationMeta(countResult[0].total, page, limit),
    });
  } catch (error) {
    next(error);
  }
});

// Reference data for admin
router.get('/countries', async (req, res, next) => {
  try {
    const [countries] = await pool.query('SELECT * FROM countries ORDER BY sort_order ASC');
    res.json({ success: true, data: countries });
  } catch (error) {
    next(error);
  }
});

router.get('/otp-services', async (req, res, next) => {
  try {
    const [services] = await pool.query('SELECT * FROM otp_services ORDER BY sort_order ASC');
    res.json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
});

router.get('/providers', async (req, res, next) => {
  try {
    const [providers] = await pool.query('SELECT * FROM otp_providers ORDER BY priority ASC');
    res.json({ success: true, data: providers });
  } catch (error) {
    next(error);
  }
});

router.get('/operators', async (req, res, next) => {
  try {
    const [operators] = await pool.query(
      `SELECT o.*, c.name as country_name FROM operators o
       LEFT JOIN countries c ON o.country_id = c.id ORDER BY c.name ASC, o.name ASC`
    );
    res.json({ success: true, data: operators });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
