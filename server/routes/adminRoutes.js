/**
 * Name: adminRoutes.js
 * Purpose: Defines the routes for admin-specific endpoints, including announcements, attendance, leaves, and payroll management.
 * Dependencies: express, adminController, authMiddleware
 * Author: Ian
 * Location: server/routes/adminRoutes.js
 * Created: 2026-05-16
 * Last Updated: 2026-05-23
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
    getEmployeeAnalytics,
    getPayrollDashboard,  
    generatePayrollRun,  
    releaseSalary,        
    deletePayrollEntry ,
    handleNotifications
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
    .get(getAllEmployees); 

// --- EMPLOYEE ANALYTICS ENDPOINTS ---
router.route('/users/:employeeId/analytics')
    .get(getEmployeeAnalytics);

// --- PAYROLL MANAGEMENT ENDPOINTS ---
router.route('/payroll')
    .get(getPayrollDashboard)  
    .post(generatePayrollRun);    

router.route('/payroll/:id')
    .delete(deletePayrollEntry);  

router.route('/payroll/:id/release')
    .put(releaseSalary);      
    
// --- NOTIFICATIONS ENDPOINTS ---    
router.route('/notifications')
    .get(handleNotifications); 

module.exports = router;