/**
 * Mock Attendance Data
 * 
 * Attendance records for the current month, tied to the logged-in user.
 */

// Status types: present, absent, leave, holiday, half-day, late
const today = new Date();
const year = today.getFullYear();
const month = today.getMonth(); // 0-indexed

/**
 * Generate attendance records for the current month.
 */
function generateMonthlyAttendance() {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const records = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
    const dateStr = date.toISOString().split('T')[0];
    const isFuture = date > today;

    // Weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      records.push({
        date: dateStr,
        day,
        dayOfWeek,
        status: 'weekend',
        clockIn: null,
        clockOut: null,
        hours: 0,
      });
      continue;
    }

    // Future dates
    if (isFuture) {
      records.push({
        date: dateStr,
        day,
        dayOfWeek,
        status: 'upcoming',
        clockIn: null,
        clockOut: null,
        hours: 0,
      });
      continue;
    }

    // Simulate realistic patterns
    const rand = Math.random();
    let status, clockIn, clockOut, hours;

    if (day === 1 || day === 15) {
      // Holidays on 1st and 15th
      status = 'holiday';
      clockIn = null;
      clockOut = null;
      hours = 0;
    } else if (rand < 0.05) {
      // 5% absent
      status = 'absent';
      clockIn = null;
      clockOut = null;
      hours = 0;
    } else if (rand < 0.10) {
      // 5% on leave
      status = 'leave';
      clockIn = null;
      clockOut = null;
      hours = 0;
    } else if (rand < 0.18) {
      // 8% late
      const lateMinutes = Math.floor(Math.random() * 45) + 15;
      clockIn = `09:${String(lateMinutes).padStart(2, '0')}`;
      clockOut = `18:${String(Math.floor(Math.random() * 30)).padStart(2, '0')}`;
      hours = 8 + (Math.random() * 0.5);
      status = 'late';
    } else if (rand < 0.22) {
      // 4% half-day
      clockIn = '09:00';
      clockOut = '13:00';
      hours = 4;
      status = 'half-day';
    } else {
      // Normal present
      const inMinute = Math.floor(Math.random() * 15);
      const outMinute = Math.floor(Math.random() * 30);
      clockIn = `08:${String(45 + inMinute).padStart(2, '0')}`;
      clockOut = `17:${String(30 + outMinute).padStart(2, '0')}`;
      hours = 8 + (Math.random() * 1.5);
      status = 'present';
    }

    records.push({
      date: dateStr,
      day,
      dayOfWeek,
      status,
      clockIn,
      clockOut,
      hours: Math.round(hours * 10) / 10,
    });
  }

  return records;
}

export const ATTENDANCE_RECORDS = generateMonthlyAttendance();

/**
 * Attendance summary statistics for the current month.
 */
export function getAttendanceSummary(records = ATTENDANCE_RECORDS) {
  const workDays = records.filter(r => !['weekend', 'upcoming'].includes(r.status));
  const present = workDays.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'half-day');
  const absent = workDays.filter(r => r.status === 'absent');
  const onLeave = workDays.filter(r => r.status === 'leave');
  const holidays = workDays.filter(r => r.status === 'holiday');
  const late = workDays.filter(r => r.status === 'late');
  const totalHours = present.reduce((sum, r) => sum + r.hours, 0);

  return {
    totalWorkDays: workDays.length,
    presentDays: present.length,
    absentDays: absent.length,
    leaveDays: onLeave.length,
    holidays: holidays.length,
    lateDays: late.length,
    totalHours: Math.round(totalHours * 10) / 10,
    avgHoursPerDay: present.length ? Math.round((totalHours / present.length) * 10) / 10 : 0,
    attendanceRate: workDays.length > 0
      ? Math.round((present.length / (workDays.length - holidays.length - onLeave.length)) * 100)
      : 0,
  };
}

/**
 * Weekly attendance data for charts.
 */
export const WEEKLY_ATTENDANCE = [
  { day: 'Mon', hours: 8.5, target: 8 },
  { day: 'Tue', hours: 9.0, target: 8 },
  { day: 'Wed', hours: 7.5, target: 8 },
  { day: 'Thu', hours: 8.2, target: 8 },
  { day: 'Fri', hours: 8.0, target: 8 },
];

/**
 * Current clock status for the user.
 */
export const INITIAL_CLOCK_STATUS = {
  isClockedIn: false,
  clockInTime: null,
  clockOutTime: null,
  elapsed: 0,
};

export default ATTENDANCE_RECORDS;
