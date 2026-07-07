const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getUserConversations,
  getTeamMessages,
  getConversationMessages,
  markMessagesAsRead,
  getConversationSettings,
  updateConversationSettings,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, sendMessage);
router.route('/conversations').get(protect, getUserConversations);
router.route('/team/:teamId').get(protect, getTeamMessages);
router.route('/conversation/:conversationId').get(protect, getConversationMessages);
router.route('/conversation/:conversationId/settings').get(protect, getConversationSettings).put(protect, updateConversationSettings);
router.route('/read').put(protect, markMessagesAsRead);

module.exports = router;
