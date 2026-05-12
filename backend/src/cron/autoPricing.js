const { pool } = require('../config/database');
const logger = require('../utils/logger');

async function updateAutoPricing() {
  try {
    const [settings] = await pool.query(
      "SELECT setting_key, setting_value FROM website_settings WHERE setting_key IN ('auto_pricing_enabled', 'demand_threshold', 'demand_markup_increment')"
    );

    const config = {};
    settings.forEach((s) => { config[s.setting_key] = s.setting_value; });

    if (config.auto_pricing_enabled !== '1') return;

    const threshold = parseInt(config.demand_threshold || '50', 10);
    const increment = parseFloat(config.demand_markup_increment || '5');

    const [pricings] = await pool.query(
      'SELECT * FROM otp_pricing WHERE auto_pricing = 1 AND is_active = 1'
    );

    for (const pricing of pricings) {
      const [orderCount] = await pool.query(
        `SELECT COUNT(*) as count FROM otp_orders
         WHERE service_id = ? AND country_id = ? AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)`,
        [pricing.service_id, pricing.country_id]
      );

      const demand = orderCount[0].count;
      let newMultiplier = 1.0;

      if (demand >= threshold * 3) {
        newMultiplier = 1 + (increment * 3) / 100;
      } else if (demand >= threshold * 2) {
        newMultiplier = 1 + (increment * 2) / 100;
      } else if (demand >= threshold) {
        newMultiplier = 1 + increment / 100;
      }

      if (newMultiplier !== parseFloat(pricing.demand_multiplier)) {
        const baseSellPrice = parseFloat(pricing.cost_price) * (1 + parseFloat(pricing.markup_percent) / 100);
        const newSellPrice = Math.ceil((baseSellPrice * newMultiplier) / 100) * 100;

        await pool.query(
          'UPDATE otp_pricing SET demand_multiplier = ?, sell_price = ? WHERE id = ?',
          [newMultiplier, newSellPrice, pricing.id]
        );

        await pool.query(
          `INSERT INTO pricing_history (pricing_id, old_sell_price, new_sell_price, reason, changed_by)
           VALUES (?, ?, ?, ?, 'system')`,
          [pricing.id, pricing.sell_price, newSellPrice, `Auto pricing: demand=${demand}, multiplier=${newMultiplier}`]
        );

        logger.info({ pricingId: pricing.id, demand, newSellPrice }, 'Auto pricing updated');
      }
    }
  } catch (error) {
    logger.error({ err: error }, 'Auto pricing job failed');
  }
}

module.exports = { updateAutoPricing };
