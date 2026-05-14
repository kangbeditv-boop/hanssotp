const express = require('express');
const { pool } = require('../config/database');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { createDepositSchema } = require('../validators/deposit');
const { getGateway } = require('../adapters');
const { generateReference } = require('../utils/helpers');
const { logActivity } = require('../middleware/activityLog');
const affiliateService = require('../services/affiliateService');
const telegramService = require('../services/telegramService');
const logger = require('../utils/logger');
const { BadRequestError, NotFoundError } = require('../utils/errors');

const router = express.Router();

router.post('/create', authMiddleware, validate(createDepositSchema), async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, gateway: gatewayCode } = req.validatedBody;

    const [gateways] = await pool.query(
      'SELECT * FROM payment_gateways WHERE code = ? AND is_active = 1',
      [gatewayCode]
    );
    if (gateways.length === 0) {
      throw new BadRequestError('Payment gateway tidak tersedia');
    }

    const reference = generateReference('DEP');
    const gateway = await getGateway(gatewayCode);

    const [user] = await pool.query('SELECT username, email FROM users WHERE id = ?', [userId]);
    const callbackUrl = `${process.env.CORS_ORIGIN || 'http://localhost:5000'}/api/webhooks/${gatewayCode}`;
    const returnUrl = `${process.env.CORS_ORIGIN || 'http://localhost:5173'}/dashboard/deposit`;

    const paymentResult = await gateway.createPayment({
      reference,
      amount,
      customerName: user[0].username,
      customerEmail: user[0].email,
      callbackUrl,
      returnUrl,
    });

    await pool.query(
      `INSERT INTO deposits (user_id, gateway_id, reference, amount, fee, total_amount, status, payment_url, qr_url, gateway_reference, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [
        userId,
        gateways[0].id,
        reference,
        amount,
        paymentResult.fee,
        amount + paymentResult.fee,
        paymentResult.paymentUrl,
        paymentResult.qrUrl,
        paymentResult.gatewayReference,
        paymentResult.expiresAt,
      ]
    );

    await logActivity('user', userId, 'create_deposit', 'deposit', null, { amount, gateway: gatewayCode }, req);

    res.status(201).json({
      success: true,
      message: 'Deposit berhasil dibuat',
      data: {
        reference,
        amount,
        fee: paymentResult.fee,
        total_amount: amount + paymentResult.fee,
        payment_url: paymentResult.paymentUrl,
        qr_url: paymentResult.qrUrl,
        expires_at: paymentResult.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const [deposits] = await pool.query(
      `SELECT d.*, pg.name as gateway_name
       FROM deposits d
       LEFT JOIN payment_gateways pg ON d.gateway_id = pg.id
       WHERE d.id = ? AND d.user_id = ?`,
      [req.params.id, req.user.id]
    );

    if (deposits.length === 0) {
      throw new NotFoundError('Deposit tidak ditemukan');
    }

    res.json({ success: true, data: deposits[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
