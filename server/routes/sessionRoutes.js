const express = require('express');
const {
  createSession,
  getSessions,
  confirmSession,
  cancelSession,
  completeSessionBooking,
  createBookingSession,
  getBookingSessions,
  cancelBookingSession,
} = require('../controllers/sessionController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Middleware to route based on base URL
router.use((req, res, next) => {
  if (req.baseUrl === '/api/booking-sessions') {
    return protect(req, res, () => {
      if (req.path === '/' && req.method === 'POST') return createBookingSession(req, res, next);
      if (req.path === '/' && req.method === 'GET') return getBookingSessions(req, res, next);
      if (req.path.match(/^\/[^/]+\/cancel$/) && req.method === 'PATCH') return cancelBookingSession(req, res, next);
      next();
    });
  }
  next();
});

router.route('/').get(protect, getSessions).post(protect, createSession);
router.route('/:id/confirm').put(protect, confirmSession);
router.route('/:id/cancel').put(protect, cancelSession);
router.route('/:id/complete').put(protect, completeSessionBooking);

module.exports = router;
