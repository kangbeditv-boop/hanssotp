const { pool } = require('../config/database');
const { getProviderByDbId } = require('../providers');
const telegramService = require('../services/telegramService');
const affiliateService = require('../services/affiliateService');
const logger = require('../utils/logger');

async function pollOtpStatus(io) {
  try {
    const [orders] = await pool.query(
      "SELECT * FROM otp_orders WHERE status = 'waiting_otp' AND provider_order_id IS NOT NULL"
    );

    for (const order of orders) {
      try {
        const provider = await getProviderByDbId(order.provider_id);
        const result = await provider.getOrderStatus(order.provider_order_id);

        if (result.otpCode && result.otpCode !== order.otp_code) {
          await pool.query(
            `UPDATE otp_orders SET otp_code = ?, status = 'received', provider_status = ?, otp_received_at = NOW()
             WHERE id = ?`,
            [result.otpCode, result.status, order.id]
          );

          await pool.query(
            "INSERT INTO otp_order_logs (order_id, action, details) VALUES (?, 'otp_received', ?)",
            [order.id, JSON.stringify({ otp: result.otpCode })]
          );

          if (io) {
            io.to(`user:${order.user_id}`).emit('otp:received', {
              order_id: order.id,
              phone_number: order.phone_number,
              otp_code: result.otpCode,
            });

            io.to(`order:${order.id}`).emit('otp:received', {
              order_id: order.id,
              phone_number: order.phone_number,
              otp_code: result.otpCode,
            });
          }

          const [service] = await pool.query('SELECT name FROM otp_services WHERE id = ?', [order.service_id]);
          await telegramService.notifyOtpReceived(
            order.user_id,
            service[0]?.name || 'Unknown',
            order.phone_number,
            result.otpCode
          );

          await affiliateService.processCommission(order.user_id, 'order', order.id, parseFloat(order.price));

          logger.info({ orderId: order.id, otp: result.otpCode }, 'OTP received');
        } else if (['cancelled', 'error'].includes(result.status)) {
          await pool.query(
            "UPDATE otp_orders SET status = ?, provider_status = ? WHERE id = ?",
            [result.status === 'error' ? 'error' : 'cancelled', result.status, order.id]
          );
        }
      } catch (err) {
        logger.error({ err, orderId: order.id }, 'Error polling OTP status');
      }
    }
  } catch (error) {
    logger.error({ err: error }, 'OTP poller failed');
  }
}

module.exports = { pollOtpStatus };
