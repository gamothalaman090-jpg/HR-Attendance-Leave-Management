/**
 * Name: logger.js
 * PHASE 3 FIXES:
 *
 *   FIX 1: Added Winston structured logger for server-side application logs.
 *          Previously all errors went to console.error (unstructured, hard to search in prod).
 *          Winston writes JSON logs to rotating daily files + console.
 *
 *   FIX 2: Slow DB lookup path removed.
 *          BEFORE: When req.user.company wasn't available, createAuditLog() ran
 *          User.findById(userId) — an extra DB round trip on every CRON job log call.
 *          AFTER: company defaults to 'Default Company' without a DB hit.
 *          If you need the company, pass it via req.user (always available in protected routes).
 */

const Log = require('../models/Log');

// ─────────────────────────────────────────────
// Winston structured logger
// Writes to: logs/combined.log (all levels) + logs/error.log (ERROR only)
// Console output: JSON in production, colorized in development
// ─────────────────────────────────────────────
let winston;
let appLogger;

try {
  winston = require('winston');

  const { combine, timestamp, json, colorize, simple } = winston.format;
  const isProd = process.env.NODE_ENV === 'production';

  appLogger = winston.createLogger({
    level: isProd ? 'info' : 'debug',
    format: combine(timestamp(), json()),
    defaultMeta: { service: 'hr-api' },
    transports: [
      // All levels → combined.log
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5 * 1024 * 1024,  // 5MB per file
        maxFiles: 7,                // Keep 7 days
        tailable: true,
      }),
      // ERROR only → error.log
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5 * 1024 * 1024,
        maxFiles: 14,
        tailable: true,
      }),
      // Console: pretty in dev, JSON in prod
      new winston.transports.Console({
        format: isProd ? combine(timestamp(), json()) : combine(colorize(), simple()),
      }),
    ],
  });
} catch (_e) {
  // Winston not installed yet — fall back to console
  appLogger = {
    info:  (...a) => console.log('[INFO]',  ...a),
    warn:  (...a) => console.warn('[WARN]',  ...a),
    error: (...a) => console.error('[ERROR]', ...a),
    debug: (...a) => console.log('[DEBUG]', ...a),
  };
}

exports.logger = appLogger;

// ─────────────────────────────────────────────
// createAuditLog — MongoDB audit trail entry
//
// @param {ObjectId|null} userId     - User performing the action (null for CRON/system)
// @param {string}        actionType - Must match Log.actionType enum exactly
// @param {string}        description
// @param {Request|object|null} req  - Express request (or {ip, method, originalUrl} for CRON)
// @param {string}        level      - INFO | WARN | ERROR | DEBUG
// @param {string}        moduleName - SYSTEM | AUTH | SECURITY | PAYROLL | etc.
// @param {string}        [company]  - Override company name (useful when req.user isn't set)
// ─────────────────────────────────────────────
exports.createAuditLog = async (
  userId,
  actionType,
  description,
  req = null,
  level = 'INFO',
  moduleName = 'SYSTEM',
  company = null,
) => {
  try {
    let ipAddress = 'Unknown';
    if (req) {
      ipAddress =
        req.headers?.['x-forwarded-for']?.split(',')[0].trim() ||
        req.socket?.remoteAddress ||
        'Unknown';
    }

    // ─────────────────────────────────────────────
    // FIX: Removed the extra User.findById() lookup.
    //
    // BEFORE: If req.user.company wasn't set, it ran User.findById(userId)
    //   → 1 extra DB round trip on every CRON job audit log call
    //
    // AFTER: company is sourced from (in priority order):
    //   1. explicit company param (for CRON jobs, pass it directly)
    //   2. req.user.company (always set in protected routes)
    //   3. 'Default Company' (safe fallback, no DB hit)
    // ─────────────────────────────────────────────
    const resolvedCompany =
      company ||
      req?.user?.company ||
      'Default Company';

    await Log.create({
      user:        userId || null,
      actionType,
      description,
      ipAddress,
      level:       level.toUpperCase(),
      module:      moduleName.toUpperCase(),
      company:     resolvedCompany,
    });
  } catch (err) {
    // Never let audit logging crash the main operation
    appLogger.error('Audit logger failed', {
      error:      err.message,
      actionType,
      userId:     userId?.toString(),
    });
  }
};
