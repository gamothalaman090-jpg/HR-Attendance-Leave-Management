const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters'],
    },
    content: {
        type: String,
        required: [true, 'Please add the announcement content'],
        trim: true,
    },
    category: {
        type: String,
        required: [true, 'Please provide a category'],
        enum: ['general', 'event', 'operations', 'urgent'],
        default: 'general',
        lowercase: true,
    },
    eventDate: { type: Date, default: null },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    company: {
        type: String,
        required: true,
        default: 'Default Company',
    },
}, {
    timestamps: true,
});

AnnouncementSchema.index({ company: 1, createdAt: -1 });
AnnouncementSchema.index({ author: 1, company: 1, createdAt: -1 });

module.exports = mongoose.model('Announcement', AnnouncementSchema);