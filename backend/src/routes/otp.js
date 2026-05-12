const express = require('express');
const { pool } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { orderOtpSchema } = require('../validators/otp');
const { getProviderByDbId } = require('../providers');
const { logActivity } = require('../middleware/activityLog');
const affiliateService = require('../services/affiliateService');
const telegramService = require('../services/telegramService');
const logger = require('../utils/logger');
const { BadRequestError, NotFoundError, TooManyRequestsError } = require('../utils/errors');

const router = express.Router();

router.get('/countries', async (req, res, next) => {
  try {
    const [countries] = await pool.query(
      'SELECT * FROM countries WHERE is_active = 1 ORDER BY sort_order ASC, name ASC'
    );
    res.json({ success: true, data: countries });
  } catch (error) {
    next(error);
  }
});

router.get('/services', async (req, res, next) => {
  try {
    const countryId = req.query.country_id;
    let query = `
      SELECT DISTINCT os.* FROM otp_services os
      JOIN otp_pricing op ON os.id = op.service_id AND op.is_active = 1
    `;
    const params = [];

    if (countryId) {
      query += ' WHERE op.country_id = ?';
      params.push(countryId);
    }

    query += ' AND os.is_active = 1 ORDER BY os.sort_order ASC, os.name ASC';

    const [services] = await pool.query(query, params);
    res.json({ success: true, data: services });
  } catch (error) {
    next(error);
  }
});

router.get('/operators', async (req, res, next) => {
  try {
    const { country_id } = req.query;
    let query = 'SELECT * FROM operators WHERE is_active = 1';
    const params = [];

    if (country_id) {
      query += ' AND country_id = ?';
      params.push(country_id);
    }

    query += ' ORDER BY name ASC';
    const [operators] = await pool.query(query, params);
    res.json({ success: true, data: operators });
  } catch (error) {
    next(error);
  }
});

router.get('/pricing', async (req, res, next) => {
  try {
    const { country_id, service_id } = req.query;

    let query = `
      SELECT op.*, c.name as country_name, c.flag_emoji,
             os.name as service_name, opr.name as operator_name,
             prov.name as provider_name
      FROM otp_pricing op
      LEFT JOIN countries c ON op.country_id = c.id
      LEFT JOIN otp_services os ON op.service_id = os.id
      LEFT JOIN operators opr ON op.operator_id = opr.id
      LEFT JOIN otp_providers prov ON op.provider_id = prov.id
      WHERE op.is_active = 1
    `;
    const params = [];

    if (country_id) {
      query += ' AND op.country_id = ?';
      params.push(country_id);
    }
    if (service_id) {
      query += ' AND op.service_id = ?';
      params.push(service_id);
    }

    query += ' ORDER BY op.sell_price ASC';
    const [pricing] = await pool.query(query, params);
    res.json({ success: true, data: pricing });
  } catch (error) {
    next(error);
  }
});

router.post('/order', authMiddleware, validate(orderOtpSchema), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { country_id, service_id, operator_id, provider_id } = req.validatedBody;

    const [userRow] = await connection.query(
      'SELECT balance, max_active_orders, max_orders_per_minute FROM users WHERE id = ?',
      [userId]
    );
    const user = userRow[0];

    const [activeOrders] = await connection.query(
      "SELECT COUNT(*) as count FROM otp_orders WHERE user_id = ? AND status IN ('pending','waiting_otp')",
      [userId]
    );

    if (activeOrders[0].count >= user.max_active_orders) {
      throw new TooManyRequestsError(
        `Maksimal ${user.max_active_orders} order aktif. Tunggu order sebelumnya selesai.`
      );
    }

    const [recentOrders] = await connection.query(
      "SELECT COUNT(*) as count FROM otp_orders WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)",
      [userId]
    );

    if (recentOrders[0].count >= user.max_orders_per_minute) {
      throw new TooManyRequestsError(
        `Maksimal ${user.max_orders_per_minute} order per menit. Tunggu sebentar.`
      );
    }

    let pricingQuery = `
      SELECT op.*, prov.code as provider_code, c.code as country_code,
             os.code as service_code, opr.code as operator_code
      FROM otp_pricing op
      JOIN otp_providers prov ON op.provider_id = prov.id
      JOIN countries c ON op.country_id = c.id
      JOIN otp_services os ON op.service_id = os.id
      LEFT JOIN operators opr ON op.operator_id = opr.id
      WHERE op.country_id = ? AND op.service_id = ? AND op.is_active = 1 AND prov.is_active = 1
    `;
    const pricingParams = [country_id, service_id];

    if (operator_id) {
      pricingQuery += ' AND op.operator_id = ?';
      pricingParams.push(operator_id);
    }
    if (provider_id) {
      pricingQuery += ' AND op.provider_id = ?';
      pricingParams.push(provider_id);
    }

    pricingQuery += ' ORDER BY prov.priority ASC, op.sell_price ASC LIMIT 1';

    const [pricingRows] = await connection.query(pricingQuery, pricingParams);
    if (pricingRows.length === 0) {
      throw new NotFoundError('Layanan tidak tersedia untuk negara dan operator yang dipilih');
    }

    const pricing = pricingRows[0];
    const sellPrice = parseFloat(pricing.sell_price);

    if (parseFloat(user.balance) < sellPrice) {
      throw new BadRequestError(`Saldo tidak cukup. Dibutuhkan Rp${sellPrice.toLocaleString('id-ID')}`);
    }

    await connection.beginTransaction();

    const balanceBefore = parseFloat(user.balance);
    const balanceAfter = balanceBefore - sellPrice;

    await connection.query('UPDATE users SET balance = balance - ?, total_order = total_order + 1 WHERE id = ?', [
      sellPrice,
      userId,
    ]);

    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const [orderResult] = await connection.query(
      `INSERT INTO otp_orders (user_id, provider_id, country_id, service_id, operator_id, price, cost_price, status, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
      [userId, pricing.provider_id, country_id, service_id, operator_id || null, sellPrice, parseFloat(pricing.cost_price), expiresAt]
    );

    const orderId = orderResult.insertId;

    await connection.query(
      `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
       VALUES (?, 'order', ?, ?, ?, 'order', ?, ?)`,
      [userId, -sellPrice, balanceBefore, balanceAfter, orderId, `Order OTP - ${pricing.service_code}`]
    );

    await connection.commit();

    let providerResult;
    try {
      const provider = await getProviderByDbId(pricing.provider_id);
      providerResult = await provider.createOrder(
        pricing.country_code,
        pricing.service_code,
        pricing.operator_code
      );

      await pool.query(
        `UPDATE otp_orders SET provider_order_id = ?, phone_number = ?, status = 'waiting_otp', provider_status = ?
         WHERE id = ?`,
        [providerResult.orderId, providerResult.phoneNumber, providerResult.status, orderId]
      );

      await pool.query(
        `INSERT INTO otp_order_logs (order_id, action, details)
         VALUES (?, 'order_created', ?)`,
        [orderId, JSON.stringify(providerResult)]
      );
    } catch (providerError) {
      logger.error({ err: providerError, orderId }, 'Provider createOrder failed, refunding');

      await pool.query("UPDATE otp_orders SET status = 'error', cancel_reason = ? WHERE id = ?", [
        providerError.message,
        orderId,
      ]);

      await pool.query('UPDATE users SET balance = balance + ?, total_order = total_order - 1 WHERE id = ?', [
        sellPrice,
        userId,
      ]);

      await pool.query(
        `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
         VALUES (?, 'refund', ?, ?, ?, 'order', ?, ?)`,
        [userId, sellPrice, balanceAfter, balanceBefore, orderId, 'Refund - Order gagal']
      );

      await telegramService.notifyOrderFailed(userId, pricing.service_code, providerError.message);

      throw new BadRequestError(`Order gagal: ${providerError.message}`);
    }

    await logActivity('user', userId, 'order_otp', 'order', orderId, { service: pricing.service_code }, req);

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit('order:created', {
        order_id: orderId,
        phone_number: providerResult.phoneNumber,
        status: 'waiting_otp',
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order berhasil dibuat',
      data: {
        order_id: orderId,
        phone_number: providerResult.phoneNumber,
        provider_order_id: providerResult.orderId,
        price: sellPrice,
        status: 'waiting_otp',
        expires_at: expiresAt,
      },
    });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.get('/order/:id', authMiddleware, async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      `SELECT oo.*, c.name as country_name, c.flag_emoji,
              os.name as service_name, opr.name as operator_name,
              op.name as provider_name
       FROM otp_orders oo
       LEFT JOIN countries c ON oo.country_id = c.id
       LEFT JOIN otp_services os ON oo.service_id = os.id
       LEFT JOIN operators opr ON oo.operator_id = opr.id
       LEFT JOIN otp_providers op ON oo.provider_id = op.id
       WHERE oo.id = ? AND oo.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (orders.length === 0) {
      throw new NotFoundError('Order tidak ditemukan');
    }

    const [logs] = await pool.query(
      'SELECT * FROM otp_order_logs WHERE order_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );

    res.json({ success: true, data: { ...orders[0], logs } });
  } catch (error) {
    next(error);
  }
});

router.post('/order/:id/cancel', authMiddleware, async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const [orders] = await connection.query(
      "SELECT * FROM otp_orders WHERE id = ? AND user_id = ? AND status IN ('pending','waiting_otp')",
      [orderId, userId]
    );

    if (orders.length === 0) {
      throw new NotFoundError('Order tidak ditemukan atau sudah tidak bisa dibatalkan');
    }

    const order = orders[0];

    if (order.provider_order_id) {
      try {
        const provider = await getProviderByDbId(order.provider_id);
        await provider.cancelOrder(order.provider_order_id);
      } catch (err) {
        logger.warn({ err, orderId }, 'Provider cancelOrder failed');
      }
    }

    await connection.beginTransaction();

    await connection.query(
      "UPDATE otp_orders SET status = 'cancelled', cancel_reason = 'Dibatalkan oleh user' WHERE id = ?",
      [orderId]
    );

    const [user] = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
    const balanceBefore = parseFloat(user[0].balance);
    const balanceAfter = balanceBefore + parseFloat(order.price);

    await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [
      order.price,
      userId,
    ]);

    await connection.query(
      `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
       VALUES (?, 'refund', ?, ?, ?, 'order', ?, 'Refund - Order dibatalkan')`,
      [userId, order.price, balanceBefore, balanceAfter, orderId]
    );

    await connection.query(
      "INSERT INTO otp_order_logs (order_id, action, details) VALUES (?, 'cancelled', ?)",
      [orderId, JSON.stringify({ reason: 'User cancelled' })]
    );

    await connection.commit();

    const io = req.app.get('io');
    if (io) {
      io.to(`user:${userId}`).emit('order:cancelled', { order_id: orderId });
    }

    res.json({ success: true, message: 'Order berhasil dibatalkan dan saldo dikembalikan' });
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.post('/order/:id/resend', authMiddleware, async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const [orders] = await pool.query(
      "SELECT * FROM otp_orders WHERE id = ? AND user_id = ? AND status = 'waiting_otp'",
      [orderId, userId]
    );

    if (orders.length === 0) {
      throw new NotFoundError('Order tidak ditemukan atau tidak dalam status menunggu OTP');
    }

    const order = orders[0];
    const provider = await getProviderByDbId(order.provider_id);
    const result = await provider.resendOtp(order.provider_order_id);

    await pool.query(
      "INSERT INTO otp_order_logs (order_id, action, details) VALUES (?, 'resend_otp', ?)",
      [orderId, JSON.stringify(result)]
    );

    res.json({
      success: result.success,
      message: result.success ? 'Permintaan resend OTP dikirim' : result.message,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
