/**
 * Name: errorHandler.js
 * Purpose: Centralised Express error-handling middleware.
 * PHASE 3 — NEW FILE
 *
 * REPLACES: The inline error handler at the bottom of server.js
 *
 * HANDLES:
 *   Mongoose CastError     → 404 "Resource not found" (invalid ObjectId)
 *   Mongoose ValidationError → 422 with field-level messages
 *   MongoDB duplicate key  → 409 "already exists"
 *   JWT TokenExpiredError  → 401 "Session expired, please log in again"
 *   JWT JsonWebTokenError  → 401 "Invalid token"
 *   AppError (operational) → uses err.statusCode set by the controller
 *   Anything else          → 500 "Internal Server Error" (never leaks details in prod)
 *
 * HOW TO USE IN server.js:
 *   const { notFound, globalErrorHandler } = require('./middlewares/errorHandler');
 *   app.use(notFound);
 *   app.use(globalErrorHandler);
 */

const AppError = require('../utils/AppError');

// ─── Mongoose CastError → 404 ────────────────────────────────────────────────
// Happens when an invalid ObjectId is passed: GET /api/admin/users/not-an-id
const handleCastError = (err) => {
  const message = `Resource not found (invalid ID format: ${err.value})`;
  return new AppError(message, 404);
};

// ─── Mongoose ValidationError → 422 ──────────────────────────────────────────
// Happens when a required field is missing or a type constraint fails
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((e) => ({
    field: e.path,
    message: e.message,
  }));
  return new AppError('Validation failed', 422, errors);
};

// ─── MongoDB Duplicate Key → 409 ─────────────────────────────────────────────
// Happens when a unique index constraint is violated (e.g. duplicate email)
const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue || {})[0] || 'field';
  const value = err.keyValue?.[field] || '';
  const message = `${field.charAt(0).toUpperCase() + field.slice(1)} "${value}" is already registered`;
  return new AppError(message, 409);
};

// ─── JWT TokenExpiredError → 401 ──────────────────────────────────────────────
const handleJWTExpired = () =>
  new AppError('Your session has expired. Please log in again.', 401);

// ─── JWT JsonWebTokenError → 401 ──────────────────────────────────────────────
const handleJWTInvalid = () =>
  new AppError('Invalid authentication token. Please log in again.', 401);

// ─── 404 Not Found ────────────────────────────────────────────────────────────
exports.notFound = (req, res, _next) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
};

// ─── Global Error Handler ─────────────────────────────────────────────────────
exports.globalErrorHandler = (err, req, res, _next) => {
  const isProd = process.env.NODE_ENV === 'production';

  // Translate known Mongoose / JWT errors into AppErrors
  let error = err;
  if (err.name === 'CastError')             error = handleCastError(err);
  if (err.name === 'ValidationError')       error = handleValidationError(err);
  if (err.code === 11000)                   error = handleDuplicateKey(err);
  if (err.name === 'TokenExpiredError')     error = handleJWTExpired();
  if (err.name === 'JsonWebTokenError')     error = handleJWTInvalid();

  const statusCode = error.statusCode || 500;
  const message    = error.message    || 'Internal Server Error';

  // ─── Always log to server console (structured) ───────────────────────────
  const logPayload = {
    method:  req.method,
    url:     req.originalUrl,
    status:  statusCode,
    message,
    user:    req.user?.id || 'anonymous',
    company: req.user?.company || 'unknown',
    ...(isProd ? {} : { stack: err.stack }),
  };

  if (statusCode >= 500) {
    console.error('[ERROR]', JSON.stringify(logPayload));
  } else {
    console.warn('[WARN]', JSON.stringify(logPayload));
  }

  // ─── Response to client ────────────────────────────────────────────────────
  const body = {
    success: false,
    message,
    ...(error.errors ? { errors: error.errors } : {}),
    // Only include stack trace in development — NEVER in production
    ...(!isProd && { stack: err.stack }),
  };

  return res.status(statusCode).json(body);
};
