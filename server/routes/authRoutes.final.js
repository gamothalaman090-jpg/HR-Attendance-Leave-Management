/**
 * Name: authRoutes.js  (FINAL — with validation wired in)
 * PHASE 1 FIXES:
 *   - All public auth routes now have Joi validation middleware
 *   - resetPassword route added
 *   - logout requires auth (can't log audit event without a user)
 */

const express = require('express');
const { upload } = require('../config/cloudinary');
const { protect } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validate');
const {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  googleOAuthSchema,
} = require('../validators/authValidators');

const router = express.Router();

const {
  register,
  login,
  forgotPassword,
  resetPassword,
  logout,
  changePassword,
  updateProfile,
  googleOAuth,
  onboardUser,
} = require('../controllers/authController');

// ── Public Routes (with input validation) ──────────────────
router.post('/register',        validate(registerSchema),        register);
router.post('/login',           validate(loginSchema),           login);
router.post('/google',          validate(googleOAuthSchema),     googleOAuth);
router.post('/forgotpassword',  validate(forgotPasswordSchema),  forgotPassword);
router.put('/reset-password',   validate(resetPasswordSchema),   resetPassword);

// ── Protected Routes ───────────────────────────────────────
router.post('/logout',                  protect,                                    logout);
router.put('/profile/change-password',  protect, validate(changePasswordSchema),    changePassword);
router.put('/profile/update',           protect, upload.single('profilePicture'),   updateProfile);
router.put('/onboard',                  protect,                                    onboardUser);

module.exports = router;
