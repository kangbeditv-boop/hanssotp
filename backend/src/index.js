require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const cron = require('node-cron');

const config = require('./config/env');
const { testConnection } = require('./config/database');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');
const { setupSocket } = require('./socket');
const { pollOtpStatus } = require('./cron/otpPoller');
const { cancelExpiredOrders } = require('./cron/expiredOrders');
const { updateAutoPricing } = require('./cron/autoPricing');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const depositRoutes = require('./routes/deposit');
const webhookRoutes = require('./routes/webhook');
const otpRoutes = require('./routes/otp');
const adminRoutes = require('./routes/admin');
const resellerRoutes = require('./routes/reseller');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.cors.origin,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

setupSocket(io);
app.set('io', io);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OTP Service API is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/deposits', depositRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reseller', resellerRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// Cron jobs
// Poll OTP status every 15 seconds
cron.schedule('*/15 * * * * *', () => {
  pollOtpStatus(io);
});

// Cancel expired orders every minute
cron.schedule('* * * * *', () => {
  cancelExpiredOrders(io);
});

// Update auto pricing every hour
cron.schedule('0 * * * *', () => {
  updateAutoPricing();
});

async function start() {
  await testConnection();

  server.listen(config.port, () => {
    logger.info({ port: config.port, env: config.nodeEnv }, 'Server started');
  });
}

start().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});

module.exports = { app, server };
