/**
 * Name: authRoutes.js
 * Purpose: Defines the routes for user authentication endpoints.
 * Dependencies: express, authMiddleware, cloudinary config
 * Author: Ian
 * Location: server/routes/authRoutes.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-18
 */

const express = require('express');
const { upload } = require('../config/cloudinary');
const { protect } = require('../middlewares/authMiddleware');
const router = express.Router();
const { 
    register, 
    login, 
    forgotPassword,
    logout,
    changePassword,
    updateProfile
} = require('../controllers/authController');


router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.post('/logout', logout);


router.put('/profile/change-password', protect, changePassword);
router.put('/profile/update', protect, upload.single('profilePicture'), updateProfile);

module.exports = router;