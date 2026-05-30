

const cron = require('node-cron');
const Leave = require('../models/Leave');
const { createAuditLog } = require('../utils/logger');

/**
 * Run the expired-leave cleanup job.
 * Can also be called manually via POST /api/admin/cron/expire-leaves (superadmin only).
 */
const runExpiredLeaveCleanup = async () => {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const result = await Leave.updateMany(
            {
                status: 'pending',
                startDate: { $lt: today },
            },
            {
                $set: { status: 'declined' },
            }
        );

        if (result.modifiedCount > 0) {
            console.log(`[CRON] Auto-declined ${result.modifiedCount} expired leave request(s) at ${new Date().toISOString()}`);

            // Log to audit trail without a specific user (system action)
            await createAuditLog(
                null,                // No user — this is a system action
                'system_cron',
                `Auto-declined ${result.modifiedCount} expired pending leave request(s).`,
                { ip: '127.0.0.1', method: 'CRON', originalUrl: '/cron/expire-leaves' },
                'INFO',
                'SYSTEM'
            );
        }
    } catch (err) {
        console.error('[CRON] Expired leave cleanup failed:', err.message);
    }
};

// Schedule: runs daily at 00:05 AM server time
// '5 0 * * *' = minute 5, hour 0, every day, every month, every weekday
cron.schedule('5 0 * * *', runExpiredLeaveCleanup, {
    timezone: 'Asia/Manila', // ← Change to your server timezone
});

console.log('[CRON] Expired leave cleanup job scheduled for 00:05 daily.');

module.exports = { runExpiredLeaveCleanup };