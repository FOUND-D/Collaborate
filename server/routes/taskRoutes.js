const express = require('express');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  assignTaskToTeam,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/orgMiddleware');

router.route('/').post(protect, createTask).get(protect, getTasks);
router.route('/assign-to-team').post(protect, requireRole('faculty'), assignTaskToTeam);
router
    .route('/:id')
    .get(protect, getTaskById)
    .put(protect, updateTask)
    .delete(protect, deleteTask);

module.exports = router;
