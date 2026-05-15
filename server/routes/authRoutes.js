/**
 * Name: authRoutes.js
 * Purpose: Defines the routes for user authentication endpoints.
 * Dependencies: express
 * Author: Ian
 * Location: server/routes/authRoutes.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-15
 */


const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    forgotPassword,
    logout
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/forgotpassword', forgotPassword);
router.post('/logout', logout);

module.exports = router;