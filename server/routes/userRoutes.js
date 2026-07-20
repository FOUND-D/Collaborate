const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  searchUsers,
  getUsers,
  getUserProfile,
  updateUserProfile,
  updateUserProfileImage,
  getUserStats,
  getUserPublicProfile,
  getGithubStats,
  refreshDevScore,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.route('/').get(protect, getUsers);
router.get('/search', protect, searchUsers);
router.get('/me/stats', protect, getUserStats);
router.get('/github/:username', protect, getGithubStats);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .patch(protect, updateUserProfile)
  .put(protect, updateUserProfile);

router.post('/dev-score/refresh', protect, refreshDevScore);
router.get('/:id', protect, getUserPublicProfile);

router.patch('/profile/image', protect, updateUserProfileImage);

module.exports = router;
