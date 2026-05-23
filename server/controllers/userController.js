/**
 * Name: userController.js
 * Purpose: Handles user-related logic, including attendance management, announcements, and leave requests.
 * Dependencies: User Model, Attendance Model, Announcement Model, Leave Model, Logger Utility, Admin Controller (Notifications)
 * Author: Ian
 * Location: server/controllers/userController.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-23
 */
const User = require('../models/User'); 
const Attendance = require('../models/Attendance');
const Announcement = require('../models/Announcement');
const Leave = require('../models/Leave');
const { createAuditLog } = require('../utils/logger'); 
const { handleNotifications } = require('./adminController'); // ◄ Imported shared utility function

exports.getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                employmentStatus: user.employmentStatus || 'active', // FIXED: Included field addition
                leaveBalances: user.leaveBalances 
            }
        });
    } catch (error) {
        next(error);
    }
};

// Clock-In (Time In)
exports.clockIn = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const currentDateString = now.toISOString().split('T')[0]; // Yields "YYYY-MM-DD"

        // Check if user already clocked in overall
        const lastEntry = await Attendance.findOne({ user: userId }).sort({ timestamp: -1 });
        
        if (lastEntry && lastEntry.type === 'in') {
            return res.status(400).json({ 
                success: false, 
                message: 'You are already clocked in. Please clock out first.' 
            });
        }

        // 📝 Optional Quality-of-Life Guardrail:
        // Prevent double clock-ins on the exact same calendar date if they already finished their shift
        const alreadyWorkedToday = await Attendance.findOne({ user: userId, date: currentDateString, type: 'out' });
        if (alreadyWorkedToday) {
            return res.status(400).json({
                success: false,
                message: 'You have already completed your shift tracking for today.'
            });
        }

        const entry = await Attendance.create({
            user: userId,
            type: 'in',
            date: currentDateString, // Saved cleanly to the DB
            timestamp: now
        });

        // 📝 Telemetry Log
        await createAuditLog(
            userId, 
            'attendance_in', 
            `${req.user.fullname || 'Employee'} successfully clocked in (Time In).`, 
            req,
            'INFO',
            'ATTENDANCE'
        );

        const currentHour = now.getHours();
        if (currentHour >= 9) {
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            await handleNotifications(
                'attendance_late',
                'Late Clock-In',
                `${req.user.fullname || 'Employee'} clocked in late at ${timeString} today.`,
                null,
                req.user.company
            );
        }

        return res.status(201).json({ 
            success: true, 
            message: 'Clock-In successful. Countdown initiated.', 
            data: entry 
        });
    } catch (err) {
        next(err);
    }
};

// Clock-Out (Time Out)
exports.clockOut = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const currentDateString = now.toISOString().split('T')[0]; // Yields "YYYY-MM-DD"

        const lastEntry = await Attendance.findOne({ user: userId }).sort({ timestamp: -1 });
        
        if (!lastEntry || lastEntry.type === 'out') {
            return res.status(400).json({ 
                success: false, 
                message: 'You cannot clock out without clocking in first.' 
            });
        }

        const clockInTime = new Date(lastEntry.timestamp);
        const diffMs = now - clockInTime;
        const durationMinutes = Math.max(0, Math.ceil(diffMs / (1000 * 60)));

        const entry = await Attendance.create({
            user: userId,
            type: 'out',
            date: currentDateString, // Tracks the out-event's calendar date
            timestamp: now,
            workDuration: durationMinutes 
        });

        // 📝 Telemetry Log
        await createAuditLog(
            userId, 
            'attendance_out', 
            `${req.user.fullname || 'Employee'} successfully clocked out. Duration: ${durationMinutes} mins.`, 
            req,
            'INFO',
            'ATTENDANCE'
        );

        return res.status(201).json({ 
            success: true, 
            message: 'Clock-Out successful. Countdown stopped.', 
            data: entry 
        });
    } catch (err) {
        next(err);
    }
};

// Get Attendance History (Last 10 entries)
exports.getAttendanceHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const history = await Attendance.find({ user: userId })
            .sort({ timestamp: -1 })
            .limit(10);

        return res.status(200).json({ 
            success: true, 
            count: history.length, 
            data: history 
        });
    } catch (err) {
        next(err);
    }
};

exports.getAnnouncements = async (req, res, next) => {
    try {
        // FIXED: Selected 'fullname' instead of 'name' to align with User model fields, and filtered by company
        const announcements = await Announcement.find({ company: req.user.company })
            .populate('author', 'fullname profilePicture') 
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: announcements.length,
            data: announcements
        });
    } catch (error) {
        console.error('Error fetching announcements for feed:', error);
        next(error);
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
                message: `Leave conflict: You already have a ${overlappingLeave.status} ${overlappingLeave.leaveType} from ${existingStart} to ${existingEnd}.` 
            });
        }

        const maxDeficit = -10; 
        const projectedBalance = user.leaveBalances[typeKey].left - totalDaysRequested;

        if (projectedBalance < maxDeficit) {
            return res.status(400).json({ 
                success: false, 
                message: `Request denied. Balance deficit would exceed the maximum allowed limit.` 
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
        
        // 📝 Telemetry Log: Submitting leave requests creates a trackable record under INFO level in LEAVE module
        await createAuditLog(
            req.user.id, 
            'leave_request', 
            `${user.fullname} submitted a pending ${leaveType} leave request for ${totalDaysRequested} day(s).`, 
            req,
            'INFO',
            'LEAVE'
        );

      
        const formattedStart = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const formattedEnd = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        await handleNotifications(
            'leave_request',
            'New Leave Request',
            `${user.fullname} requested ${leaveType} Leave for ${formattedStart}-${formattedEnd}.`,
            null,
            req.user.company
        );

        return res.status(201).json({
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

        return res.status(200).json({
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