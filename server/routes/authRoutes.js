/**
 * Name: authRoutes.js
 * PHASE 1 FIXES:
 *   - Added PUT /reset-password route (was missing — forgotPassword had no matching reset endpoint)
 */

const express = require('express');
const { upload } = require('../config/cloudinary');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();

const {
  register,
  login,
  forgotPassword,
  resetPassword,   // FIX: Added — was missing
  logout,
  changePassword,
  updateProfile,
  googleOAuth,
  onboardUser,
} = require('../controllers/authController');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleOAuth);
router.post('/forgotpassword', forgotPassword);
router.put('/reset-password', resetPassword);   // FIX: New endpoint added

// Protected routes (require valid JWT)
router.post('/logout', protect, logout);
router.put('/profile/change-password', protect, changePassword);
router.put('/profile/update', protect, upload.single('profilePicture'), updateProfile);
router.put('/onboard', protect, onboardUser);

module.exports = router;
