/**
 * Name: userRoutes.js
 * Purpose: Defines the routes for user management endpoints.
 * Dependencies: express
 * Author: Ian
 * Location: server/routes/userRoutes.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-17
 */
const express = require('express');
const router = express.Router();
const { protect , authorize} = require('../middlewares/authMiddleware');
const { 
    clockIn, 
    clockOut, 
    getAttendanceHistory, 
    getAnnouncements, 
    getUserProfile,
    getLeaveBalances,
    requestLeave,
    getMyLeaves
} = require('../controllers/userController');


router.use(protect);

//User Info (Accessible by all roles: user, admin, superadmin)
router.get('/profile', getUserProfile);

router.use(authorize('user', 'admin'));

// Attendance routes
router.post('/time-in', clockIn);
router.post('/time-out', clockOut);
router.get('/history', getAttendanceHistory);

//Announcement routes
router.get('/announcements', getAnnouncements);

// Leave routes
router.get('/leave-balance', getLeaveBalances);
router.post('/leave-request', requestLeave);
router.get('/leave-history', getMyLeaves);

module.exports = router;