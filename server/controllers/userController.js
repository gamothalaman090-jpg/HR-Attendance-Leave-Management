/**
 * Name: userController.js
 * Purpose: Handles user-related logic, including attendance management.
 * Dependencies: Attendance Model, Announcement Model
 * Author: Ian
 * Location: server/controllers/userController.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-16
 */
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');

// Clock-In (Time In)
exports.clockIn = async (req, res) => {
    try {
        const userId = req.user.id;

    
        const lastEntry = await Attendance.findOne({ user: userId }).sort({ timestamp: -1 });
        
        if (lastEntry && lastEntry.type === 'in') {
            return res.status(400).json({ 
                success: false, 
                message: 'You are already clocked in. Please clock out first.' 
            });
        }

        const entry = await Attendance.create({
            user: userId,
            type: 'in'
        });

        res.status(201).json({ success: true, message: 'Clock-In successful', data: entry });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Clock-Out (Time Out)
exports.clockOut = async (req, res) => {
    try {
        const userId = req.user.id;

        const lastEntry = await Attendance.findOne({ user: userId }).sort({ timestamp: -1 });
        
        if (!lastEntry || lastEntry.type === 'out') {
            return res.status(400).json({ 
                success: false, 
                message: 'You cannot clock out without clocking in first.' 
            });
        }

        const entry = await Attendance.create({
            user: userId,
            type: 'out'
        });

        res.status(201).json({ success: true, message: 'Clock-Out successful', data: entry });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Get Attendance History (Last 10 entries)
exports.getAttendanceHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await Attendance.find({ user: userId })
            .sort({ timestamp: -1 })
            .limit(10);

        res.status(200).json({ 
            success: true, 
            count: history.length, 
            data: history 
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.getAnnouncements = async (req, res) => {
    try {
        const announcements = await Announcement.find()
            .populate('author', 'name') 
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: announcements.length,
            data: announcements
        });
    } catch (error) {
        console.error('Error fetching announcements for feed:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching announcement feed'
        });
    }
};