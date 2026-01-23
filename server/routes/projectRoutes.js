const express = require('express');
const router = express.Router();
const {
  createProjectWithAI,
  getProjectById,
  getProjects, // Import getProjects
  deleteProject, // Import deleteProject
  createProject,
  updateProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getProjects).post(protect, createProject); // New route for getting all projects
router.route('/ai').post(protect, createProjectWithAI);
router
  .route('/:id')
  .get(protect, getProjectById)
  .delete(protect, deleteProject)
  .put(protect, updateProject);


module.exports = router;