import api from './api';

/**
 * logService — Active logging service for Superadmin dashboard.
 * Connects to /superadmin/logs.
 */
export const logService = {
  /** Get system audit logs from the database */
  async getLogs() {
    try {
      const { data: res } = await api.get('/superadmin/logs');
      return (res.data || []).map((log) => ({
        timestamp: log.timestamp || new Date().toISOString(),
        level: log.level || 'INFO',
        category: log.module || 'SYSTEM',
        message: log.rawLine || '',
      }));
    } catch (err) {
      console.error('Failed to fetch system logs:', err);
      return [];
    }
  },

  /** Log dynamic events (audit trail is automatically updated on the server) */
  async logEvent(level, category, message) {
    console.log(`[Superadmin Event] [${level}] [${category}] ${message}`);
    return {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
    };
  },

  /** Clear logs — disabled/restricted in production audit system */
  async clearLogs() {
    return true;
  },

  /** Get system hardware status metrics (simulated/dynamic console values) */
  async getMetrics() {
    return {
      cpu: Math.floor(Math.random() * 15) + 20,
      memory: Math.floor(Math.random() * 8) + 55,
      disk: 42,
      networkLoad: Math.floor(Math.random() * 100) + 60,
      activeUsers: Math.floor(Math.random() * 4) + 6,
    };
  },
};

export default logService;
