require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'otp_service',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'change_this_secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    adminSecret: process.env.JWT_ADMIN_SECRET || 'change_this_admin_secret',
    adminExpiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '24h',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  tripay: {
    apiKey: process.env.TRIPAY_API_KEY || '',
    privateKey: process.env.TRIPAY_PRIVATE_KEY || '',
    merchantCode: process.env.TRIPAY_MERCHANT_CODE || '',
    mode: process.env.TRIPAY_MODE || 'sandbox',
  },
  qrispy: {
    apiKey: process.env.QRISPY_API_KEY || '',
    merchantId: process.env.QRISPY_MERCHANT_ID || '',
  },
  pakasir: {
    project: process.env.PAKASIR_PROJECT || '',
    netKey: process.env.PAKASIR_NET_KEY || '',
    mode: process.env.PAKASIR_MODE || 'sandbox',
  },
  fivesim: {
    apiKey: process.env.FIVESIM_API_KEY || '',
  },
  herosms: {
    apiKey: process.env.HEROSMS_API_KEY || '',
  },
  nokosmurah: {
    apiKey: process.env.NOKOSMURAH_API_KEY || '',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID || '',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    loginMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10),
    resellerMax: parseInt(process.env.RESELLER_RATE_LIMIT_MAX || '60', 10),
  },
};
