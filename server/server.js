/**
 * Name: server.js
 * Purpose: Initializes the Express app and sets up middleware and routes.
 * Dependencies: express, dotenv, cors, morgan, connectDB, routes, express-rate-limit
 * Author: Ian
 * Location: server/server.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-26
 */

const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const routes = require('./routes/index');
const { cloudinary } = require('./config/cloudinary');
const { globalLimiter, authLimiter } = require('./middlewares/rateLimiter');

const app = express();

// --- REVERSE PROXY CONFIGURATION ---
app.set('trust proxy', 1);

// --- GLOBAL MIDDLEWARES ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --- RATE LIMITING ---
app.use('/api', globalLimiter);
app.use('/api/auth', authLimiter);

// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'active',
    service: 'HR-Attendance-Leave-Management-API',
    time: new Date().toLocaleString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// --- API ROUTES ---
app.use('/api', routes);

// --- 404 HANDLER ---
app.use((req, res) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

// --- GLOBAL ERROR HANDLER ---
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

// --- BOOTSTRAP ---
const bootstrap = async () => {
  // 1. Connect to MongoDB first — cached for serverless warm invocations
  await connectDB();

  // 2. Check Cloudinary
  cloudinary.api.ping()
    .then((result) => {
      console.log(`Cloudinary Connected: Environment active (${result.status})`);
    })
    .catch((err) => {
      console.error('Cloudinary Connection Error:', err.message);
    });

  // 3. Start server only in non-serverless environments
  if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });

    process.on('unhandledRejection', (err) => {
      console.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });
  }
};

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err.message);
});

// Export app for Vercel serverless handler
module.exports = app;