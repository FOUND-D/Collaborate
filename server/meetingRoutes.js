const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  startMeeting,
  getMeeting,
  endMeeting,
} = require('../controllers/meetingController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, startMeeting).get(protect, getMeeting);
router.route('/:meetingId').put(protect, endMeeting);

module.exports = router;
