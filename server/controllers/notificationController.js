const asyncHandler = require('../middleware/asyncHandler');
const repo = require('../lib/repo');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const notifications = await repo.listUserNotifications(userId);
  res.json({ success: true, notifications });
});

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  await repo.markAllNotificationsRead(userId);
  res.json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Mark a specific notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const notificationId = req.params.id;
  const notification = await repo.markNotificationRead({ notificationId, userId });
  
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  res.json({ success: true, notification });
});

module.exports = {
  getNotifications,
  markAllRead,
  markRead,
};
