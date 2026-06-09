const express = require('express');
const router = express.Router();
const {
  adminGetUsers,
  adminUpdateUserRole,
  adminGetStats,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/orgMiddleware');

router.use(protect);
router.use(requireRole(['admin']));

router.get('/users', adminGetUsers);
router.patch('/users/:id/role', adminUpdateUserRole);
router.get('/stats', adminGetStats);

module.exports = router;
