const { query } = require('../config/db');

async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;

    const notifications = await query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [userId]
    );

    const [unread] = await query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND read_status = 0',
      [userId]
    );

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount: unread.count || 0
    });
  } catch (error) {
    next(error);
  }
}

async function markAsRead(req, res, next) {
  try {
    const notifId = req.params.id;
    const userId = req.user.id;

    await query('UPDATE notifications SET read_status = 1 WHERE id = ? AND user_id = ?', [notifId, userId]);
    return res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
}

async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user.id;

    await query('UPDATE notifications SET read_status = 1 WHERE user_id = ?', [userId]);
    return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
