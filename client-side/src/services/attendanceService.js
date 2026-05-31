/**
 * Attendance Service — Connects to Node.js/Express/MongoDB backend.
 *
 * User endpoints:  POST /user/time-in, POST /user/time-out, GET /user/history
 * Admin endpoints: PUT  /admin/attendance/override, GET /admin/users/:id/analytics
 */
import api from './api';

/* ── Helpers ── */

/**
 * Build a calendar-grid array for the current month from raw attendance logs.
 * Each entry: { date, day, dayOfWeek, status, clockIn, clockOut, hours }
 */
const buildMonthlyCalendar = (logs, joinDate) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const joinDateMidnight = joinDate ? new Date(joinDate) : null;
  if (joinDateMidnight) {
    joinDateMidnight.setHours(0, 0, 0, 0);
  }

  // Index logs by date string for fast lookup
  const logsByDate = {};
  logs.forEach((log) => {
    if (!log.timestamp) return;
    const d = new Date(log.timestamp);
    const key = d.toISOString().split('T')[0];
    if (!logsByDate[key]) logsByDate[key] = [];
    logsByDate[key].push(log);
  });

  const records = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    const isFuture = date > today;
    const isBeforeCreation = joinDateMidnight ? date < joinDateMidnight : false;

    if (isFuture || isBeforeCreation) {
      records.push({ date: dateStr, day, dayOfWeek, status: 'upcoming', clockIn: null, clockOut: null, hours: 0 });
      continue;
    }

    const dayLogs = logsByDate[dateStr] || [];
    if (dayLogs.length > 0) {
      const inLog = dayLogs.find((l) => l.type === 'in');
      const outLog = dayLogs.find((l) => l.type === 'out');

      const clockIn = inLog ? new Date(inLog.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;
      const clockOut = outLog ? new Date(outLog.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;
      const hours = outLog?.workDuration ? Number((outLog.workDuration / 60).toFixed(1)) : 0;

      // Determine status based on clock-in time
      let status = 'present';
      if (inLog) {
        const inHour = new Date(inLog.timestamp).getHours();
        if (inHour >= 9) status = 'late';
      }

      records.push({ date: dateStr, day, dayOfWeek, status, clockIn, clockOut, hours });
      continue;
    }

    if (dayOfWeek === 0 || dayOfWeek === 6) {
      records.push({ date: dateStr, day, dayOfWeek, status: 'weekend', clockIn: null, clockOut: null, hours: 0 });
      continue;
    }

    records.push({ date: dateStr, day, dayOfWeek, status: 'absent', clockIn: null, clockOut: null, hours: 0 });
  }

  return records;
};

/**
 * Derive summary stats from calendar records.
 */
const buildSummary = (records) => {
  const workdays = records.filter((r) => !['weekend', 'upcoming'].includes(r.status));
  const presentDays = workdays.filter((r) => r.status === 'present').length;
  const absentDays = workdays.filter((r) => r.status === 'absent').length;
  const lateDays = workdays.filter((r) => r.status === 'late').length;
  const leaveDays = workdays.filter((r) => r.status === 'leave').length;
  const totalHours = workdays.reduce((sum, r) => sum + (r.hours || 0), 0);
  const daysWorked = presentDays + lateDays;
  const avgHoursPerDay = daysWorked > 0 ? Number((totalHours / daysWorked).toFixed(1)) : 0;
  const attendanceRate = workdays.length > 0 ? Math.round(((presentDays + lateDays) / workdays.length) * 100) : 100;

  return { presentDays, absentDays, lateDays, leaveDays, totalHours: Number(totalHours.toFixed(1)), avgHoursPerDay, attendanceRate };
};

/* ── Clock status tracking (persisted via last API response) ── */
let clockStatus = {
  isClockedIn: false,
  clockInTime: null,
  clockOutTime: null,
};

export const attendanceService = {
  /**
   * Get monthly calendar records for current user.
   * Fetches raw attendance history from backend then builds calendar grid.
   */
  async getMonthly() {
    const { data: res } = await api.get('/user/history');
    const logs = res.data || [];
    if (logs.length > 0 && logs[0].status !== undefined) {
      return logs;
    }
    return buildMonthlyCalendar(logs);
  },

  /**
   * Get attendance summary stats for current user.
   */
  async getSummary() {
    const records = await this.getMonthly();
    return buildSummary(records);
  },

  /** Get weekly attendance data (derived from monthly) */
  async getWeekly() {
    const records = await this.getMonthly();
    // Return last 7 workday records
    return records.filter((r) => !['weekend', 'upcoming'].includes(r.status)).slice(-7);
  },

  /** Clock in */
  async clockIn() {
    const { data: res } = await api.post('/user/time-in');
    const entry = res.data;
    const time = new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    clockStatus = { isClockedIn: true, clockInTime: time, clockOutTime: null };
    return { ...clockStatus };
  },

  /** Clock out */
  async clockOut() {
    const { data: res } = await api.post('/user/time-out');
    const entry = res.data;
    const time = new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    clockStatus = { ...clockStatus, isClockedIn: false, clockOutTime: time };
    return { ...clockStatus };
  },

  /** Derive clock status from an already-fetched calendar records array (avoids extra API call) */
  deriveClockStatusFromRecords(records) {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const todayRecord = (records || []).find(r => r.date === todayStr);

    if (todayRecord) {
      if (todayRecord.clockIn && !todayRecord.clockOut) {
        clockStatus = { isClockedIn: true, clockInTime: todayRecord.clockIn, clockOutTime: null };
      } else if (todayRecord.clockIn && todayRecord.clockOut) {
        clockStatus = { isClockedIn: false, clockInTime: todayRecord.clockIn, clockOutTime: todayRecord.clockOut };
      } else {
        clockStatus = { isClockedIn: false, clockInTime: null, clockOutTime: null };
      }
    } else {
      clockStatus = { isClockedIn: false, clockInTime: null, clockOutTime: null };
    }
    return { ...clockStatus };
  },

  /** Get current clock status by checking today's attendance record */
  async getClockStatus() {
    try {
      const { data: res } = await api.get('/user/history');
      const logs = res.data || [];
      if (logs.length > 0) {
        if (logs[0].status !== undefined) {
          // Backend returns calendar records — use local date for comparison
          return this.deriveClockStatusFromRecords(logs);
        } else {
          // Legacy raw-log format fallback
          const now = new Date();
          const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const lastLog = logs[0]; // sorted by timestamp desc
          const logDate = new Date(lastLog.timestamp);
          const logDateStr = `${logDate.getFullYear()}-${String(logDate.getMonth() + 1).padStart(2, '0')}-${String(logDate.getDate()).padStart(2, '0')}`;

          if (logDateStr === today) {
            const time = logDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            if (lastLog.type === 'in') {
              clockStatus = { isClockedIn: true, clockInTime: time, clockOutTime: null };
            } else {
              const todayIn = logs.find((l) => {
                const d = new Date(l.timestamp);
                const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                return l.type === 'in' && ds === today;
              });
              clockStatus = {
                isClockedIn: false,
                clockInTime: todayIn ? new Date(todayIn.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
                clockOutTime: time,
              };
            }
            return { ...clockStatus };
          }
        }
      }
    } catch {
      // If history fetch fails, return default
    }
    clockStatus = { isClockedIn: false, clockInTime: null, clockOutTime: null };
    return { ...clockStatus };
  },

  /**
   * Get attendance records for all employees (admin).
   * Uses analytics endpoint per employee to build the map.
   */
  async getAllEmployeesAttendance() {
    // Return empty object — staff timesheets are handled via per-employee analytics
    return {};
  },

  /**
   * Get analytics + logs for a specific employee (admin).
   */
  async getEmployeeAnalytics(employeeId) {
    const { data: res } = await api.get(`/admin/users/${employeeId}/analytics`);
    return res.data;
  },

  /** Get attendance grid for a staff member (for admin dashboard) */
  async getEmployeeAttendanceGrid(employeeId, joinDate) {
    const res = await this.getEmployeeAnalytics(employeeId);
    const logs = res?.logs || [];
    return buildMonthlyCalendar(logs, joinDate);
  },

  /**
   * Admin override attendance for a specific employee and date.
   * Supports type: 'in', 'out', 'delete'
   */
  async adjustAttendance({ employeeId, dateStr, data }) {
    // Build override payload matching backend expectation
    const payload = {
      employeeId,
      targetDate: dateStr,
      type: data.status === 'absent' ? 'delete' : 'in',
      timestamp: data.clockIn ? `${dateStr}T${convertTo24h(data.clockIn)}:00` : `${dateStr}T09:00:00`,
    };

    // First set clock-in
    if (data.status !== 'absent') {
      await api.put('/admin/attendance/override', payload);

      // Then set clock-out if provided
      if (data.clockOut) {
        const outPayload = {
          employeeId,
          targetDate: dateStr,
          type: 'out',
          timestamp: `${dateStr}T${convertTo24h(data.clockOut)}:00`,
          workDuration: (data.hours || 8) * 60,
        };
        await api.put('/admin/attendance/override', outPayload);
      }
    } else {
      // Delete all logs for that day
      await api.put('/admin/attendance/override', { ...payload, type: 'delete' });
    }

    return { date: dateStr, status: data.status, clockIn: data.clockIn, clockOut: data.clockOut, hours: data.hours };
  },
};

/** Convert 12h time (e.g. "09:15 AM") to 24h (e.g. "09:15") */
function convertTo24h(timeStr) {
  if (!timeStr) return '09:00';
  // Already 24h format (e.g. "09:00")
  if (!timeStr.match(/[AP]M/i)) return timeStr;

  const [time, period] = timeStr.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period?.toUpperCase() === 'PM' && h !== 12) h += 12;
  if (period?.toUpperCase() === 'AM' && h === 12) h = 0;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export default attendanceService;
