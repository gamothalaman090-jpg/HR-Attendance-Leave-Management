/**
 * Name: attendanceController.js
 * Purpose: Handles attendance logic, including clocking in and out.
 * Dependencies: Attendance Model
 * Author: Ian
 * Location: server/controllers/attendanceController.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-15
 */
const Attendance = require('../models/Attendance');

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