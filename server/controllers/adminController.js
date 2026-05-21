/**
 * Name: adminController.js
 * Purpose: Contains controller functions for admin-specific operations, including announcement and leave management.
 * Dependencies: Announcement model, Leave model, User model, Logger Utility
 * Author: Ian
 * Location: server/controllers/adminController.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-18
 */

const Announcement = require('../models/Announcement');
const Leave = require('../models/Leave');
const User = require('../models/User');
const { createAuditLog } = require('../utils/logger');

exports.getAdminAnnouncements = async (req, res) => {
    try {
        const adminId = req.user.id; 
        const announcements = await Announcement.find({ author: adminId }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: announcements.length,
            data: announcements
        });
    } catch (error) {
        console.error('Error fetching admin announcements:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching announcements'
        });
    }
};

exports.createAnnouncement = async (req, res, next) => {
    try {
        const { title, content, category, eventDate } = req.body;
        const adminId = req.user.id;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both a title and content'
            });
        }

        if (category && !['general', 'event', 'operations', 'urgent'].includes(category.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: "Invalid category. Must be 'general', 'event', 'operations', or 'urgent'"
            });
        }

        const newAnnouncement = await Announcement.create({
            title,
            content,
            category: category ? category.toLowerCase() : 'general',
            eventDate: eventDate || null, 
            author: adminId 
        });

        await createAuditLog(
            adminId,
            'announcement_create',
            `Admin created a new announcement titled: "${title}" under category: "${category || 'general'}".`,
            req
        );

        return res.status(201).json({
            success: true,
            message: 'Announcement created successfully',
            data: newAnnouncement
        });
    } catch (error) {
        console.error('Error creating announcement:', error);
        next(error);
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        const announcementId = req.params.id;
        const adminId = req.user.id;

        const announcement = await Announcement.findById(announcementId);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        if (announcement.author.toString() !== adminId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You can only delete your own announcements'
            });
        }

        const exactTitle = announcement.title;
        await announcement.deleteOne();
        await createAuditLog(
            adminId,
            'profile_update',
            `Admin deleted an announcement titled: "${exactTitle}".`,
            req
        );

        return res.status(200).json({
            success: true,
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

exports.getAllLeaveRequests = async (req, res, next) => {
    try {
        const today = new Date();

        await Leave.updateMany(
            {
                status: 'pending',
                startDate: { $lt: today }
            },
            {
                $set: { status: 'declined' }
            }
        );

        const requests = await Leave.find()
            .populate('user', 'fullname email role')
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: requests.length,
            data: requests
        });
    } catch (error) {
        next(error);
    }
};

exports.reviewLeaveRequest = async (req, res, next) => {
    try {
        const leaveId = req.params.id;
        const adminId = req.user.id; 
        const { action } = req.body; 

        if (!action || !['approved', 'declined'].includes(action)) {
            return res.status(400).json({ success: false, message: "Please provide a valid action ('approved' or 'declined')" });
        }

        const leave = await Leave.findById(leaveId);
        if (!leave) {
            return res.status(404).json({ success: false, message: 'Leave request not found' });
        }

        if (leave.status !== 'pending') {
            return res.status(400).json({ 
                success: false, 
                message: `This leave request has already been ${leave.status}` 
            });
        }

        if (new Date(leave.startDate) < new Date()) {
            leave.status = 'declined';
            await leave.save();
            return res.status(400).json({ success: false, message: 'This leave request has expired and was auto-declined' });
        }

        if (action === 'approved') {
            const user = await User.findById(leave.user);
            if (!user) {
                return res.status(404).json({ success: false, message: 'Employee record not found' });
            }

            const typeKey = leave.leaveType.toLowerCase();
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

            if (user.leaveBalances && user.leaveBalances[typeKey]) {
                user.leaveBalances[typeKey].left -= totalDays;
                user.markModified(`leaveBalances.${typeKey}`);
                await user.save();
            }
        }

        leave.status = action;
        await leave.save();
        await createAuditLog(
            adminId,
            'leave_review',
            `Admin processed leave request ${leaveId} for employee ${leave.user}. Decision set to: ${action.toUpperCase()}.`,
            req
        );

        return res.status(200).json({
            success: true,
            message: `Leave request has been successfully ${action}`,
            data: leave
        });
    } catch (error) {
        next(error);
    }
};