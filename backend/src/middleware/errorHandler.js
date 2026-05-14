const logger = require('../utils/logger');
const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, _next) {
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
  }

  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error');

  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'Terjadi kesalahan internal server',
  });
}

function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    code: 'NOT_FOUND',
    message: `Route ${req.method} ${req.url} tidak ditemukan`,
  });
}

module.exports = { errorHandler, notFoundHandler };
