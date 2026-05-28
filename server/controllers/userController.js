/**
 * Name: userController.js
 * Purpose: Handles user-related logic, including attendance management, announcements, and leave requests.
 * Dependencies: User Model, Attendance Model, Announcement Model, Leave Model, Logger Utility, Admin Controller (Notifications)
 * Author: Ian
 * Location: server/controllers/userController.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-23
 */
const mongoose = require('mongoose');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const { createAuditLog } = require('../utils/logger');
const { createNotification } = require('./adminController'); // ◄ Imported shared utility function

// Helper to format Date objects as local YYYY-MM-DD
const getLocalDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

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
                phone: user.phone || '',
                role: user.role,
                profilePicture: user.profilePicture || '',
                employmentStatus: user.employmentStatus || 'active', // FIXED: Included field addition
                leaveBalances: user.leaveBalances,
                onboarded: user.onboarded,
                department: user.department || 'Unassigned', // FIXED: Added default value for department
                position: user.position || 'Staff Employee' // FIXED: Added default value for position
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
        const currentDateString = getLocalDateString(now); // Yields "YYYY-MM-DD"

        // Check if user already clocked in overall
        const lastEntry = await Attendance.findOne({ user: userId }).sort({ timestamp: -1 });

        if (lastEntry && lastEntry.type === 'in' && lastEntry.date === currentDateString) {
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

        const clockInTime = now;
        const lateThreshold = new Date(now);
        lateThreshold.setHours(9, 0, 0, 0);
        if (clockInTime > lateThreshold) {
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            // Notify ALL company admins about the late clock-in
            const admins = await User.find({ company: req.user.company, role: 'admin' }).select('_id');
            for (const admin of admins) {
                await createNotification(
                    'attendance_late',
                    'Late Clock-In',
                    `${req.user.fullname || 'Employee'} clocked in late at ${timeString} today.`,
                    admin._id,
                    req.user.company
                );
            }
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
        const currentDateString = getLocalDateString(now); // Yields "YYYY-MM-DD"

        const lastEntry = await Attendance.findOne({ user: userId }).sort({ timestamp: -1 });

        if (!lastEntry || lastEntry.type === 'out' || lastEntry.date !== currentDateString) {
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


// Get Attendance History calculated dynamically by Month and Year
exports.getAttendanceHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;

        // Use user account creation date as the start boundary
        const createdAt = req.user.createdAt || new Date();
        const createdAtMidnight = new Date(createdAt);
        createdAtMidnight.setHours(0, 0, 0, 0);

        // 2. Get year and month from query parameters, fallback to current date
        const now = new Date();
        const year = req.query.year ? parseInt(req.query.year) : now.getFullYear();
        const month = req.query.month ? parseInt(req.query.month) : now.getMonth();

        // 3. Get the total number of days for the requested month/year
        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

        // 4. Set precise date boundaries for the query range
        const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(year, month, totalDaysInMonth, 23, 59, 59, 999);

        // 5. Fetch all attendance logs within that month's range
        const logs = await Attendance.find({
            user: userId,
            timestamp: { $gte: startOfMonth, $lte: endOfMonth }
        }).sort({ timestamp: 1 });

        // 6. Group logs by clean date string keys ("YYYY-MM-DD")
        const logsByDate = {};
        logs.forEach(log => {
            if (!logsByDate[log.date]) {
                logsByDate[log.date] = [];
            }
            logsByDate[log.date].push(log);
        });

        const calendarRecords = [];

        // 7. Generate the exact grid layout expected by the frontend calendar
        for (let day = 1; day <= totalDaysInMonth; day++) {
            const currentDayDate = new Date(year, month, day);
            const dateStr = getLocalDateString(currentDayDate);

            // Normalize current loop date to midnight for comparison accuracy
            const normalizedLoopDate = new Date(currentDayDate);
            normalizedLoopDate.setHours(0, 0, 0, 0);

            const dayOfWeek = currentDayDate.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const isFuture = currentDayDate > now;

            // Check if day is prior to user account creation
            const isBeforeCreation = normalizedLoopDate < createdAtMidnight;

            const dayLogs = logsByDate[dateStr] || [];
            const hasInLog = dayLogs.some(l => l.type === 'in');

            let status = 'absent';
            let clockIn = '—';
            let clockOut = '—';
            let hours = 0;

            if (isFuture || isBeforeCreation) {
                status = 'upcoming';
            } else if (isWeekend) {
                status = 'weekend';
            } else if (hasInLog) {
                const inLog = dayLogs.find(l => l.type === 'in');
                const outLog = dayLogs.find(l => l.type === 'out');

                const checkInTime = new Date(inLog.timestamp);
                const lateThreshold = new Date(checkInTime);
                lateThreshold.setHours(9, 0, 0, 0);
                status = checkInTime > lateThreshold ? 'late' : 'present';
                clockIn = checkInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                if (outLog) {
                    const checkOutTime = new Date(outLog.timestamp);
                    clockOut = checkOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    hours = outLog.workDuration ? parseFloat((outLog.workDuration / 60).toFixed(1)) : 0;
                }
            }

            calendarRecords.push({
                day,
                date: dateStr,
                status,
                clockIn: clockIn !== '—' ? clockIn : null,
                clockOut: clockOut !== '—' ? clockOut : null,
                hours
            });
        }

        return res.status(200).json({
            success: true,
            count: calendarRecords.length,
            data: calendarRecords
        });
    } catch (err) {
        next(err);
    }
};

exports.getAnnouncements = async (req, res, next) => {
    try {
        // Look up models explicitly through the mongoose instance to force cross-reference resolution
        const AnnouncementModel = mongoose.model('Announcement');

        const announcements = await AnnouncementModel.find({ company: req.user.company })
            .populate({
                path: 'author',
                model: 'User', // <-- Forcefully tell Mongoose exactly which collection model to join
                select: 'fullname profilePicture'
            })
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

        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
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

        await leave.populate('user', 'fullname email role department position');

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

        // Notify ALL company admins about the new leave request
        const admins = await User.find({ company: req.user.company, role: 'admin' }).select('_id');
        for (const admin of admins) {
            await createNotification(
                'leave_request',
                'New Leave Request',
                `${user.fullname} requested ${leaveType} Leave for ${formattedStart}-${formattedEnd}.`,
                admin._id,
                req.user.company
            );
        }

        // Send confirmation notification to the employee themselves
        await createNotification(
            'leave_request',
            'Leave Requested',
            `Your ${leaveType} leave request has been submitted successfully.`,
            req.user.id,
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
        const leaves = await Leave.find({ user: userId })
            .populate('user', 'fullname email role department position')
            .sort({ createdAt: -1 });

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

exports.getMyPayroll = async (req, res, next) => {
    try {
        const payrolls = await Payroll.find({ employee: req.user.id, status: 'Paid' })
            .populate('employee', 'fullname email position profilePicture')
            .sort({ paymentDate: -1 });

        return res.status(200).json({
            success: true,
            data: payrolls
        });
    } catch (error) {
        next(error);
    }
};