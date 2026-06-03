/**
 * Name: authRoutes.js
 * GOOGLE-ONLY AUTH:
 *   - Removed POST /register and POST /login (Google OAuth only)
 *   - Added POST /google/complete-signup for new user profile completion
 */

const express = require('express');
const { upload } = require('../config/cloudinary');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

const {
  register,
  login,
  googleOAuth,
  googleCompleteSignup,
  forgotPassword,
  resetPassword,
  logout,
  changePassword,
  updateProfile,
  onboardUser,
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleOAuth);
router.post('/google/complete-signup', googleCompleteSignup);
router.post('/forgotpassword', forgotPassword);
router.put('/reset-password', resetPassword);

// Protected routes (require valid JWT)
router.post('/logout', protect, logout);
router.put('/profile/change-password', protect, changePassword);
router.put('/profile/update', protect, upload.single('profilePicture'), updateProfile);
router.put('/onboard', protect, onboardUser);

module.exports = router;
