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
    deleteAnnouncement 
} = require('../controllers/adminController');

const { protect, authorize } = require('../middlewares/authMiddleware'); 

router.use(protect);
router.use(authorize('admin'));

router.route('/announcements')
    .get(getAdminAnnouncements)
    .post(createAnnouncement);

router.route('/announcements/:id')
    .delete(deleteAnnouncement);

module.exports = router;