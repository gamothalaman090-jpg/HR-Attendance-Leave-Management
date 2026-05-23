/**
 * Name: superadminController.js
 * Purpose: Handles superadmin-specific operations, including user management.
 * Dependencies: User Model
 * Author: Ian
 * Location: server/controllers/superadminController.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-15
 */


const User = require('../models/User');
const Log = require('../models/Log');

//Global System Logging
// Global System Logging - Formatted directly for the Superadmin Live Terminal Terminal
exports.getSystemLogs = async (req, res) => {
    try {
        const logs = await Log.find({})
            .populate('user', 'fullname email role')
            .sort({ createdAt: -1 })
            .limit(100); // Guardrail to prevent pulling thousands of logs at once

        // Map and format the array elements to match your exact console UI string layouts
        const formattedLogs = logs.map(log => {
            const timestamp = new Date(log.createdAt).toLocaleString();
            const level = log.level ? log.level.toUpperCase() : 'INFO';
            const moduleName = log.module ? log.module.toUpperCase() : 'SYSTEM';
            const companyName = log.company || 'Default Company';
            
            // Build the exact string line: "[5/22/2026, 10:04:34 AM] [INFO] [AUTH] [Default Company] User admin@nini.io..."
            return {
                _id: log._id,
                timestamp,
                level,
                module: moduleName,
                company: companyName,
                rawLine: `[${timestamp}] [${level}] [${moduleName}] [${companyName}] ${log.message}`
            };
        });

        res.status(200).json({
            success: true,
            count: logs.length,
            data: formattedLogs // Handing your React component a ready-to-render array
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { fullname, email, password, role, company } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const user = await User.create({
            fullname,
            email,
            password,
            role,
            company: company || 'Default Company'
        });

        res.status(201).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};


exports.getUsers = async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};


exports.updateUser = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({ success: true, data: user });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
};


exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};