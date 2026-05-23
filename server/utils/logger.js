/**
 * Name: logger.js
 * Purpose: Global utility function to create structured audit logs in MongoDB.
 * Location: server/utils/logger.js
 * Author: Ian
 * Last Updated: 2026-05-23
 */

const Log = require('../models/Log');

exports.createAuditLog = async (userId, actionType, description, req = null, level = 'INFO', moduleName = 'SYSTEM') => {
    try {
        let ipAddress = 'Unknown';
        if (req) {
            // Check for reverse proxy forwarding headers first, then fallback to direct socket addresses
            ipAddress = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'Unknown';
        }

        await Log.create({
            user: userId || null, // Handles system operations seamlessly
            actionType,
            description,
            ipAddress,
            level: level.toUpperCase(),
            module: moduleName.toUpperCase()
        });
    } catch (err) {
        console.error('💥 Audit Logger Engine Error:', err.message);
    }
};