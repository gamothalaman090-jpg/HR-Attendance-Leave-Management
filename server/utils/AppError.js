/**
 * Name: AppError.js
 * Purpose: Custom error class that carries an HTTP status code.
 * PHASE 3 — NEW FILE
 *
 * WHY THIS EXISTS:
 * Previously all controllers threw plain `new Error('message')`.
 * The global error handler had no status code, so it always returned 500
 * even for client mistakes (bad input, missing record, wrong role).
 *
 * Now controllers throw:
 *   throw new AppError('Employee not found', 404);
 *   throw new AppError('Invalid leave type', 400);
 *
 * And the error handler reads err.statusCode instead of always defaulting to 500.
 *
 * Usage:
 *   const AppError = require('../utils/AppError');
 *   throw new AppError('Not found', 404);
 *   next(new AppError('Unauthorized', 403));
 */

class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // Marks this as an operational error (expected, not a bug)
    // vs a programming error (unexpected) — important for the global handler
    this.isOperational = true;

    // Capture stack trace but exclude this constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
