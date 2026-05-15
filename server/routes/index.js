/**
 * Name: index.js
 * Purpose: Initializes and configures the main application routes.
 * Dependencies: express
 * Author: Ian
 * Location: server/routes/index.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-15
 */

const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
// const attendanceRoutes = require('./attendanceRoutes'); // Future use


router.use('/auth', authRoutes);
// router.use('/attendance', attendanceRoutes);

module.exports = router;