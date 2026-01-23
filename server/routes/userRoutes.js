const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  searchUsers,
  getUsers,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.route('/').get(protect, getUsers);
router.get('/search', protect, searchUsers);

module.exports = router;