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

const TeamSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

const DepartmentSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, trim: true },
    // Nested array of teams belonging strictly to this department
    teams: [TeamSchema] 
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);