const repo = require('../lib/repo');

/**
 * Creates a notification in the database and broadcasts it in real-time if a Socket.IO instance is provided.
 * @param {Object} io - Socket.IO server instance
 * @param {Object} params - Notification options
 * @param {string} params.userId - Target user UUID
 * @param {string} params.title - Title of notification
 * @param {string} params.message - Content text
 * @param {string} params.type - E.g. 'task_assigned', 'session_booked', 'session_status_changed'
 * @param {Object} params.data - Metadata dictionary
 */
const sendNotification = async (io, { userId, title, message, type, data = {} }) => {
  console.log(`[sendNotification] Calling repo.createNotification for user ${userId} with title: ${title}`);
  // Save to database
  const notification = await repo.createNotification({ userId, title, message, type, data });
  
  if (!notification) {
    console.error(`[sendNotification] repo.createNotification returned null for ${title}`);
  } else {
    console.log(`[sendNotification] Successfully created notification in DB:`, notification.id);
  }

  // Emit in realtime via Socket.IO if user is connected
  if (notification && io) {
    console.log(`[sendNotification] Emitting 'newNotification' to room notifications:${userId}`);
    io.to(`notifications:${userId}`).emit('newNotification', notification);
  } else if (!io) {
    console.log(`[sendNotification] io is missing, skipping socket emit`);
  }
  
  return notification;
};

module.exports = {
  sendNotification,
};
