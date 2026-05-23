/**
 * Notification Model
 * Purpose: Defines the schema for system notifications, which can be used for various alerting and messaging features within the HR management system.
 * Dependencies: None (Standalone Model)
 * Author: Ian
 * Location: server/models/Notification.js
 * Created: 2026-05-20
 * Last Updated: 2026-05-23
 */

const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
    type: { type: String, required: true },
    title: { type: String, required: true }, 
    message: { type: String, required: true },
    company: { type: String, required: true, default: 'Default Company' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', NotificationSchema);