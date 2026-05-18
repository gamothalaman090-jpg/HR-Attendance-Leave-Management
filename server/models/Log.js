/**
 * Name: Log.js
 * Purpose: Schema for tracking global user actions (attendance, leaves, profile updates) for Superadmin auditing.
 * Dependencies: mongoose
 * Author: Ian
 * Location: server/models/Log.js
 * Created: 2026-05-18
 */

const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    actionType: {
        type: String,
        enum: ['attendance_in', 'attendance_out', 'leave_request', 'leave_review', 'profile_update'],
        required: true
    },
    description: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Log', logSchema);