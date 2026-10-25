const { query } = require('../config/db');
const logger = require('../utils/logger');

async function createNotification(userId, requestId, title, message, type = 'info') {
  try {
    const result = await query(
      'INSERT INTO notifications (user_id, request_id, title, message, read_status, type) VALUES (?, ?, ?, ?, 0, ?)',
      [userId, requestId || null, title, message, type]
    );
    return result.insertId;
  } catch (error) {
    logger.error('Failed to create notification:', error.message);
    return null;
  }
}

module.exports = {
  createNotification
};
