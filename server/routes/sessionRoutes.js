const express = require('express');
const {
  createSession,
  getSessions,
  confirmSession,
  cancelSession,
  completeSessionBooking,
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getSessions).post(protect, createSession);
router.route('/:id/confirm').put(protect, confirmSession);
router.route('/:id/cancel').put(protect, cancelSession);
router.route('/:id/complete').put(protect, completeSessionBooking);

module.exports = router;
