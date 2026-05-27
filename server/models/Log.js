/**
 * Name: Log.js
 * Purpose: Schema for tracking global user actions and core system telemetry logs for Superadmin auditing.
 * Dependencies: mongoose
 * Author: Ian
 * Location: server/models/Log.js
 * Created: 2026-05-18
 * Last Updated: 2026-05-23
 */

const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false 
    },
    level: {
        type: String,
        enum: ['INFO', 'WARN', 'ERROR', 'DEBUG'],
        default: 'INFO',
        required: true
    },
    module: {
        type: String,
        enum: ['SYSTEM', 'AUTH', 'SECURITY', 'PAYROLL', 'DATABASE', 'API'],
        default: 'SYSTEM',
        required: true
    },
    actionType: {
        type: String,
        enum: [
            'attendance_in', 
            'attendance_out', 
            'leave_request', 
            'leave_review', 
            'profile_update',
            'auth_login',      // Added for UI mapping
            'auth_failure',    // Added for UI mapping
            'system_cron',     // Added for UI mapping
            'db_telemetry'     // Added for UI mapping
        ],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String,
        default: 'Unknown'
    },
    company: {
        type: String,
        required: true,
        default: 'Default Company'
    }
}, {
    timestamps: true
});

logSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Log', logSchema);