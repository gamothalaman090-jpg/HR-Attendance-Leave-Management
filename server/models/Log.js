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
    enum: ['SYSTEM', 'AUTH', 'SECURITY', 'PAYROLL', 'DATABASE', 'API', 'ATTENDANCE', 'LEAVE'],
    default: 'SYSTEM',
    required: true,
  },
  actionType: {
    type: String,
    enum: [
      'attendance_in', 'attendance_out', 'leave_request', 'leave_review',
      'profile_update', 'auth_login', 'auth_failure', 'system_cron',
      'db_telemetry', 'payroll_generate', 'payroll_release', 'payroll_delete',
      'announcement_create', 'announcement_delete', 'attendance_override',
      'team_create',
    ],
    required: true,
  },
  description: { type: String, required: true },
  ipAddress:   { type: String, default: 'Unknown' },
  company:     { type: String, required: true, default: 'Default Company' },
}, {
  timestamps: true,
});

// FIX: Replace single createdAt index with compound indexes
// that match actual query patterns from LogsPage.
//
// Covers: superadmin filtering by company + time range
logSchema.index({ company: 1, createdAt: -1 });
logSchema.index({ company: 1, level: 1, createdAt: -1 });
logSchema.index({ company: 1, module: 1, createdAt: -1 });
logSchema.index({ user: 1, createdAt: -1 });
// ─────────────────────────────────────────────

module.exports = mongoose.model('Log', logSchema);