/**
 * Name: Announcement.js
 * Purpose: Defines the schema for announcement documents.
 * Dependencies: mongoose
 * Author: Ian
 * Location: server/models/Announcement.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-16
 */


const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Please add a title'],
            trim: true,
            maxlength: [100, 'Title cannot be more than 100 characters']
        },
        content: {
            type: String,
            required: [true, 'Please add the announcement content'],
            trim: true
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', 
            required: true
        }
    },
    {
        timestamps: true 
    }
);

module.exports = mongoose.model('Announcement', AnnouncementSchema);