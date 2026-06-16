const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { requireRole } = require('../middleware/orgMiddleware');
const {
  getAdminStats,
  getTopSkills,
  getAdminUsers,
  updateUserRole,
  updateUserCredits,
  toggleUserSuspension,
  deleteUser,
  getFacultyWhitelist,
  addFacultyToWhitelist,
  deleteFacultyFromWhitelist,
  getAdminSkills,
  deleteSkill,
  updateSkill,
  getAdminListings,
  updateListingStatus,
  deleteListing,
  getAdminSessions,
  getAdminAnnouncements,
  deleteAnnouncement,
  getCreditConfig,
  updateCreditConfig
} = require('../controllers/adminController');

// All routes require authentication and admin role
router.use(protect);
router.use(requireRole(['admin']));

// Stats & Overview
router.get('/stats', getAdminStats);
router.get('/top-skills', getTopSkills);

// User Management
router.get('/users', getAdminUsers);
router.patch('/users/:id/role', updateUserRole);
router.patch('/users/:id/credits', updateUserCredits);
router.patch('/users/:id/suspend', toggleUserSuspension);
router.delete('/users/:id', deleteUser);

// Faculty Whitelist
router.route('/faculty-whitelist')
  .get(getFacultyWhitelist)
  .post(addFacultyToWhitelist);
router.delete('/faculty-whitelist/:id', deleteFacultyFromWhitelist);

// Skill Management
router.get('/skills', getAdminSkills);
router.route('/skills/:id')
  .patch(updateSkill)
  .delete(deleteSkill);

// Listing Management
router.get('/listings', getAdminListings);
router.patch('/listings/:id/status', updateListingStatus);
router.delete('/listings/:id', deleteListing);

// Session Management (Read-only for now)
router.get('/sessions', getAdminSessions);

// Announcements Management
router.get('/announcements', getAdminAnnouncements);
router.delete('/announcements/:id', deleteAnnouncement);

// Configuration
router.route('/credit-config')
  .get(getCreditConfig)
  .patch(updateCreditConfig);

module.exports = router;
