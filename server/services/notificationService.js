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
  // Save to database
  const notification = await repo.createNotification({ userId, title, message, type, data });
  
  // Emit in realtime via Socket.IO if user is connected
  if (notification && io) {
    io.to(`notifications:${userId}`).emit('newNotification', notification);
  }
  
  return notification;
};

module.exports = {
  sendNotification,
};
