const express = require('express');
const {
  createSession,
  confirmSession,
  cancelSession,
  completeSessionBooking,
  getBookingSessions,
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getBookingSessions).post(protect, createSession);
router.route('/:id/confirm').put(protect, confirmSession).patch(protect, confirmSession);
router.route('/:id/cancel').put(protect, cancelSession).patch(protect, cancelSession);
router.route('/:id/complete').put(protect, completeSessionBooking).patch(protect, completeSessionBooking);

module.exports = router;
