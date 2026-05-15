/**
 * Name: adminController.js
 * Purpose: Contains controller functions for admin-specific operations, such as managing announcements.
 * Dependencies: Announcement model 
 * Author: Ian
 * Location: server/controllers/adminController.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-16
 */

const Announcement = require('../models/Announcement');

exports.getAdminAnnouncements = async (req, res) => {
    try {
        const adminId = req.user.id; 

        
        const announcements = await Announcement.find({ author: adminId })
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: announcements.length,
            data: announcements
        });
    } catch (error) {
        console.error('Error fetching admin announcements:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching announcements'
        });
    }
};

exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content } = req.body;
        const adminId = req.user.id;

        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both a title and content'
            });
        }

        const newAnnouncement = await Announcement.create({
            title,
            content,
            author: adminId 
        });

        return res.status(201).json({
            success: true,
            message: 'Announcement created successfully',
            data: newAnnouncement
        });
    } catch (error) {
        console.error('Error creating announcement:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while creating announcement'
        });
    }
};

exports.deleteAnnouncement = async (req, res) => {
    try {
        const announcementId = req.params.id;
        const adminId = req.user.id;

        const announcement = await Announcement.findById(announcementId);

        if (!announcement) {
            return res.status(404).json({
                success: false,
                message: 'Announcement not found'
            });
        }

        
        if (announcement.author.toString() !== adminId) {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: You can only delete your own announcements'
            });
        }

        await announcement.deleteOne();

        return res.status(200).json({
            success: true,
            message: 'Announcement deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while deleting announcement'
        });
    }
};