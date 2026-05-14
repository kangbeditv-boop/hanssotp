const { pool } = require('../config/database');
const logger = require('../utils/logger');

async function logActivity(actorType, actorId, action, resourceType, resourceId, details, req) {
  try {
    await pool.query(
      `INSERT INTO activity_logs (actor_type, actor_id, action, resource_type, resource_id, details, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        actorType,
        actorId,
        action,
        resourceType,
        resourceId,
        details ? JSON.stringify(details) : null,
        req ? req.ip : null,
        req ? req.get('user-agent') : null,
      ]
    );
  } catch (error) {
    logger.error({ err: error }, 'Failed to log activity');
  }
}

module.exports = { logActivity };
