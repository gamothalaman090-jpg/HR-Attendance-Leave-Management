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
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      family: 4,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
