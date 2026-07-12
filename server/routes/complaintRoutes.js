const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/orgMiddleware');
const { getComplaints, createComplaint, deleteComplaint, dismissComplaint } = require('../controllers/complaintController');

router.route('/')
  .get(protect, requireRole(['admin']), getComplaints)
  .post(protect, createComplaint);

router.route('/:id')
  .delete(protect, requireRole(['admin']), dismissComplaint);

router.route('/:id/resolve')
  .delete(protect, requireRole(['admin']), deleteComplaint);

module.exports = router;
