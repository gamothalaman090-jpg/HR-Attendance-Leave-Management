
/**
 * Name: adminController.js
 * Purpose: Contains controller functions for admin-specific operations, including announcement, attendance, and leave management.
 * Dependencies: Announcement model, Leave model, User model, Attendance model, Logger Utility
 * Author: Ian
 * Location: server/controllers/adminController.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-21
 * 
 *  */

/**
 * Note:
 * // Response formatting
 * 
const response = await axios.get('/api/admin/employees-directory');
// 1. Set the raw rows list for the big dashboard data table
setEmployees(response.data.data);
// 2. Set the data variables for your top metric card widgets instantly!
setTotalCount(response.data.summary.totalUsersCount);
setPresentCount(response.data.summary.present);
setAbsentCount(response.data.summary.absent);
setLateCount(response.data.summary.late);
setLeaveCount(response.data.summary.onLeave);
 * 
 */


const Announcement = require('../models/Announcement');
const Leave = require('../models/Leave');
const User = require('../models/User');
const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
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

// --- LEAVE MANAGEMENT ---

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

// --- EMPLOYEE USER DIRECTORY & REAL-TIME SUMMARY ---

exports.getAllEmployees = async (req, res, next) => {
    try {
        // Fetch users who are 'user' role and NOT permanently terminated
        const employees = await User.find({ 
            role: 'user', 
            employmentStatus: { $ne: 'terminated' } 
        }).select('-password').lean();

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const todayAttendance = await Attendance.find({
            timestamp: { $gte: startOfToday, $lte: endOfToday }
        }).lean();

        const todayLeaves = await Leave.find({
            status: 'approved',
            startDate: { $lte: endOfToday },
            endDate: { $gte: startOfToday }
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

        // 1. Basic validation
        if (!employeeId || !targetDate || !type) {
            return res.status(400).json({
                success: false,
                message: 'Please provide employeeId, targetDate, and log type (in/out).'
            });
        }

        if (!['in', 'out'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: "Type must be either 'in' or 'out'"
            });
        }

        // 2. Verify target employee exists
        const employee = await User.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee record not found' });
        }

        // 3. Parse date boundaries for that specific log day
        const startOfTargetDay = new Date(targetDate);
        startOfTargetDay.setHours(0, 0, 0, 0);

        const endOfTargetDay = new Date(targetDate);
        endOfTargetDay.setHours(23, 59, 59, 999);

        // 4. Find if an entry already exists for that type on that day
        let logEntry = await Attendance.findOne({
            user: employeeId,
            type: type,
            timestamp: { $gte: startOfTargetDay, $lte: endOfTargetDay }
        });

        const updatedTimestamp = timestamp ? new Date(timestamp) : new Date(targetDate);

        if (logEntry) {
            // Scenario A: Log exists -> Update it with the admin's changes
            logEntry.timestamp = updatedTimestamp;
            if (type === 'out' && workDuration !== undefined) {
                logEntry.workDuration = Number(workDuration);
            }
            await logEntry.save();
        } else {
            // Scenario B: No log exists (e.g., overriding an Absent state) -> Create a new record
            logEntry = await Attendance.create({
                user: employeeId,
                type: type,
                timestamp: updatedTimestamp,
                workDuration: type === 'out' ? (workDuration || 0) : null
            });
        }

        // 5. Fire off an audit log trace for transparency
        await createAuditLog(
            adminId,
            'attendance_override',
            `Admin overridden ${type.toUpperCase()} log for ${employee.fullname} on ${startOfTargetDay.toLocaleDateString()}.`,
            req
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
        
        // Find employee
        const employee = await User.findById(employeeId).select('-password').lean();
        if (!employee) {
            return res.status(404).json({ success: false, message: 'Employee not found' });
        }

        // Define time window: Start of current month to now
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

        // 1. Fetch all attendance logs for this employee this month
        const monthlyLogs = await Attendance.find({
            user: employeeId,
            timestamp: { $gte: startOfMonth, $lte: now }
        }).lean();

        // 2. Calculate Total Minutes & Unique Days Present
        let totalMinutesWorked = 0;
        const uniqueDaysPresent = new Set();

        monthlyLogs.forEach(log => {
            const dateKey = new Date(log.timestamp).toDateString(); // e.g., "Thu May 21 2026"
            uniqueDaysPresent.add(dateKey);

            if (log.type === 'out' && log.workDuration) {
                totalMinutesWorked += log.workDuration;
            }
        });

        const totalHoursWorked = Number((totalMinutesWorked / 60).toFixed(1)); // e.g., 95.4
        const daysPresentCount = uniqueDaysPresent.size;

        // 3. Calculate Daily Average Hours Worked
        const avgHoursPerDay = daysPresentCount > 0 
            ? Number((totalHoursWorked / daysPresentCount).toFixed(1)) 
            : 0; // e.g., 8.7

        // 4. Calculate Expected Work Days (Mon-Fri) from start of month until today
        let expectedWorkDays = 0;
        let loopDate = new Date(startOfMonth);
        while (loopDate <= now) {
            const dayOfWeek = loopDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip Sunday (0) and Saturday (6)
                expectedWorkDays++;
            }
            loopDate.setDate(loopDate.getDate() + 1);
        }

        // 5. Calculate Attendance Rate Percentage
        const attendanceRate = expectedWorkDays > 0 
            ? Math.min(100, Math.round((daysPresentCount / expectedWorkDays) * 100)) 
            : 100; // e.g., 100%

        return res.status(200).json({
            success: true,
            data: {
                employeeId: employee._id,
                fullname: employee.fullname,
                metrics: {
                    attendanceRate: `${attendanceRate}%`, // Matches "100%"
                    totalHours: totalHoursWorked,         // Matches "95.4"
                    avgHoursPerDay: avgHoursPerDay,       // Matches "8.7"
                    daysPresent: daysPresentCount,
                    expectedDays: expectedWorkDays
                }
            }
        });

    } catch (error) {
        console.error('Error generating analytics metrics:', error);
        next(error);
    }
};

exports.getPayrollDashboard = async (req, res, next) => {
    try {
        // 1. Fetch the complete ledger table rows, populating human-readable user details
        const ledger = await Payroll.find()
            .populate('employee', 'fullname email position profilePicture')
            .sort({ createdAt: -1 });

        // 2. Aggregate financial calculations to dynamically drive the top analytical summary dashboard cards
        const stats = await Payroll.aggregate([
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

        // Fallback metrics format if the database ledger collection is completely fresh and unseeded
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

        // Validation guardrail: check parameter existence
        if (!employeeId || !basicSalary || !periodStart || !periodEnd) {
            return res.status(400).json({
                success: false,
                message: 'Please provide all necessary payload coordinates including Employee ID, basic salary, and cycle dates.'
            });
        }

        // Validate target employee profile existence in DB
        const employeeExists = await User.findById(employeeId);
        if (!employeeExists) {
            return res.status(404).json({ success: false, message: 'Target employee record not found' });
        }

        // Provision the new ledger row document
        const payroll = await Payroll.create({
            employee: employeeId,
            basicSalary: Number(basicSalary),
            periodStart: new Date(periodStart),
            periodEnd: new Date(periodEnd),
            status: 'Pending'
        });

        // Populate employee properties for the immediate server callback response context
        await payroll.populate('employee', 'fullname email position');

        // Capture generation execution transaction event context
        await createAuditLog(
            req.user.id, // ID of the HR manager executing this operation
            'profile_update', // Reusing matching schema tracking enum flags
            `Generated pending payroll sheet run reference: ${payroll.payrollId} for ${payroll.employee.fullname}`,
            req
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
        const payroll = await Payroll.findById(req.params.id).populate('employee', 'fullname');

        if (!payroll) {
            return res.status(404).json({ success: false, message: 'Payroll ledger target row not found' });
        }

        if (payroll.status === 'Paid') {
            return res.status(400).json({ success: false, message: 'This payroll calculation run has already been fully settled and paid.' });
        }

        // Transition status rules and log timestamp coordinates
        payroll.status = 'Paid';
        payroll.paymentDate = new Date();
        await payroll.save();

        // Trace structural distribution workflow activity execution
        await createAuditLog(
            req.user.id,
            'profile_update',
            `Approved and released budget payout for calculation worksheet profile ID: ${payroll.payrollId} tracking to ${payroll.employee.fullname}`,
            req
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
        const payroll = await Payroll.findById(req.params.id);

        if (!payroll) {
            return res.status(404).json({ success: false, message: 'Target ledger entity row calculation sheet not found' });
        }

        // Protection guardrail: Deny drop requests on settled records to preserve historic auditing tables consistency
        if (payroll.status === 'Paid') {
            return res.status(400).json({
                success: false,
                message: 'Restricted action. Settled ledger rows cannot be dropped from the database.'
            });
        }

        await payroll.deleteOne();

        await createAuditLog(
            req.user.id,
            'profile_update',
            `Dropped raw data entry log out of payroll worksheets tracking code: ${payroll.payrollId}`,
            req
        );

        return res.status(200).json({
            success: true,
            message: 'Ledger table entry row removed successfully'
        });
    } catch (error) {
        next(error);
    }
};