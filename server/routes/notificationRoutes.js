const express = require('express');
const router = express.Router();
const {
  getNotifications,
  markAllRead,
  markRead,
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getNotifications);
router.route('/read-all').put(protect, markAllRead);
router.route('/:id/read').put(protect, markRead);

module.exports = router;
