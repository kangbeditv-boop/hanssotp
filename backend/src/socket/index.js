const jwt = require('jsonwebtoken');
const config = require('../config/env');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

function setupSocket(io) {
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      socket.userId = decoded.userId;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.userId;
    socket.join(`user:${userId}`);
    logger.info({ userId }, 'User connected to socket');

    socket.on('subscribe:order', async (orderId) => {
      const safeId = parseInt(orderId, 10);
      if (!safeId || safeId <= 0) return;
      try {
        const [rows] = await pool.query(
          'SELECT id FROM otp_orders WHERE id = ? AND user_id = ?',
          [safeId, userId]
        );
        if (rows.length > 0) {
          socket.join(`order:${safeId}`);
        }
      } catch (err) {
        logger.error({ err, orderId: safeId, userId }, 'Error verifying order ownership for socket');
      }
    });

    socket.on('unsubscribe:order', (orderId) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on('disconnect', () => {
      logger.info({ userId }, 'User disconnected from socket');
    });
  });

  return io;
}

module.exports = { setupSocket };
