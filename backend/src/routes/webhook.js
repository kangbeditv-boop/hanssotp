const express = require('express');
const { pool } = require('../config/database');
const { getGateway } = require('../adapters');
const affiliateService = require('../services/affiliateService');
const telegramService = require('../services/telegramService');
const logger = require('../utils/logger');

const router = express.Router();

async function processWebhook(gatewayCode, req, res) {
  const connection = await pool.getConnection();
  try {
    await connection.query(
      `INSERT INTO webhook_logs (gateway, endpoint, method, headers, payload, ip_address)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        gatewayCode,
        req.originalUrl,
        req.method,
        JSON.stringify(req.headers),
        JSON.stringify(req.body),
        req.ip,
      ]
    );

    const gateway = await getGateway(gatewayCode);

    const signature =
      req.headers['x-callback-signature'] ||
      req.headers['x-signature'] ||
      req.headers['x-tripay-callback-signature'] ||
      '';

    if (!gateway.validateSignature(req.body, signature)) {
      logger.warn({ gatewayCode }, 'Webhook: Invalid signature');
      await connection.query(
        "UPDATE webhook_logs SET is_valid = 0, response_code = 403 WHERE gateway = ? ORDER BY id DESC LIMIT 1",
        [gatewayCode]
      );
      return res.status(403).json({ success: false, message: 'Invalid signature' });
    }

    const webhookData = gateway.parseWebhook(req.body);

    const [deposits] = await connection.query(
      "SELECT * FROM deposits WHERE reference = ? AND status = 'pending'",
      [webhookData.reference]
    );

    if (deposits.length === 0) {
      logger.info({ reference: webhookData.reference }, 'Webhook: Deposit not found or already processed');
      return res.json({ success: true, message: 'OK' });
    }

    const deposit = deposits[0];

    if (webhookData.status === 'paid') {
      await connection.beginTransaction();

      await connection.query(
        "UPDATE deposits SET status = 'paid', paid_at = NOW() WHERE id = ?",
        [deposit.id]
      );

      const [user] = await connection.query('SELECT balance FROM users WHERE id = ?', [
        deposit.user_id,
      ]);

      const balanceBefore = parseFloat(user[0].balance);
      const balanceAfter = balanceBefore + parseFloat(deposit.amount);

      await connection.query(
        'UPDATE users SET balance = balance + ?, total_deposit = total_deposit + ? WHERE id = ?',
        [deposit.amount, deposit.amount, deposit.user_id]
      );

      await connection.query(
        `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
         VALUES (?, 'deposit', ?, ?, ?, 'deposit', ?, ?)`,
        [
          deposit.user_id,
          deposit.amount,
          balanceBefore,
          balanceAfter,
          deposit.id,
          `Deposit via ${gatewayCode} - ${webhookData.reference}`,
        ]
      );

      await connection.commit();

      await affiliateService.processCommission(deposit.user_id, 'deposit', deposit.id, parseFloat(deposit.amount));
      await telegramService.notifyDepositSuccess(deposit.user_id, parseFloat(deposit.amount), webhookData.reference);

      const io = req.app.get('io');
      if (io) {
        io.to(`user:${deposit.user_id}`).emit('deposit:success', {
          deposit_id: deposit.id,
          amount: deposit.amount,
          reference: deposit.reference,
        });
      }

      logger.info({ depositId: deposit.id, amount: deposit.amount }, 'Deposit paid successfully');
    } else if (['expired', 'failed'].includes(webhookData.status)) {
      await connection.query('UPDATE deposits SET status = ? WHERE id = ?', [
        webhookData.status,
        deposit.id,
      ]);
    }

    await connection.query(
      'UPDATE webhook_logs SET is_valid = 1, response_code = 200 WHERE gateway = ? ORDER BY id DESC LIMIT 1',
      [gatewayCode]
    );

    res.json({ success: true, message: 'OK' });
  } catch (error) {
    await connection.rollback();
    logger.error({ err: error, gatewayCode }, 'Webhook processing failed');
    res.status(500).json({ success: false, message: 'Internal error' });
  } finally {
    connection.release();
  }
}

router.post('/tripay', (req, res) => processWebhook('tripay', req, res));
router.post('/qrispy', (req, res) => processWebhook('qrispy', req, res));

module.exports = router;
