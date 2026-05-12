const jwt = require('jsonwebtoken');
const config = require('../config/env');
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

    socket.on('subscribe:order', (orderId) => {
      socket.join(`order:${orderId}`);
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
