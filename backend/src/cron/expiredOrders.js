const { pool } = require('../config/database');
const { getProviderByDbId } = require('../providers');
const logger = require('../utils/logger');

async function cancelExpiredOrders(io) {
  const connection = await pool.getConnection();
  try {
    const [expiredOrders] = await connection.query(
      "SELECT * FROM otp_orders WHERE status IN ('pending','waiting_otp') AND expires_at < NOW()"
    );

    for (const order of expiredOrders) {
      try {
        if (order.provider_order_id) {
          try {
            const provider = await getProviderByDbId(order.provider_id);
            await provider.cancelOrder(order.provider_order_id);
          } catch (err) {
            logger.warn({ err, orderId: order.id }, 'Failed to cancel expired order at provider');
          }
        }

        await connection.beginTransaction();

        await connection.query(
          "UPDATE otp_orders SET status = 'expired', cancel_reason = 'Auto expired after 15 minutes' WHERE id = ?",
          [order.id]
        );

        const [user] = await connection.query('SELECT balance FROM users WHERE id = ?', [order.user_id]);
        const balanceBefore = parseFloat(user[0].balance);
        const balanceAfter = balanceBefore + parseFloat(order.price);

        await connection.query('UPDATE users SET balance = balance + ? WHERE id = ?', [
          order.price,
          order.user_id,
        ]);

        await connection.query(
          `INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, reference_type, reference_id, description)
           VALUES (?, 'refund', ?, ?, ?, 'order', ?, 'Auto refund - Order expired')`,
          [order.user_id, order.price, balanceBefore, balanceAfter, order.id]
        );

        await connection.query(
          "INSERT INTO otp_order_logs (order_id, action, details) VALUES (?, 'auto_expired', ?)",
          [order.id, JSON.stringify({ reason: 'Order expired after 15 minutes' })]
        );

        await connection.commit();

        if (io) {
          io.to(`user:${order.user_id}`).emit('order:expired', {
            order_id: order.id,
            refund_amount: order.price,
          });
        }

        logger.info({ orderId: order.id }, 'Order auto-expired and refunded');
      } catch (err) {
        await connection.rollback();
        logger.error({ err, orderId: order.id }, 'Error processing expired order');
      }
    }
  } catch (error) {
    logger.error({ err: error }, 'Expired orders job failed');
  } finally {
    connection.release();
  }
}

module.exports = { cancelExpiredOrders };
