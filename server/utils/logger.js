/**
 * Name: logger.js
 * Location: server/utils/logger.js
 */
const Log = require('../models/Log');

exports.createAuditLog = async (userId, actionType, description, req = null) => {
    try {
        let ipAddress = 'Unknown';
        if (req) {
            ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Unknown';
        }

        await Log.create({
            user: userId,
            actionType,
            description,
            ipAddress
        });
    } catch (err) {
        console.error('Audit Logger Error:', err.message);
    }
};