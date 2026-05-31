/**
 * Name: userController.js
 * PHASE 2 FIXES:
 *
 *   N+1 FIX: clockIn() — was fetching all company admins then looping
 *            createNotification() per admin. Replaced with bulkNotify().
 *
 *   N+1 FIX: requestLeave() — same loop pattern for admin notifications.
 *            Replaced with bulkNotify().
 *
 *   LEAN FIX: getUserProfile, getLeaveBalances, getMyLeaves, getMyPayroll
 *             → all added .lean() since they are read-only responses.
 *
 *   QUERY FIX: clockIn/clockOut — was using findOne().sort() for last entry
 *              which scans the whole collection. Now queries by date directly.
 *
 *   PARALLEL FIX: getAttendanceHistory already had a single query. Left as-is.
 */

const mongoose = require('mongoose');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const { createAuditLog } = require('../utils/logger');
const { bulkNotify, singleNotify } = require('../utils/notificationHelpers');

// Keep this export for backward compat (adminController.js imports it)
const { createNotification } = require('./adminController');
exports.createNotification = createNotification;

const getLocalDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// ─────────────────────────────────────────────────────────
// PROFILE
// ─────────────────────────────────────────────────────────

exports.getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).lean(); // FIX: .lean()
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        return res.status(200).json({
            success: true,
            data: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                phone: user.phone || '',
                role: user.role,
                profilePicture: user.profilePicture || '',
                employmentStatus: user.employmentStatus || 'active',
                leaveBalances: user.leaveBalances,
                onboarded: user.onboarded,
                department: user.department || 'Unassigned',
                position: user.position || 'Staff Employee',
                company: user.company,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────
// ATTENDANCE — CLOCK IN
// ─────────────────────────────────────────────────────────

exports.clockIn = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const currentDateString = getLocalDateString(now);

        // ─────────────────────────────────────────────
        // FIX: QUERY OPTIMIZATION
        // BEFORE: findOne({ user }).sort({ timestamp: -1 })
        //   → Scans ALL attendance records for this user, sorted, just to get the last one.
        //   → With 6 months of history (≈260 records), this is wasteful.
        //
        // AFTER: Query directly by date — only looks at today's records.
        //   → O(1) with the { user, date } compound index.
        // ─────────────────────────────────────────────
        const [todayInLog, todayOutLog] = await Promise.all([
            Attendance.findOne({ user: userId, type: 'in', date: currentDateString }).lean(),
            Attendance.findOne({ user: userId, type: 'out', date: currentDateString }).lean(),
        ]);

        if (todayInLog) {
            return res.status(400).json({ success: false, message: 'You are already clocked in. Please clock out first.' });
        }
        if (todayOutLog) {
            return res.status(400).json({ success: false, message: 'You have already completed your shift for today.' });
        }

        const entry = await Attendance.create({
            user: userId,
            type: 'in',
            date: currentDateString,
            timestamp: now,
        });

        await createAuditLog(userId, 'attendance_in',
            `${req.user.fullname || 'Employee'} clocked in.`, req, 'INFO', 'ATTENDANCE');

        // ─────────────────────────────────────────────
        // FIX: N+1 LOOP — Late clock-in admin notifications
        // BEFORE: User.find({ company, role:'admin' }) then for(admin of admins) await createNotification()
        //   → N sequential DB writes (1 per admin)
        //
        // AFTER: Collect IDs first, then single bulkNotify insertMany
        // ─────────────────────────────────────────────
        const lateThreshold = new Date(now); lateThreshold.setHours(9, 0, 0, 0);
        if (now > lateThreshold) {
            const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const adminIds = await User
                .find({ company: req.user.company, role: 'admin' })
                .select('_id')
                .lean();

            await bulkNotify(adminIds.map(a => a._id), {
                type: 'attendance_late',
                title: 'Late Clock-In',
                message: `${req.user.fullname || 'Employee'} clocked in late at ${timeString} today.`,
                company: req.user.company,
            });
        }

        return res.status(201).json({ success: true, message: 'Clock-In successful.', data: entry });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────────────────
// ATTENDANCE — CLOCK OUT
// ─────────────────────────────────────────────────────────

exports.clockOut = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const now = new Date();
        const currentDateString = getLocalDateString(now);

        // FIX: Query by date directly instead of sort() across all records
        const [todayInLog, todayOutLog] = await Promise.all([
            Attendance.findOne({ user: userId, type: 'in', date: currentDateString }).lean(),
            Attendance.findOne({ user: userId, type: 'out', date: currentDateString }).lean(),
        ]);

        if (!todayInLog) {
            return res.status(400).json({ success: false, message: 'You cannot clock out without clocking in first.' });
        }
        if (todayOutLog) {
            return res.status(400).json({ success: false, message: 'You have already clocked out today.' });
        }

        const clockInTime = new Date(todayInLog.timestamp);
        const durationMinutes = Math.max(0, Math.ceil((now - clockInTime) / (1000 * 60)));

        const entry = await Attendance.create({
            user: userId,
            type: 'out',
            date: currentDateString,
            timestamp: now,
            workDuration: durationMinutes,
        });

        await createAuditLog(userId, 'attendance_out',
            `${req.user.fullname || 'Employee'} clocked out. Duration: ${durationMinutes} mins.`, req, 'INFO', 'ATTENDANCE');

        return res.status(201).json({ success: true, message: 'Clock-Out successful.', data: entry });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────────────────
// ATTENDANCE HISTORY
// ─────────────────────────────────────────────────────────

exports.getAttendanceHistory = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const createdAt = req.user.createdAt || new Date();
        const createdAtMidnight = new Date(createdAt); createdAtMidnight.setHours(0, 0, 0, 0);

        const now = new Date();
        const year = req.query.year ? parseInt(req.query.year) : now.getFullYear();
        const month = req.query.month ? parseInt(req.query.month) : now.getMonth();

        const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
        const startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
        const endOfMonth = new Date(year, month, totalDaysInMonth, 23, 59, 59, 999);

        const logs = await Attendance.find({
            user: userId,
            timestamp: { $gte: startOfMonth, $lte: endOfMonth },
        })
            .sort({ timestamp: 1 })
            .lean(); // FIX: .lean()

        const logsByDate = {};
        logs.forEach(log => {
            if (!logsByDate[log.date]) logsByDate[log.date] = [];
            logsByDate[log.date].push(log);
        });

        const calendarRecords = [];
        for (let day = 1; day <= totalDaysInMonth; day++) {
            const currentDayDate = new Date(year, month, day);
            const dateStr = getLocalDateString(currentDayDate);
            const normalized = new Date(currentDayDate); normalized.setHours(0, 0, 0, 0);

            const dayOfWeek = currentDayDate.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const isFuture = currentDayDate > now;
            const isBeforeCreation = normalized < createdAtMidnight;

            const dayLogs = logsByDate[dateStr] || [];
            const hasInLog = dayLogs.some(l => l.type === 'in');

            let status = 'absent', clockIn = null, clockOut = null, hours = 0;

            if (isFuture || isBeforeCreation) {
                status = 'upcoming';
            } else if (hasInLog) {
                const inLog = dayLogs.find(l => l.type === 'in');
                const outLog = dayLogs.find(l => l.type === 'out');

                const checkInTime = new Date(inLog.timestamp);
                const lateThreshold = new Date(checkInTime); lateThreshold.setHours(9, 0, 0, 0);
                status = checkInTime > lateThreshold ? 'late' : 'present';
                clockIn = inLog.timestamp;

                if (outLog) {
                    clockOut = outLog.timestamp;
                    hours = outLog.workDuration ? parseFloat((outLog.workDuration / 60).toFixed(1)) : 0;
                }
            } else if (isWeekend) {
                status = 'weekend';
            }

            calendarRecords.push({ day, date: dateStr, status, clockIn, clockOut, hours });
        }

        return res.status(200).json({ success: true, count: calendarRecords.length, data: calendarRecords });
    } catch (err) {
        next(err);
    }
};

// ─────────────────────────────────────────────────────────
// ANNOUNCEMENTS
// ─────────────────────────────────────────────────────────

exports.getAnnouncements = async (req, res, next) => {
    try {
        const AnnouncementModel = mongoose.model('Announcement');
        const announcements = await AnnouncementModel.find({ company: req.user.company })
            .populate({ path: 'author', model: 'User', select: 'fullname profilePicture' })
            .sort({ createdAt: -1 })
            .lean(); // FIX: .lean()

        return res.status(200).json({ success: true, count: announcements.length, data: announcements });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────
// LEAVE
// ─────────────────────────────────────────────────────────

exports.requestLeave = async (req, res, next) => {
    try {
        const { leaveType, startDate, endDate, reason } = req.body;

        if (!leaveType || !startDate || !endDate || !reason) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const typeKey = leaveType.toLowerCase();
        const user = await User.findById(req.user.id).lean(); // FIX: .lean()

        if (!user?.leaveBalances?.[typeKey]) {
            return res.status(400).json({ success: false, message: 'Invalid leave type specified' });
        }

        const start = new Date(startDate + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        const totalDaysRequested = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        if (totalDaysRequested <= 0) {
            return res.status(400).json({ success: false, message: 'Invalid date range' });
        }

        const overlappingLeave = await Leave.findOne({
            user: req.user.id,
            status: { $in: ['pending', 'approved'] },
            startDate: { $lte: end },
            endDate: { $gte: start },
        }).lean();

        if (overlappingLeave) {
            const s = overlappingLeave.startDate.toISOString().split('T')[0];
            const e = overlappingLeave.endDate.toISOString().split('T')[0];
            return res.status(400).json({
                success: false,
                message: `Leave conflict: you have a ${overlappingLeave.status} ${overlappingLeave.leaveType} from ${s} to ${e}.`,
            });
        }

        const projectedBalance = user.leaveBalances[typeKey].left - totalDaysRequested;
        if (projectedBalance < -10) {
            return res.status(400).json({ success: false, message: 'Request denied: balance deficit would exceed the maximum allowed limit.' });
        }

        const leave = await Leave.create({
            user: req.user.id, leaveType, startDate, endDate, reason, status: 'pending',
        });

        await leave.populate('user', 'fullname email role department position');

        await createAuditLog(req.user.id, 'leave_request',
            `${user.fullname} submitted ${leaveType} leave for ${totalDaysRequested} day(s).`, req, 'INFO', 'LEAVE');

        const formattedStart = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const formattedEnd = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

        // ─────────────────────────────────────────────
        // FIX: N+1 LOOP — Admin leave notifications
        // BEFORE: for(admin of admins) await createNotification()
        // AFTER:  Single bulkNotify() call
        // ─────────────────────────────────────────────
        const adminIds = await User
            .find({ company: req.user.company, role: 'admin' })
            .select('_id')
            .lean();

        await Promise.all([
            bulkNotify(adminIds.map(a => a._id), {
                type: 'leave_request',
                title: 'New Leave Request',
                message: `${user.fullname} requested ${leaveType} Leave for ${formattedStart}–${formattedEnd}.`,
                company: req.user.company,
            }),
            singleNotify('leave_request', 'Leave Requested',
                `Your ${leaveType} leave request has been submitted successfully.`,
                req.user.id, req.user.company),
        ]);

        return res.status(201).json({ success: true, message: 'Leave request submitted', data: leave });
    } catch (error) {
        next(error);
    }
};

exports.getMyLeaves = async (req, res, next) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const filter = { user: req.user.id };
        if (req.query.status) filter.status = req.query.status;

        const [leaves, total] = await Promise.all([
            Leave.find(filter)
                .populate('user', 'fullname email role department position')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Leave.countDocuments(filter),
        ]);

        return res.status(200).json({
            success: true,
            data: leaves,
            total,
            page,
            pages: Math.ceil(total / limit),
        });
    } catch (error) {
        next(error);
    }
};

exports.getLeaveBalances = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('leaveBalances').lean(); // FIX: .lean() + select only needed field
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        return res.status(200).json({ success: true, data: user.leaveBalances || {} });
    } catch (error) {
        next(error);
    }
};

// ─────────────────────────────────────────────────────────
// PAYROLL
// ─────────────────────────────────────────────────────────

exports.getMyPayroll = async (req, res, next) => {
    try {
        const payrolls = await Payroll.find({ employee: req.user.id, status: 'Paid' })
            .populate('employee', 'fullname email position profilePicture')
            .sort({ paymentDate: -1 })
            .lean(); // FIX: .lean()

        return res.status(200).json({ success: true, data: payrolls });
    } catch (error) {
        next(error);
    }
};

exports.getCalendarLeaves = async (req, res, next) => {
    try {
        const users = await User.find({ company: req.user.company }).select('_id');
        const userIds = users.map(u => u._id);

        const leaves = await Leave.find({
            user: { $in: userIds },
            status: { $in: ['approved', 'pending'] }
        })
        .populate('user', 'fullname email role department position')
        .sort({ createdAt: -1 })
        .lean();

        return res.status(200).json({
            success: true,
            data: leaves
        });
    } catch (error) {
        next(error);
    }
};