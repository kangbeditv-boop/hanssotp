const crypto = require('crypto');

function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

function generateReferralCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
}

function generateReference(prefix = 'DEP') {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

function calculateSellPrice(costPrice, markupPercent) {
  const markup = (costPrice * markupPercent) / 100;
  return Math.ceil((costPrice + markup) / 100) * 100;
}

function paginationMeta(total, page, limit) {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

module.exports = {
  generateApiKey,
  generateReferralCode,
  generateReference,
  calculateSellPrice,
  paginationMeta,
  sanitizeUser,
};
