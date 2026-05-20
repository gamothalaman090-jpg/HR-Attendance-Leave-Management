/**
 * Attendance Service — Mock clock in/out and attendance records.
 */
import { ATTENDANCE_RECORDS, getAttendanceSummary, WEEKLY_ATTENDANCE } from '@/data/attendance';
import { sleep } from '@/utils/helpers';
import { employeeService } from './employeeService';

const ALL_STORAGE_KEY = 'nini-attendance-all';

const seedAllEmployeesAttendance = async () => {
  const employees = await employeeService.getAll();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const seededRecords = {};

  employees.forEach(emp => {
    seededRecords[emp.id] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split('T')[0];
      const dayOfWeek = date.getDay();
      const isFuture = date > today;

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        seededRecords[emp.id].push({
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

      if (isFuture) {
        seededRecords[emp.id].push({
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

      const rand = Math.random();
      let status, clockIn, clockOut, hours;

      if (day === 1 || day === 15) {
        status = 'holiday';
        clockIn = null;
        clockOut = null;
        hours = 0;
      } else if (rand < 0.05) {
        status = 'absent';
        clockIn = null;
        clockOut = null;
        hours = 0;
      } else if (rand < 0.08) {
        status = 'leave';
        clockIn = null;
        clockOut = null;
        hours = 0;
      } else if (rand < 0.15) {
        const lateMins = Math.floor(Math.random() * 30) + 15;
        clockIn = `09:${String(lateMins).padStart(2, '0')}`;
        clockOut = `18:${String(Math.floor(Math.random() * 20)).padStart(2, '0')}`;
        hours = 8;
        status = 'late';
      } else {
        const inMin = Math.floor(Math.random() * 15);
        clockIn = `08:${String(45 + inMin).padStart(2, '0')}`;
        clockOut = `17:${String(30 + Math.floor(Math.random() * 15)).padStart(2, '0')}`;
        hours = 8.5;
        status = 'present';
      }

      seededRecords[emp.id].push({
        date: dateStr,
        day,
        dayOfWeek,
        status,
        clockIn,
        clockOut,
        hours,
      });
    }
  });

  localStorage.setItem(ALL_STORAGE_KEY, JSON.stringify(seededRecords));
  return seededRecords;
};

const getStoredAllAttendance = async () => {
  const stored = localStorage.getItem(ALL_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return await seedAllEmployeesAttendance();
};

let clockStatus = {
  isClockedIn: false,
  clockInTime: null,
  clockOutTime: null,
};

export const attendanceService = {
  /** Get attendance records for the current month */
  async getMonthly() {
    await sleep(400);
    return [...ATTENDANCE_RECORDS];
  },

  /** Get attendance summary stats */
  async getSummary() {
    await sleep(200);
    return getAttendanceSummary();
  },

  /** Get weekly attendance data for charts */
  async getWeekly() {
    await sleep(200);
    return [...WEEKLY_ATTENDANCE];
  },

  /** Clock in */
  async clockIn() {
    await sleep(500);
    const now = new Date();
    clockStatus = {
      isClockedIn: true,
      clockInTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      clockOutTime: null,
    };
    return { ...clockStatus };
  },

  /** Clock out */
  async clockOut() {
    await sleep(500);
    const now = new Date();
    clockStatus = {
      ...clockStatus,
      isClockedIn: false,
      clockOutTime: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    };
    return { ...clockStatus };
  },

  /** Get current clock status */
  async getClockStatus() {
    await sleep(100);
    return { ...clockStatus };
  },

  /** Get attendance records for all employees */
  async getAllEmployeesAttendance() {
    await sleep(400);
    return getStoredAllAttendance();
  },

  /** Adjust/override attendance record for a specific employee and date */
  async adjustAttendance({ employeeId, dateStr, data }) {
    await sleep(400);
    const allRecords = await getStoredAllAttendance();
    if (!allRecords[employeeId]) {
      allRecords[employeeId] = [];
    }

    const empRecs = allRecords[employeeId];
    const index = empRecs.findIndex(r => r.date === dateStr);
    const dateObj = new Date(dateStr);
    const newRecord = {
      date: dateStr,
      day: dateObj.getDate(),
      dayOfWeek: dateObj.getDay(),
      status: data.status,
      clockIn: ['present', 'late', 'half-day'].includes(data.status) ? data.clockIn : null,
      clockOut: ['present', 'late', 'half-day'].includes(data.status) ? data.clockOut : null,
      hours: ['present', 'late', 'half-day'].includes(data.status) ? Number(data.hours) : 0,
    };

    if (index !== -1) {
      empRecs[index] = newRecord;
    } else {
      empRecs.push(newRecord);
    }

    localStorage.setItem(ALL_STORAGE_KEY, JSON.stringify(allRecords));
    return newRecord;
  }
};

export default attendanceService;
