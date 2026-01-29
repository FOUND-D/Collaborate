const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getTeamMessages,
  getConversationMessages,
  markMessagesAsRead,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, sendMessage);
router.route('/team/:teamId').get(protect, getTeamMessages);
router.route('/conversation/:conversationId').get(protect, getConversationMessages);
router.route('/read').put(protect, markMessagesAsRead);

module.exports = router;
