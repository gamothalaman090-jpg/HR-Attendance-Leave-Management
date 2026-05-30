/**
 * Name: server.js
 * Purpose: Initializes the Express app and sets up middleware and routes.
 * PHASE 1 FIXES:
 *   - Added helmet for HTTP security headers
 *   - Replaced open cors() with strict origin whitelist
 *   - Morgan now runs in all envs (structured in prod, dev-pretty in dev)
 */

const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
const helmet = require('helmet');       // FIX: Added — sets 14 security headers automatically
const morgan = require('morgan');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const routes = require('./routes/index');
const { cloudinary } = require('./config/cloudinary');
const { globalLimiter, authLimiter } = require('./middlewares/rateLimiter');

// Connect to Database
connectDB();

// Cloudinary connection check
cloudinary.api.ping()
  .then((result) => console.log(`Cloudinary Connected: ${result.status}`))
  .catch((err) => console.error('Cloudinary Connection Error:', err.message));

const app = express();

// --- REVERSE PROXY ---
app.set('trust proxy', 1);

// ─────────────────────────────────────────────
// FIX 1: HELMET — Security headers
// Sets X-Frame-Options, X-XSS-Protection, Strict-Transport-Security,
// Content-Security-Policy, and 10+ others in one call.
// ─────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow Cloudinary image URLs
}));

// ─────────────────────────────────────────────
// FIX 2: CORS — Strict origin whitelist
// BEFORE: app.use(cors())  ← allowed ALL origins (any site could call your API)
// AFTER:  Only your known frontends are allowed
// ─────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .concat(
    (process.env.SUPERADMIN_ORIGIN || 'http://localhost:5174')
      .split(',')
      .map(o => o.trim().replace(/\/$/, ''))
  );

app.use(cors({
  origin: (origin, callback) => {
    // 1. Allow server-to-server calls (no origin)
    if (!origin) {
      return callback(null, true);
    }

    // 2. Normalize origin by stripping any trailing slash
    const normalizedOrigin = origin.trim().replace(/\/$/, '');

    // 3. Match explicit list
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    // 4. Match Vercel domains for this project (e.g. production and preview branch URLs)
    const isVercelOrigin = /^https:\/\/hr-attendance-leave-management.*\.vercel\.app$/.test(normalizedOrigin);
    if (isVercelOrigin) {
      return callback(null, true);
    }

    // 5. Block other origins (by returning false instead of throwing a server-side Error)
    return callback(null, false);
  },
  credentials: true,           // Required for httpOnly cookie auth (future refresh token)
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsers
app.use(express.json({ limit: '1mb' }));      // Limit payload size
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─────────────────────────────────────────────
// FIX 3: MORGAN — Log in all environments
// BEFORE: Only logged in development (blind in production)
// AFTER:  'combined' format (Apache-style) in prod for log aggregators,
//         'dev' format locally
// ─────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// DB ready-check for serverless
app.use('/api', async (req, res, next) => {
  try {
    if (mongoose.connection.readyState !== 1) await connectDB();
    next();
  } catch (err) {
    res.status(503).json({ success: false, message: 'Database unavailable. Please retry.' });
  }
});

// Rate limiting
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

// ─── Health & Root ───────────────────────────
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

// API Routes
app.use('/api', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Global error handler
app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  // Never leak stack traces to clients in production
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 8000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
