/**
 * Name: attendanceRoutes.js
 * Purpose: Defines the routes for attendance management endpoints.
 * Dependencies: express
 * Author: Ian
 * Location: server/routes/attendanceRoutes.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-15
 */
const express = require('express');
const router = express.Router();
const { protect , authorize} = require('../middlewares/authMiddleware');
const { 
    clockIn, 
    clockOut, 
    getAttendanceHistory, 
    getAnnouncements 
} = require('../controllers/attendanceController');

router.use(protect);
router.use(authorize('user'));
router.post('/time-in', clockIn);
router.post('/time-out', clockOut);
router.get('/history', getAttendanceHistory);


module.exports = router;