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
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.route('/').get(protect, getUsers);
router.get('/search', protect, searchUsers);
router
  .route('/profile')
  .get(protect, getUserProfile)
  .patch(protect, updateUserProfile);

router.route('/profile/image').patch(protect, updateUserProfileImage);

module.exports = router;
