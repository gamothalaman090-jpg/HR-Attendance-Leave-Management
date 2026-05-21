/**
 * Name: adminRoutes.js
 * Purpose: Defines the routes for admin-specific endpoints, such as managing announcements.
 * Dependencies: express, adminController, authMiddleware
 * Author: Ian
 * Location: server/routes/adminRoutes.js
 * Created: 2026-05-16
 * Last Updated: 2026-05-16
 */

const express = require('express');
const router = express.Router();

const { 
    getAdminAnnouncements, 
    createAnnouncement, 
    deleteAnnouncement,
    getAllEmployees,
    getAllLeaveRequests,
    overrideAttendance,
    reviewLeaveRequest,
    getEmployeeAnalytics
} = require('../controllers/adminController');

const { protect, authorize } = require('../middlewares/authMiddleware'); 

// --- ROUTE PROTECTION MIDDLEWARES ---
router.use(protect);
router.use(authorize('admin'));

// --- ANNOUNCEMENT ENDPOINTS ---
router.route('/announcements')
    .get(getAdminAnnouncements)
    .post(createAnnouncement);

router.route('/announcements/:id')
    .delete(deleteAnnouncement);

// --- ATTENDANCE OVERRIDE ENDPOINTS ---
router.route('/attendance/override')
    .put(overrideAttendance);

// --- LEAVE MANAGEMENT ENDPOINTS ---
router.route('/leaves')
    .get(getAllLeaveRequests);
    
router.route('/leaves/:id/review')
    .put(reviewLeaveRequest);

// --- USER/EMPLOYEE DIRECTORY ENDPOINTS ---
router.route('/users')
    .get(getAllEmployees); // FIXED: Swapped out broken inline route reference

// --- EMPLOYEE ANALYTICS ENDPOINTS ---
router.route('/users/:employeeId/analytics')
    .get(getEmployeeAnalytics);

module.exports = router;