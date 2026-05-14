const FiveSimProvider = require('./FiveSimProvider');
const HeroSmsProvider = require('./HeroSmsProvider');
const NokosmurahProvider = require('./NokosmurahProvider');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

const providerInstances = {};

async function getProviderApiKey(providerCode) {
  const settingKeyMap = {
    '5sim': 'fivesim_api_key',
    herosms: 'herosms_api_key',
    nokosmurah: 'nokosmurah_api_key',
  };

  const settingKey = settingKeyMap[providerCode];
  if (!settingKey) return null;

  const [rows] = await pool.query(
    'SELECT setting_value FROM website_settings WHERE setting_key = ?',
    [settingKey]
  );

  if (rows.length > 0 && rows[0].setting_value) {
    return rows[0].setting_value;
  }

  const envMap = {
    '5sim': process.env.FIVESIM_API_KEY,
    herosms: process.env.HEROSMS_API_KEY,
    nokosmurah: process.env.NOKOSMURAH_API_KEY,
  };

  return envMap[providerCode] || '';
}

async function getProvider(providerCode) {
  const apiKey = await getProviderApiKey(providerCode);

  const key = `${providerCode}:${apiKey}`;
  if (providerInstances[key]) return providerInstances[key];

  let provider;
  switch (providerCode) {
    case '5sim':
      provider = new FiveSimProvider(apiKey);
      break;
    case 'herosms':
      provider = new HeroSmsProvider(apiKey);
      break;
    case 'nokosmurah':
      provider = new NokosmurahProvider(apiKey);
      break;
    default:
      throw new Error(`Unknown provider: ${providerCode}`);
  }

  providerInstances[key] = provider;
  return provider;
}

async function getProviderByDbId(providerId) {
  const [rows] = await pool.query('SELECT code FROM otp_providers WHERE id = ?', [providerId]);
  if (rows.length === 0) throw new Error(`Provider with id ${providerId} not found`);
  return getProvider(rows[0].code);
}

module.exports = { getProvider, getProviderByDbId };
