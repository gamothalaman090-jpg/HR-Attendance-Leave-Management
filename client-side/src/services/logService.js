import { sleep } from '@/utils/helpers';

const STORAGE_KEY = 'nini-system-logs';

const DEFAULT_LOGS = [
  { timestamp: new Date(Date.now() - 3600000 * 4).toISOString(), level: 'INFO', category: 'SYSTEM', message: 'Database connection established successfully. Pool size: 20.' },
  { timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(), level: 'INFO', category: 'AUTH', message: 'User admin@nini.io successfully authenticated from 192.168.1.1.' },
  { timestamp: new Date(Date.now() - 3600000 * 3.1).toISOString(), level: 'WARN', category: 'SECURITY', message: 'Multiple login failures detected for user guest@nini.io from IP 74.125.19.147.' },
  { timestamp: new Date(Date.now() - 3600000 * 2.8).toISOString(), level: 'INFO', category: 'PAYROLL', message: 'Cron job: Payroll calculation engine initialized for Period: MAY-2026.' },
  { timestamp: new Date(Date.now() - 3600000 * 2.2).toISOString(), level: 'DEBUG', category: 'DATABASE', message: 'Query optimization executed: index idx_employee_email re-indexed.' },
  { timestamp: new Date(Date.now() - 3600000 * 1.5).toISOString(), level: 'ERROR', category: 'API', message: 'Failed to dispatch webhook to endpoint https://hooks.slack.com/services/T000/B000: Connection timeout.' },
];

const getStoredLogs = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_LOGS));
  return DEFAULT_LOGS;
};

export const logService = {
  async getLogs() {
    await sleep(200);
    return getStoredLogs();
  },

  async logEvent(level, category, message) {
    const logs = getStoredLogs();
    const newLog = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
    };
    logs.unshift(newLog);
    if (logs.length > 500) logs.pop(); // keep last 500 logs
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    return newLog;
  },

  async getMetrics() {
    // Generate simulated server telemetry
    return {
      cpu: Math.floor(Math.random() * 20) + 15, // 15% - 35%
      memory: Math.floor(Math.random() * 10) + 52, // 52% - 62%
      disk: 44, // Static 44% usage
      networkLoad: Math.floor(Math.random() * 150) + 50, // 50-200 Mbps
      activeUsers: Math.floor(Math.random() * 5) + 8, // 8-13 active
    };
  }
};

export default logService;
