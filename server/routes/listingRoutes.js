const express = require('express');
const {
  createExchangeListing,
  getExchangeListings,
  getExchangeListingById,
  updateExchangeListing,
  deleteListing,
} = require('../controllers/listingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').get(protect, getExchangeListings).post(protect, createExchangeListing);
router.route('/:id').get(protect, getExchangeListingById).put(protect, updateExchangeListing).delete(protect, deleteListing);

module.exports = router;
