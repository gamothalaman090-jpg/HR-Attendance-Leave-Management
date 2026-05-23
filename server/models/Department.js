/**
 * Name: Department.js
 * Purpose: Defines the structure of department documents in the database.
 * Dependencies: mongoose
 * Author: Ian
 * Location: server/models/Department.js
 * Created: 2026-05-23
 * Last Updated: 2026-05-23
 */

const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a department name'],
        trim: true
    },
    company: {
        type: String,
        required: [true, 'Please provide a company name'],
        default: 'Default Company',
        trim: true
    }
}, {
    timestamps: true
});

// Unique department name per company
departmentSchema.index({ name: 1, company: 1 }, { unique: true });

module.exports = mongoose.model('Department', departmentSchema);
