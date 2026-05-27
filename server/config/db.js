/**
 * Name: db.js
 * Purpose: Configures the MongoDB connection.
 * Dependencies: mongoose
 * Author: Ian
 * Location: server/config/db.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-15
 */

const mongoose = require('mongoose');

// Conditionally apply DNS server configuration for local development (not on Vercel)
if (!process.env.VERCEL) {
  try {
    const dns = require('dns');
    dns.setDefaultResultOrder('ipv4first');
    dns.setServers(['8.8.8.8', '8.8.4.4']);
    console.log('Local environment: DNS servers configured to Google Public DNS.');
  } catch (err) {
    console.warn('Warning: Could not set custom DNS servers:', err.message);
  }
}


let cachedConnection = null;

const connectDB = async () => {
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  if (!process.env.MONGODB_URI) {
    console.error('CRITICAL ERROR: MONGODB_URI is not defined in environment variables!');
    return;
  }
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
    });
    cachedConnection = conn;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    console.error(`MongoDB Connection Error: ${err.message}`);
    // Do not call process.exit(1) in production/serverless environments as it crashes Vercel's wrapper.
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
