const express = require('express');
const router = express.Router();
const {
  getResources,
  getResourceById,
  createResource,
  summariseResource,
  togglePinResource,
  deleteResource,
} = require('../controllers/resourceController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/orgMiddleware');

router.route('/')
  .get(protect, getResources)
  .post(protect, createResource);

router.route('/:id')
  .get(protect, getResourceById)
  .delete(protect, deleteResource);

router.post('/:id/summarise', protect, summariseResource);
router.patch('/:id/pin', protect, requireRole(['faculty', 'admin']), togglePinResource);

module.exports = router;
