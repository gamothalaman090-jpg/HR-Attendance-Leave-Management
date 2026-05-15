/**
 * Attendance Service — Mock clock in/out and attendance records.
 */
import { ATTENDANCE_RECORDS, getAttendanceSummary, WEEKLY_ATTENDANCE } from '@/data/attendance';
import { sleep } from '@/utils/helpers';

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
};

export default attendanceService;
