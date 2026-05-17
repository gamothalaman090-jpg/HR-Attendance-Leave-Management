/**
 * Name: userController.js
 * Purpose: Handles user-related logic, including attendance management and leave requests.
 * Dependencies: User Model, Attendance Model, Announcement Model, Leave Model
 * Author: Ian
 * Location: server/controllers/userController.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-17
 */
const User = require('../models/User'); // ADDED: Required to query leave balances
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const Leave = require('../models/Leave');

exports.getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                leaveBalances: user.leaveBalances 
            }
        });
    } catch (error) {
        next(error);
    }
};

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



// Leaves

exports.requestLeave = async (req, res, next) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;

        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }
        
        const typeKey = leaveType.toLowerCase(); 
        const user = await User.findById(req.user.id);
        
        if (!user || !user.leaveBalances || !user.leaveBalances[typeKey]) {
            return res.status(400).json({ success: false, message: 'Invalid leave type specified' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        const totalDaysRequested = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (totalDaysRequested <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid date range selected' });
        }

        const overlappingLeave = await Leave.findOne({
            user: req.user.id,
            status: { $in: ['pending', 'approved'] },
            startDate: { $lte: end },
            endDate: { $gte: start }
        });

        if (overlappingLeave) {

            const existingStart = overlappingLeave.startDate.toISOString().split('T')[0];
            const existingEnd = overlappingLeave.endDate.toISOString().split('T')[0];
            
            return res.status(400).json({ 
                success: false, 
                message: `Leave conflict: You already have a ${overlappingLeave.status} ${overlappingLeave.leaveType} from ${existingStart} to ${existingEnd}. Please choose different dates.` 
            });
        }

        // Deficit Floor Limit
        const maxDeficit = -10; 
        const projectedBalance = user.leaveBalances[typeKey].left - totalDaysRequested;

        if (projectedBalance < maxDeficit) {
            return res.status(400).json({ 
                success: false, 
                message: `Request denied. This would put your balance at ${projectedBalance} days, exceeding the maximum allowed deficit of ${maxDeficit} days.` 
            });
        }

        const leave = await Leave.create({
            user: req.user.id,
            leaveType,
            startDate,
            endDate,
            reason,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Leave request submitted for review',
            data: leave
        });
    } catch (error) {
        next(error);
    }
};

exports.getMyLeaves = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const leaves = await Leave.find({ user: userId }).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: leaves.length,
            data: leaves
        });
    } catch (error) {
        next(error);
    }
};

exports.getLeaveBalances = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            data: user.leaveBalances || {}
        });
    } catch (error) {
        next(error);
    }
};