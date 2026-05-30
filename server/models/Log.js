/**
 * Name: Log.js
 * PHASE 3 FIX: Added all missing actionType enum values.
 *
 * THE BUG:
 * adminController.js calls createAuditLog() with these actionTypes:
 *   'payroll_generate', 'payroll_release', 'payroll_delete',
 *   'announcement_create', 'announcement_delete',
 *   'attendance_override', 'team_create', 'leave_review'
 *
 * userController.js calls:
 *   'attendance_in', 'attendance_out', 'leave_request'
 *
 * NONE of 'payroll_generate', 'payroll_release', 'payroll_delete',
 * 'announcement_create', 'announcement_delete', 'attendance_override',
 * 'team_create', 'leave_review' were in the enum!
 *
 * Mongoose validates the enum on save and throws a ValidationError.
 * logger.js catches it silently — so all payroll, announcement, and
 * attendance-override audit logs were SILENTLY FAILING and never stored.
 *
 * Also fixed: added missing indexes from Phase 2 that weren't applied yet.
 */

const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  level: {
    type: String,
    enum: ['INFO', 'WARN', 'ERROR', 'DEBUG'],
    default: 'INFO',
    required: true,
  },
  module: {
    type: String,
    // FIX: Added ATTENDANCE, LEAVE, PAYROLL modules
    // (were being used in controllers but missing from enum)
    enum: ['SYSTEM', 'AUTH', 'SECURITY', 'PAYROLL', 'DATABASE', 'API', 'ATTENDANCE', 'LEAVE'],
    default: 'SYSTEM',
    required: true,
  },
  actionType: {
    type: String,
    enum: [
      // Auth
      'auth_login',
      'auth_failure',

      // Attendance
      'attendance_in',
      'attendance_out',
      'attendance_override',     // FIX: WAS MISSING — adminController uses this

      // Leave
      'leave_request',
      'leave_review',            // FIX: WAS MISSING — adminController uses this

      // Profile
      'profile_update',

      // Announcements
      'announcement_create',     // FIX: WAS MISSING — adminController uses this
      'announcement_delete',     // FIX: WAS MISSING — adminController uses this

      // Payroll
      'payroll_generate',        // FIX: WAS MISSING — adminController uses this
      'payroll_release',         // FIX: WAS MISSING — adminController uses this
      'payroll_delete',          // FIX: WAS MISSING — adminController uses this

      // Team / Onboarding
      'team_create',             // FIX: WAS MISSING — adminController uses this

      // System
      'system_cron',
      'db_telemetry',
    ],
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  ipAddress: {
    type: String,
    default: 'Unknown',
  },
  company: {
    type: String,
    required: true,
    default: 'Default Company',
  },
}, {
  timestamps: true,
});

// Compound indexes for efficient superadmin log queries
logSchema.index({ company: 1, createdAt: -1 });
logSchema.index({ company: 1, level: 1, createdAt: -1 });
logSchema.index({ company: 1, module: 1, createdAt: -1 });
logSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Log', logSchema);
