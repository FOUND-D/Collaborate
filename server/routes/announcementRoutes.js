const express = require('express');
const router = express.Router();
const {
  getAnnouncements,
  createAnnouncement,
  toggleRsvp,
  deleteAnnouncement,
} = require('../controllers/announcementController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/orgMiddleware');

router.route('/')
  .get(protect, getAnnouncements)
  .post(protect, requireRole(['faculty', 'admin']), createAnnouncement);

router.route('/:id')
  .delete(protect, deleteAnnouncement);

router.post('/:id/rsvp', protect, toggleRsvp);

module.exports = router;
