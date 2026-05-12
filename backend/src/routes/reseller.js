const express = require('express');
const { pool } = require('../config/database');
const { resellerApiMiddleware } = require('../middleware/auth');
const { resellerLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const { orderOtpSchema } = require('../validators/otp');
const { getProviderByDbId } = require('../providers');
const logger = require('../utils/logger');
const { BadRequestError, NotFoundError, TooManyRequestsError } = require('../utils/errors');

const router = express.Router();

router.use(resellerLimiter);
router.use(resellerApiMiddleware);

async function logApiCall(req, responseCode, responseBody) {
  try {
    await pool.query(
      `INSERT INTO reseller_api_logs (api_key_id, user_id, endpoint, method, request_body, response_code, response_body, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.apiKeyData.id,
        req.user.id,
        req.originalUrl,
        req.method,
        JSON.stringify(req.body),
        responseCode,
        JSON.stringify(responseBody),
        req.ip,
      ]
    );
  } catch (err) {
    logger.error({ err }, 'Failed to log API call');
  }
}

router.get('/balance', async (req, res, next) => {
  try {
    const [user] = await pool.query('SELECT balance FROM users WHERE id = ?', [req.user.id]);
    const response = { success: true, data: { balance: user[0].balance } };
    await logApiCall(req, 200, response);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.get('/services', async (req, res, next) => {
  try {
    const { country_id } = req.query;

    let query = `
      SELECT op.id, op.sell_price as price, op.stock,
             c.code as country_code, c.name as country_name,
             os.code as service_code, os.name as service_name,
             opr.name as operator_name
      FROM otp_pricing op
      JOIN countries c ON op.country_id = c.id
      JOIN otp_services os ON op.service_id = os.id
      LEFT JOIN operators opr ON op.operator_id = opr.id
      WHERE op.is_active = 1
    `;
    const params = [];
    if (country_id) {
      query += ' AND op.country_id = ?';
      params.push(country_id);
    }

    query += ' ORDER BY c.name ASC, os.name ASC';
    const [services] = await pool.query(query, params);

    const response = { success: true, data: services };
    await logApiCall(req, 200, response);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/order', validate(orderOtpSchema), async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { country_id, service_id, operator_id } = req.validatedBody;

    const [activeOrders] = await connection.query(
      "SELECT COUNT(*) as count FROM otp_orders WHERE user_id = ? AND status IN ('pending','waiting_otp')",
      [userId]
    );
    if (activeOrders[0].count >= req.user.max_active_orders) {
      throw new TooManyRequestsError('Max active orders reached');
    }

    const [recentOrders] = await connection.query(
      "SELECT COUNT(*) as count FROM otp_orders WHERE user_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)",
      [userId]
    );
    if (recentOrders[0].count >= req.user.max_orders_per_minute) {
      throw new TooManyRequestsError('Rate limit: too many orders per minute');
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
    pricingQuery += ' ORDER BY prov.priority ASC, op.sell_price ASC LIMIT 1';

    const [pricingRows] = await connection.query(pricingQuery, pricingParams);
    if (pricingRows.length === 0) {
      throw new NotFoundError('Service not available');
    }

    const pricing = pricingRows[0];
    const sellPrice = parseFloat(pricing.sell_price);

    const [userRow] = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
    if (parseFloat(userRow[0].balance) < sellPrice) {
      throw new BadRequestError('Insufficient balance');
    }

    await connection.beginTransaction();

    const balanceBefore = parseFloat(userRow[0].balance);
    const balanceAfter = balanceBefore - sellPrice;

    await connection.query('UPDATE users SET balance = balance - ?, total_order = total_order + 1 WHERE id = ?', [
      sellPrice, userId,
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
      [userId, -sellPrice, balanceBefore, balanceAfter, orderId, `API Order - ${pricing.service_code}`]
    );

    await connection.commit();

    let providerResult;
    try {
      const provider = await getProviderByDbId(pricing.provider_id);
      providerResult = await provider.createOrder(pricing.country_code, pricing.service_code, pricing.operator_code);

      await pool.query(
        `UPDATE otp_orders SET provider_order_id = ?, phone_number = ?, status = 'waiting_otp', provider_status = ?
         WHERE id = ?`,
        [providerResult.orderId, providerResult.phoneNumber, providerResult.status, orderId]
      );
    } catch (providerError) {
      await pool.query("UPDATE otp_orders SET status = 'error', cancel_reason = ? WHERE id = ?", [
        providerError.message, orderId,
      ]);
      await pool.query('UPDATE users SET balance = balance + ?, total_order = total_order - 1 WHERE id = ?', [
        sellPrice, userId,
      ]);
      await pool.query(
        `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
         VALUES (?, 'refund', ?, ?, ?, 'order', ?, 'API Refund - Order failed')`,
        [userId, sellPrice, balanceAfter, balanceBefore, orderId]
      );
      throw new BadRequestError(`Order failed: ${providerError.message}`);
    }

    const response = {
      success: true,
      data: {
        order_id: orderId,
        phone_number: providerResult.phoneNumber,
        price: sellPrice,
        status: 'waiting_otp',
        expires_at: expiresAt,
      },
    };
    await logApiCall(req, 201, response);
    res.status(201).json(response);
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

router.get('/order/:id', async (req, res, next) => {
  try {
    const [orders] = await pool.query(
      `SELECT id, phone_number, otp_code, price, status, provider_order_id, expires_at, created_at
       FROM otp_orders WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (orders.length === 0) throw new NotFoundError('Order not found');

    const response = { success: true, data: orders[0] };
    await logApiCall(req, 200, response);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/order/:id/cancel', async (req, res, next) => {
  const connection = await pool.getConnection();
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    const [orders] = await connection.query(
      "SELECT * FROM otp_orders WHERE id = ? AND user_id = ? AND status IN ('pending','waiting_otp')",
      [orderId, userId]
    );
    if (orders.length === 0) throw new NotFoundError('Order not found or cannot be cancelled');

    const order = orders[0];
    if (order.provider_order_id) {
      try {
        const provider = await getProviderByDbId(order.provider_id);
        await provider.cancelOrder(order.provider_order_id);
      } catch (err) {
        logger.warn({ err, orderId }, 'Provider cancel failed');
      }
    }

    await connection.beginTransaction();

    await connection.query("UPDATE otp_orders SET status = 'cancelled', cancel_reason = 'API cancel' WHERE id = ?", [orderId]);

    const [user] = await connection.query('SELECT balance FROM users WHERE id = ?', [userId]);
    const balanceBefore = parseFloat(user[0].balance);
    const balanceAfter = balanceBefore + parseFloat(order.price);

    await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [order.price, userId]);
    await connection.query(
      `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
       VALUES (?, 'refund', ?, ?, ?, 'order', ?, 'API cancel refund')`,
      [userId, order.price, balanceBefore, balanceAfter, orderId]
    );

    await connection.commit();

    const response = { success: true, message: 'Order cancelled and refunded' };
    await logApiCall(req, 200, response);
    res.json(response);
  } catch (error) {
    await connection.rollback();
    next(error);
  } finally {
    connection.release();
  }
});

module.exports = router;
