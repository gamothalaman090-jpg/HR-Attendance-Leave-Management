/**
 * Name: Leave.js
 * Purpose: Defines the structure and behavior of leave documents in the database.
 * Dependencies: mongoose
 * Author: Ian
 * Location: server/models/Leave.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-17
 */

const mongoose = require('mongoose');

const LeaveSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    leaveType: {
        type: String,
        required: [true, 'Please select a leave type'],
        enum: ['annual', 'sick', 'personal'],
    },
    startDate: {
        type: Date,
        required: [true, 'Please provide a start date']
    },
    endDate: {
        type: Date,
        required: [true, 'Please provide an end date']
    },
    reason: {
        type: String,
        required: [true, 'Please provide a brief reason'],
        maxlength: [500, 'Reason cannot be more than 500 characters']
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'declined'],
        default: 'pending'
    }
}, { timestamps: true });

module.exports = mongoose.model('Leave', LeaveSchema);