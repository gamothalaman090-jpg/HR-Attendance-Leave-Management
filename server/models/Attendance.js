/**
 * Name: Attendance.js
 * Purpose: Defines the structure and behavior of attendance documents in the database.
 * Dependencies: mongoose
 * Author: Ian
 * Location: server/models/Attendance.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-15
 */

const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
        // location: String Optional: can be used for geotagging attendance
}, {
    timestamps: true
});

module.exports = mongoose.model('Attendance', attendanceSchema);