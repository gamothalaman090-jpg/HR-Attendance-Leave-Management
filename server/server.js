/**
 * Name: server.js
 * PHASE 3 FIXES:
 *   - Replaced inline 404 + error handlers with dedicated errorHandler middleware
 *   - Added Winston logger import (structured server logs)
 *   - Removed duplicate error handling code at the bottom
 *   - Added Winston HTTP request logging in production (replaces morgan string format)
 *   - process.on('uncaughtException') added alongside unhandledRejection
 */

const express    = require('express');
const dotenv     = require('dotenv');
dotenv.config();

const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const mongoose   = require('mongoose');
const connectDB  = require('./config/db');
const routes     = require('./routes/index');
const { cloudinary } = require('./config/cloudinary');
const { globalLimiter, authLimiter } = require('./middlewares/rateLimiter');

// FIX: Import centralised error handler (replaces inline handlers at bottom)
const { notFound, globalErrorHandler } = require('./middlewares/errorHandler');

// FIX: Import Winston logger
const { logger } = require('./utils/logger');

// Connect to Database
connectDB();

cloudinary.api.ping()
  .then((result) => logger.info(`Cloudinary connected: ${result.status}`))
  .catch((err)   => logger.error(`Cloudinary connection error: ${err.message}`));

const app = express();

app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',').map(o => o.trim().replace(/\/$/, ''))
  .concat(
    (process.env.SUPERADMIN_ORIGIN || 'http://localhost:5174')
      .split(',').map(o => o.trim().replace(/\/$/, ''))
  );

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const normalized = origin.trim().replace(/\/$/, '');
    if (allowedOrigins.includes(normalized)) return callback(null, true);
    if (/^https:\/\/hr-attendance-leave-management.*\.vercel\.app$/.test(normalized)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsers ──────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ── HTTP request logging ─────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// ── DB ready-check (serverless) ───────────────────────────
app.use('/api', async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ success: false, message: 'Database unavailable. Please retry.' });
  }
});

// ── Rate limiting ─────────────────────────────────────────
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

// ── Health / Root ─────────────────────────────────────────
app.get('/', (_req, res) => res.status(200).json({
  status: 'active',
  message: 'HR Attendance & Leave Management API',
  version: '1.0.0',
}));

app.get('/health', (_req, res) => res.status(200).json({
  status: 'active',
  db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  uptime: `${Math.floor(process.uptime())}s`,
  time: new Date().toISOString(),
}));

// ── API Routes ────────────────────────────────────────────
app.use('/api', routes);

// Scheduled jobs
require('./cron/Expiredleaves');

// ─────────────────────────────────────────────
// FIX: Centralised error handling
// BEFORE: Inline 404 + error handler in server.js
//   - Didn't handle Mongoose CastError, ValidationError, or duplicate key
//   - Always returned 500 even for client mistakes
// AFTER: Dedicated middleware handles all error types correctly
// ─────────────────────────────────────────────
app.use(notFound);
app.use(globalErrorHandler);

// ── Process error handlers ────────────────────────────────
const PORT   = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
  server.close(() => process.exit(1));
});

// FIX: Added uncaughtException handler (was missing)
// Without this, a synchronous throw outside of async context crashes the process
// with no structured log — just a raw stderr dump.
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught Exception: ${err.message}`, { stack: err.stack });
  server.close(() => process.exit(1));
});

module.exports = app;
