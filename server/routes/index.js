/**
 * Name: index.js
 * Purpose: Initializes and configures the main application routes.
 * Dependencies: express
 * Author: Ian
 * Location: server/routes/index.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-16
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const superadminRoutes = require('./superadminRoutes');
const userRoutes = require('./userRoutes');
const adminRoutes = require('./adminRoutes');



router.use('/auth', authRoutes);
router.use('/superadmin', superadminRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);
module.exports = router;