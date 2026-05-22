/**
 * Name: server.js
 * Purpose: Initializes the Express app and sets up middleware and routes.
 * Dependencies: express, dotenv, cors, morgan, connectDB, routes, express-rate-limit
 * Author: Ian
 * Location: server/server.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-22
 */

const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const routes = require('./routes/index');
const { cloudinary } = require('./config/cloudinary');

// Import rate limiting middlewares
const { globalLimiter, authLimiter } = require('./middlewares/rateLimiter');

// Connect to Database
connectDB();

// --- CLOUDINARY CONNECTION CHECK ---
cloudinary.api.ping()
  .then((result) => {
    console.log(`Cloudinary Connected: Environment active (${result.status})`);
  })
  .catch((err) => {
    console.error('Cloudinary Connection Error! Check your keys in .env:');
    console.error(`-> ${err.message}`);
  });

const app = express();

// --- REVERSE PROXY CONFIGURATION ---
// Tells Express to trust forwarding headers (like X-Forwarded-For) from proxies like Nginx/Render/Heroku.
// Crucial so the rate limiter tracks the REAL user's IP instead of the proxy server's internal loopback IP.
app.set('trust proxy', 1);

// --- GLOBAL MIDDLEWARES ---
app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// --- RATE LIMITING INTERCEPTORS ---
// 1. Protect all endpoints globally (Max 100 requests every 15 minutes)
app.use('/api', globalLimiter);

// 2. Add extra protection layer to authentication routes to stop brute-force attacks
app.use('/api/auth', authLimiter);

// --- HEALTH CHECK ---
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'active',
    service: 'HR-Attendance-Leave-Management-API',
    time: new Date().toLocaleString(),
    uptime: `${Math.floor(process.uptime())}s`
  });
});

// --- API ROUTES ---
app.use('/api', routes);

// --- ERROR HANDLING ---
app.use((req, res, next) => {
  res.status(404).json({ message: `Route not found - ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});