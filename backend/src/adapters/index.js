const TripayGateway = require('./TripayGateway');
const QrispyGateway = require('./QrispyGateway');
const PakasirGateway = require('./PakasirGateway');
const { pool } = require('../config/database');
const config = require('../config/env');

async function getGatewayConfig(gatewayCode) {
  const settingKeys = {
    tripay: ['tripay_api_key', 'tripay_private_key', 'tripay_merchant_code', 'tripay_mode'],
    qrispy: ['qrispy_api_key', 'qrispy_merchant_id'],
    pakasir: ['pakasir_project', 'pakasir_net_key', 'pakasir_mode'],
  };

  const keys = settingKeys[gatewayCode];
  if (!keys) return {};

  const [rows] = await pool.query(
    'SELECT setting_key, setting_value FROM website_settings WHERE setting_key IN (?)',
    [keys]
  );

  const dbConfig = {};
  rows.forEach((row) => {
    dbConfig[row.setting_key] = row.setting_value;
  });

  return dbConfig;
}

async function getGateway(gatewayCode) {
  const dbConfig = await getGatewayConfig(gatewayCode);

  switch (gatewayCode) {
    case 'tripay': {
      const apiKey = dbConfig.tripay_api_key || config.tripay.apiKey;
      const privateKey = dbConfig.tripay_private_key || config.tripay.privateKey;
      const merchantCode = dbConfig.tripay_merchant_code || config.tripay.merchantCode;
      const mode = dbConfig.tripay_mode || config.tripay.mode;
      return new TripayGateway(apiKey, privateKey, merchantCode, mode);
    }
    case 'qrispy': {
      const apiKey = dbConfig.qrispy_api_key || config.qrispy.apiKey;
      const merchantId = dbConfig.qrispy_merchant_id || config.qrispy.merchantId;
      return new QrispyGateway(apiKey, merchantId);
    }
    case 'pakasir': {
      const project = dbConfig.pakasir_project || config.pakasir.project;
      const netKey = dbConfig.pakasir_net_key || config.pakasir.netKey;
      const mode = dbConfig.pakasir_mode || config.pakasir.mode;
      return new PakasirGateway(project, netKey, mode);
    }
    default:
      throw new Error(`Unknown gateway: ${gatewayCode}`);
  }
}

module.exports = { getGateway };
