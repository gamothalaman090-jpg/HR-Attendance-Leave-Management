/**
 * Name: Attendance.js
 * Purpose: Defines the structure and behavior of attendance documents in the database.
 * Dependencies: mongoose
 * Author: Ian
 * Location: server/models/Attendance.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-21
 */

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // 📅 Added for straightforward single-day calendar queries
    date: {
        type: String, // Stored as "YYYY-MM-DD"
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    type: {
        type: String,
        enum: ['in', 'out'],
        required: true
    },
    workDuration: {
        type: Number,
        default: null
    }
}, {
    timestamps: true
});


attendanceSchema.index({ user: 1, date: 1 });
attendanceSchema.index({ user: 1, timestamp: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);