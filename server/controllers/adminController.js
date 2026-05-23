/**
 * Name: adminController.js
 * Purpose: Contains controller functions for admin-specific operations, including announcement, attendance, leave, and payroll management.
 * Dependencies: Announcement model, Leave model, User model, Attendance model, Payroll model, Logger Utility, Notification model
 * Author: Ian
 * Location: server/controllers/adminController.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-23
 * */

/**
 * Note:
 * // Response formatting
 * const response = await axios.get('/api/admin/employees-directory');
// 1. Set the raw rows list for the big dashboard data table
setEmployees(response.data.data);
// 2. Set the data variables for your top metric card widgets instantly!
setTotalCount(response.data.summary.totalUsersCount);
setPresentCount(response.data.summary.present);
setAbsentCount(response.data.summary.absent);
setLateCount(response.data.summary.late);
setLeaveCount(response.data.summary.onLeave);
 * * */

const Announcement = require('../models/Announcement');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const Department = require('../models/Department');
const { createAuditLog } = require('../utils/logger');

// --- ANNOUNCEMENT MANAGEMENT ---

exports.getAdminAnnouncements = async (req, res) => {
    try {
        const adminId = req.user.id; 
        const announcements = await Announcement.find({ author: adminId, company: req.user.company }).sort({ createdAt: -1 });

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
            author: adminId,
            company: req.user.company
        });

        // 📝 Telemetry Log: Tagged explicitly as SYSTEM under INFO level
        await createAuditLog(
            adminId,
            'profile_update', // Kept for schema alignment
            `Admin created a new announcement titled: "${title}" under category: "${category || 'general'}".`,
            req,
            'INFO',
            'SYSTEM'
        );

        // 🔔 Notification: Log general announcement to the feed
        await exports.handleNotifications(
            'announcement',
            'New Announcement Published',
            `A new bulletin titled "${title}" has been posted to your dashboard.`,
            null,
            req.user.company
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

        const announcement = await Announcement.findOne({ _id: announcementId, company: req.user.company });

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

        // 📝 Telemetry Log: Admin manual remediation deletion log
        await createAuditLog(
            adminId,
            'profile_update',
            `Admin deleted an announcement titled: "${exactTitle}".`,
            req,
            'INFO',
            'SYSTEM'
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

// --- LEAVE MANAGEMENT ---

exports.getAllLeaveRequests = async (req, res, next) => {
    try {
        const today = new Date();

        const users = await User.find({ company: req.user.company }).select('_id');
        const userIds = users.map(u => u._id);

        await Leave.updateMany(
            {
                status: 'pending',
                startDate: { $lt: today },
                user: { $in: userIds }
            },
            {
                $set: { status: 'declined' }
            }
        );

        const requests = await Leave.find({ user: { $in: userIds } })
            .populate('user', 'fullname email role department position')
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

        // Enforce hard tenant isolation: Ensure the leave request user belongs to the same company
        const targetUser = await User.findOne({ _id: leave.user, company: req.user.company });
        if (!targetUser) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Employee record does not belong to your organization' });
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
            const typeKey = leave.leaveType.toLowerCase();
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);
            const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

            if (targetUser.leaveBalances && targetUser.leaveBalances[typeKey]) {
                targetUser.leaveBalances[typeKey].left -= totalDays;
                targetUser.markModified(`leaveBalances.${typeKey}`);
                await targetUser.save();
            }
        }

        leave.status = action;
        await leave.save();

        // 📝 Telemetry Log: Explicitly mapped directly into the SECURITY module stream under INFO
        await createAuditLog(
            adminId,
            'leave_review',
            `Admin processed leave request ${leaveId} for employee ${leave.user}. Decision set to: ${action.toUpperCase()}.`,
            req,
            'INFO',
            'SECURITY'
        );

        // 🔔 Notification: Log leave status changes specifically targeted to the relevant user
        const statusHeader = action === 'approved' ? 'Leave Request Approved' : 'Leave Request Rejected';
        const statusMsg = action === 'approved' 
            ? `Your request for ${leave.leaveType} Leave starting ${new Date(leave.startDate).toLocaleDateString()} has been approved.`
            : `Your request for ${leave.leaveType} Leave has been declined by administration.`;

        await exports.handleNotifications(
            'leave_status',
            statusHeader,
            statusMsg,
            leave.user,
            req.user.company
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

// --- EMPLOYEE USER DIRECTORY & REAL-TIME SUMMARY ---

exports.getAllEmployees = async (req, res, next) => {
    try {
        const employees = await User.find({ 
            role: 'user', 
            employmentStatus: { $ne: 'terminated' },
            company: req.user.company
        }).select('-password').lean();

        const employeeIds = employees.map(e => e._id);

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const todayAttendance = await Attendance.find({
            timestamp: { $gte: startOfToday, $lte: endOfToday },
            user: { $in: employeeIds }
        }).lean();

        const todayLeaves = await Leave.find({
            status: 'approved',
            startDate: { $lte: endOfToday },
            endDate: { $gte: startOfToday },
            user: { $in: employeeIds }
        }).lean();

        const employeeDataWithStatus = employees.map(employee => {
            const empIdStr = employee._id.toString();

            const isOnLeave = todayLeaves.some(leave => leave.user.toString() === empIdStr);
            if (isOnLeave) {
                return { ...employee, todayStatus: 'On Leave' };
            }

            const employeeLogs = todayAttendance.filter(log => log.user.toString() === empIdStr);

            if (employeeLogs.length === 0) {
                return { ...employee, todayStatus: 'Absent' };
            }

            const sortedInLogs = employeeLogs
                .filter(log => log.type === 'in')
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

            if (sortedInLogs.length === 0 && employeeLogs.length > 0) {
                return { ...employee, todayStatus: 'Present' };
            }

            const firstClockIn = sortedInLogs[0];
            const shiftThreshold = new Date(firstClockIn.timestamp);
            shiftThreshold.setHours(9, 0, 0, 0); 

            if (new Date(firstClockIn.timestamp) > shiftThreshold) {
                return { ...employee, todayStatus: 'Late' };
            }

            return { ...employee, todayStatus: 'Present' };
        });

        const summaryMetrics = {
            totalUsersCount: employeeDataWithStatus.length,
            present: employeeDataWithStatus.filter(e => e.todayStatus === 'Present').length,
            absent: employeeDataWithStatus.filter(e => e.todayStatus === 'Absent').length,
            late: employeeDataWithStatus.filter(e => e.todayStatus === 'Late').length,
            onLeave: employeeDataWithStatus.filter(e => e.todayStatus === 'On Leave').length
        };

        return res.status(200).json({
            success: true,
            summary: summaryMetrics,
            data: employeeDataWithStatus
        });

    } catch (error) {
        console.error('Error compiling employee management directory:', error);
        next(error);
    }
};

exports.overrideAttendance = async (req, res, next) => {
    try {
        const adminId = req.user.id;
        const { employeeId, targetDate, type, timestamp, workDuration } = req.body;

        if (!employeeId || !targetDate || !type) {
            return res.status(400).json({
                success: false,
                message: 'Please provide employeeId, targetDate, and log type (in/out).'
            });
        }

        if (!['in', 'out', 'delete'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Type must be either 'in', 'out', or 'delete'"
            });
        }

        const employee = await User.findOne({ _id: employeeId, company: req.user.company });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee record not found in your organization' });
        }

        const startOfTargetDay = new Date(targetDate);
        startOfTargetDay.setHours(0, 0, 0, 0);

        const endOfTargetDay = new Date(targetDate);
        endOfTargetDay.setHours(23, 59, 59, 999);

        if (type === 'delete') {
            await Attendance.deleteMany({
                user: employeeId,
                timestamp: { $gte: startOfTargetDay, $lte: endOfTargetDay }
            });

            await createAuditLog(
                adminId,
                'attendance_override',
                `Admin deleted all attendance logs for ${employee.fullname} on ${startOfTargetDay.toLocaleDateString()}.`,
                req,
                'WARN',
                'SECURITY'
            );

            return res.status(200).json({
                success: true,
                message: `Attendance logs successfully deleted for this date.`,
                data: null
            });
        }

        let logEntry = await Attendance.findOne({
            user: employeeId,
            type: type,
            timestamp: { $gte: startOfTargetDay, $lte: endOfTargetDay }
        });

        const updatedTimestamp = timestamp ? new Date(timestamp) : new Date(targetDate);

        if (logEntry) {
            logEntry.timestamp = updatedTimestamp;
            if (type === 'out' && workDuration !== undefined) {
                logEntry.workDuration = Number(workDuration);
            }
            await logEntry.save();
        } else {
            logEntry = await Attendance.create({
                user: employeeId,
                type: type,
                timestamp: updatedTimestamp,
                workDuration: type === 'out' ? (workDuration || 0) : null
            });
        }

        // 📝 Telemetry Log: Since overrides modify core operational data records, we escalate this to WARN under SECURITY tracking
        await createAuditLog(
            adminId,
            'attendance_override',
            `Admin overridden ${type.toUpperCase()} log for ${employee.fullname} on ${startOfTargetDay.toLocaleDateString()}.`,
            req,
            'WARN',
            'SECURITY'
        );

        return res.status(200).json({
            success: true,
            message: `Attendance ${type.toUpperCase()} record successfully updated by admin override.`,
            data: logEntry
        });

    } catch (error) {
        console.error('Error executing admin attendance override:', error);
        next(error);
    }
};

exports.getEmployeeAnalytics = async (req, res, next) => {
    try {
        const { employeeId } = req.params;
        
        const employee = await User.findOne({ _id: employeeId, company: req.user.company }).select('-password').lean();
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found in your organization' });
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

        const monthlyLogs = await Attendance.find({
            user: employeeId,
            timestamp: { $gte: startOfMonth, $lte: now }
        }).lean();

        let totalMinutesWorked = 0;
        const uniqueDaysPresent = new Set();

        monthlyLogs.forEach(log => {
            const dateKey = new Date(log.timestamp).toDateString();
            uniqueDaysPresent.add(dateKey);

            if (log.type === 'out' && log.workDuration) {
                totalMinutesWorked += log.workDuration;
            }
        });

        const totalHoursWorked = Number((totalMinutesWorked / 60).toFixed(1));
        const daysPresentCount = uniqueDaysPresent.size;

        const avgHoursPerDay = daysPresentCount > 0 
            ? Number((totalHoursWorked / daysPresentCount).toFixed(1)) 
            : 0;

        let expectedWorkDays = 0;
        let loopDate = new Date(startOfMonth);
        while (loopDate <= now) {
            const dayOfWeek = loopDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                expectedWorkDays++;
            }
            loopDate.setDate(loopDate.getDate() + 1);
        }

        const attendanceRate = expectedWorkDays > 0 
            ? Math.min(100, Math.round((daysPresentCount / expectedWorkDays) * 100)) 
            : 100;

        return res.status(200).json({
            success: true,
            data: {
                employeeId: employee._id,
                fullname: employee.fullname,
                metrics: {
                    attendanceRate: `${attendanceRate}%`,
                    totalHours: totalHoursWorked,
                    avgHoursPerDay: avgHoursPerDay,
                    daysPresent: daysPresentCount,
                    expectedDays: expectedWorkDays
                },
                logs: monthlyLogs
            }
        });

    } catch (error) {
        console.error('Error generating analytics metrics:', error);
        next(error);
    }
};

// --- PAYROLL MANAGEMENT ---

exports.getPayrollDashboard = async (req, res, next) => {
    try {
        const users = await User.find({ company: req.user.company }).select('_id');
        const userIds = users.map(u => u._id);

        const ledger = await Payroll.find({ employee: { $in: userIds } })
            .populate('employee', 'fullname email position profilePicture')
            .sort({ createdAt: -1 });

        const stats = await Payroll.aggregate([
            {
                $match: { employee: { $in: userIds } }
            },
            {
                $group: {
                    _id: null,
                    totalBudget: { $sum: '$basicSalary' },
                    releasedPayments: {
                        $sum: { $cond: [{ $eq: ['$status', 'Paid'] }, '$basicSalary', 0] }
                    },
                    pendingReleases: {
                        $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, '$basicSalary', 0] }
                    }
                }
            }
        ]);

        const cardMetrics = stats[0] || {
            totalBudget: 0,
            releasedPayments: 0,
            pendingReleases: 0
        };

        return res.status(200).json({
            success: true,
            metrics: {
                totalBudget: cardMetrics.totalBudget,
                releasedPayments: cardMetrics.releasedPayments,
                pendingReleases: cardMetrics.pendingReleases
            },
            data: ledger
        });
    } catch (error) {
        next(error);
    }
};

exports.generatePayrollRun = async (req, res, next) => {
    try {
        const { employeeId, basicSalary, periodStart, periodEnd } = req.body;

        if (!employeeId || !basicSalary || !periodStart || !periodEnd) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all necessary payload coordinates including Employee ID, basic salary, and cycle dates.'
            });
        }

        const employeeExists = await User.findOne({ _id: employeeId, company: req.user.company });
        if (!employeeExists) {
            return res.status(404).json({ success: false, message: 'Target employee record not found in your organization' });
        }

        const payroll = await Payroll.create({
            employee: employeeId,
            basicSalary: Number(basicSalary),
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
            status: 'Pending'
        });

        await payroll.populate('employee', 'fullname email position');

        // 📝 Telemetry Log: Direct matching structure for your [INFO] [PAYROLL] terminal tags
        await createAuditLog(
            req.user.id,
            'profile_update',
            `Generated pending payroll sheet run reference: ${payroll.payrollId} for ${payroll.employee.fullname}`,
            req,
            'INFO',
            'PAYROLL'
        );

        // 🔔 Notification: Inform the user that their payslip has been generated and is awaiting verification
        await exports.handleNotifications(
            'payroll_generated',
            'Payslip Generated',
            `Your payslip calculations for period ${new Date(periodStart).toLocaleDateString()} to ${new Date(periodEnd).toLocaleDateString()} have been processed and are pending review.`,
            employeeId,
            req.user.company
        );

        return res.status(201).json({
            success: true,
            message: 'Payroll entry provisioned securely',
            data: payroll
        });
    } catch (error) {
        next(error);
    }
};

exports.releaseSalary = async (req, res, next) => {
    try {
        const payroll = await Payroll.findById(req.params.id).populate('employee', 'fullname company');

        if (!payroll) {
            return res.status(404).json({ success: false, message: 'Payroll ledger target row not found' });
        }

        if (!payroll.employee || payroll.employee.company !== req.user.company) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Employee does not belong to your organization' });
        }

        if (payroll.status === 'Paid') {
            return res.status(400).json({ success: false, message: 'This payroll calculation run has already been fully settled and paid.' });
        }

        payroll.status = 'Paid';
        payroll.paymentDate = new Date();
        await payroll.save();

        // 📝 Telemetry Log: Direct matching structure for financial release events
        await createAuditLog(
            req.user.id,
            'profile_update',
            `Approved and released budget payout for calculation worksheet profile ID: ${payroll.payrollId} tracking to ${payroll.employee.fullname}`,
            req,
            'INFO',
            'PAYROLL'
        );

        // 🔔 Notification: Inform the targeted user that funds have been officially sent out
        await exports.handleNotifications(
            'payroll_released',
            'Salary Disbursed 🎉',
            `Great news! Your salary payment for cycle ending ${new Date(payroll.periodEnd).toLocaleDateString()} has been approved and released.`,
            payroll.employee._id,
            req.user.company
        );

        return res.status(200).json({
            success: true,
            message: 'Salary package successfully released and marked as settled.',
            data: payroll
        });
    } catch (error) {
        next(error);
    }
};

exports.deletePayrollEntry = async (req, res, next) => {
    try {
        const payroll = await Payroll.findById(req.params.id).populate('employee', 'company');

        if (!payroll) {
            return res.status(404).json({ success: false, message: 'Target ledger entity row calculation sheet not found' });
        }

        if (!payroll.employee || payroll.employee.company !== req.user.company) {
            return res.status(403).json({ success: false, message: 'Unauthorized: Employee does not belong to your organization' });
        }

        if (payroll.status === 'Paid') {
            return res.status(400).json({
                success: false,
                message: 'Restricted action. Settled ledger rows cannot be dropped from the database.'
            });
        }

        const cachedId = payroll.payrollId;
        await payroll.deleteOne();

        // 📝 Telemetry Log: Explicit warning label indicating manual data deletion
        await createAuditLog(
            req.user.id,
            'profile_update',
            `Dropped raw data entry log out of payroll worksheets tracking code: ${cachedId}`,
            req,
            'WARN',
            'PAYROLL'
        );

        return res.status(200).json({
            success: true,
            message: 'Ledger table entry row removed successfully'
        });
    } catch (error) {
        next(error);
    }
};

// --- SINGLE CONSOLIDATED NOTIFICATION CONTROLLER PIPELINE ---

exports.handleNotifications = async (req, res, next) => {
    // Scenario A: Internal backend trigger (Saving a new targeted/global notification entry)
    if (typeof req === 'string') {
        const [type, title, message, recipientId, company] = [req, res, next, arguments[3], arguments[4]];
        try {
            await Notification.create({ 
                type, 
                title, 
                message,
                recipient: recipientId || null, // Optional: Null handles general broadcasts to all managers
                company: company || 'Default Company'
            });
            return;
        } catch (err) {
            return console.error('Notification log initialization failed:', err);
        }
    }

    // Scenario B: Normal Express GET route request
    try {
        const feed = await Notification.find({ company: req.user.company }).sort({ createdAt: -1 }).limit(20);
        return res.status(200).json({ 
            success: true, 
            count: feed.length,
            data: feed 
        });
    } catch (error) {
        if (next) next(error);
    }
};

// --- EMPLOYEE MANAGEMENT BY ADMIN ---

exports.createEmployee = async (req, res, next) => {
    try {
        const { fullname, email, password, department, position } = req.body;
        if (!email || !fullname) {
            return res.status(400).json({ success: false, message: 'Please provide name and email' });
        }
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const employeeCount = await User.countDocuments({
            role: 'user',
            employmentStatus: { $ne: 'terminated' },
            company: req.user.company
        });

        if (employeeCount >= 10) {
            return res.status(400).json({
                success: false,
                message: 'Tier Limit Reached: Starter tier supports a maximum of 10 employees.'
            });
        }

        const user = await User.create({
            fullname,
            email,
            password: password || '123456',
            role: 'user',
            company: req.user.company,
            department: department || 'Unassigned',
            position: position || 'Staff Employee',
            employmentStatus: 'active'
        });
        res.status(201).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

exports.deleteEmployee = async (req, res, next) => {
    try {
        const employee = await User.findOne({ _id: req.params.id, company: req.user.company });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        await employee.deleteOne();
        res.status(200).json({ success: true, message: 'Employee deleted successfully' });
    } catch (error) {
        next(error);
    }
};

exports.approveEmployee = async (req, res, next) => {
    try {
        const employee = await User.findOne({ _id: req.params.id, company: req.user.company });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        employee.employmentStatus = 'active';
        await employee.save();
        res.status(200).json({ success: true, data: employee });
    } catch (error) {
        next(error);
    }
};

exports.rejectEmployee = async (req, res, next) => {
    try {
        const employee = await User.findOne({ _id: req.params.id, company: req.user.company });
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }
        await employee.deleteOne();
        res.status(200).json({ success: true, message: 'Employee registration rejected and deleted' });
    } catch (error) {
        next(error);
    }
};

// --- DEPARTMENT MANAGEMENT ---

exports.getDepartments = async (req, res, next) => {
    try {
        const company = req.user.company;

        // Get departments from dedicated collection
        const deptDocs = await Department.find({ company }).sort({ name: 1 });
        const deptNames = deptDocs.map(d => d.name);

        // Also pull distinct departments from User records (covers legacy data)
        const userDepts = await User.distinct('department', { company, department: { $ne: 'Unassigned' } });

        // Merge and deduplicate (case-insensitive)
        const seen = new Set();
        const merged = [];
        for (const name of [...deptNames, ...userDepts]) {
            const key = name.toLowerCase();
            if (!seen.has(key)) {
                seen.add(key);
                merged.push(name);
            }
        }

        merged.sort((a, b) => a.localeCompare(b));
        res.status(200).json({ success: true, data: merged });
    } catch (error) {
        next(error);
    }
};

exports.createDepartment = async (req, res, next) => {
    try {
        const { name } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ success: false, message: 'Department name is required' });
        }

        const company = req.user.company;
        const exists = await Department.findOne({
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
            company
        });
        if (exists) {
            return res.status(400).json({ success: false, message: 'Department already exists' });
        }

        const dept = await Department.create({ name: name.trim(), company });
        res.status(201).json({ success: true, data: dept.name });
    } catch (error) {
        next(error);
    }
};

exports.updateDepartment = async (req, res, next) => {
    try {
        const { oldName } = req.params;
        const { name: newName } = req.body;
        const company = req.user.company;

        if (!newName || !newName.trim()) {
            return res.status(400).json({ success: false, message: 'New department name is required' });
        }

        // Check duplicate
        if (oldName.toLowerCase() !== newName.trim().toLowerCase()) {
            const duplicate = await Department.findOne({
                name: { $regex: new RegExp(`^${newName.trim()}$`, 'i') },
                company
            });
            if (duplicate) {
                return res.status(400).json({ success: false, message: 'New department name already exists' });
            }
        }

        // Update or create the department doc
        await Department.findOneAndUpdate(
            { name: { $regex: new RegExp(`^${oldName}$`, 'i') }, company },
            { name: newName.trim() },
            { upsert: true, new: true }
        );

        // Cascade rename to all users in that department
        await User.updateMany(
            { department: { $regex: new RegExp(`^${oldName}$`, 'i') }, company },
            { department: newName.trim() }
        );

        res.status(200).json({ success: true, data: newName.trim() });
    } catch (error) {
        next(error);
    }
};

exports.deleteDepartment = async (req, res, next) => {
    try {
        const { name } = req.params;
        const company = req.user.company;

        // Block if active employees assigned
        const activeCount = await User.countDocuments({
            department: { $regex: new RegExp(`^${name}$`, 'i') },
            company,
            employmentStatus: 'active'
        });
        if (activeCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete: ${activeCount} active employee(s) assigned`
            });
        }

        await Department.findOneAndDelete({
            name: { $regex: new RegExp(`^${name}$`, 'i') },
            company
        });

        res.status(200).json({ success: true, message: 'Department deleted' });
    } catch (error) {
        next(error);
    }
};

exports.teamCreate = async (req, res, next) => {
    try {
        const { employees } = req.body; // Incoming array of members from Step 2
        const companyId = req.user.company;
        const adminId = req.user.id;

        if (!employees || !Array.isArray(employees) || employees.length === 0) {
            return res.status(400).json({ success: false, message: 'No team members provided.' });
        }

        // 1. Verify Starter Tier constraints (Max 10 active records)
        const currentEmployeeCount = await User.countDocuments({
            role: 'user',
            employmentStatus: { $ne: 'terminated' },
            company: companyId
        });

        if (currentEmployeeCount + employees.length > 10) {
            return res.status(400).json({
                success: false,
                message: 'Tier Limit Reached: Starter tier supports a maximum of 10 employees.'
            });
        }

        // 2. Format raw input elements with operational platform settings
        const preparedEmployees = employees.map(emp => ({
            fullname: emp.fullname.trim(),
            email: emp.email.toLowerCase().trim(),
            password: 'TEMP_UNSET_PASSWORD_123!', // Unset stub password configuration
            role: 'user',
            company: companyId,
            department: emp.department?.trim() || 'Unassigned',
            position: emp.position?.trim() || 'Staff Employee',
            employmentStatus: 'active', 
            
            // Flags to handle granular setups later in the Management Tab
            isProfileConfigured: false, 
            mustChangePassword: true    
        }));

        // 3. Prevent duplicate collisions across the system
        const emailsToImport = preparedEmployees.map(e => e.email);
        const duplicateChecks = await User.find({ email: { $in: emailsToImport } }).select('email');
        if (duplicateChecks.length > 0) {
            const list = duplicateChecks.map(u => u.email).join(', ');
            return res.status(400).json({
                success: false,
                message: `Registration blocked. The following emails are already registered: ${list}`
            });
        }

        // 4. Batch Document Creation
        const onboardedTeam = await User.insertMany(preparedEmployees);

        // Telemetry Audit Log
        await createAuditLog(
            adminId,
            'profile_update',
            `Admin initialized teamCreate engine: provisioned ${onboardedTeam.length} initial profiles.`,
            req, 'INFO', 'SYSTEM'
        );

        return res.status(201).json({
            success: true,
            message: 'Initial team placeholder profiles provisioned successfully.',
            count: onboardedTeam.length
        });

    } catch (error) {
        next(error);
    }
};