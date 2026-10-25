const { query } = require('../config/db');
const logger = require('../utils/logger');

async function logAudit(userId, action, affectedEntity, entityId, details, ipAddress = null) {
  try {
    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : (details || null);
    await query(
      'INSERT INTO audit_logs (user_id, action, affected_entity, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [userId || null, action, affectedEntity, entityId || null, detailsStr, ipAddress || '127.0.0.1']
    );
  } catch (error) {
    logger.error('Failed to write audit log:', error.message);
  }
}

module.exports = {
  logAudit
};
