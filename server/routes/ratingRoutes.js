const express = require('express');
const {
  createSessionRating,
  getRatings,
} = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').post(protect, createSessionRating);
router.route('/:userId').get(protect, getRatings);

module.exports = router;
