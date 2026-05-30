/**
 * Name: cloudinary.js
 * Purpose: Configures Cloudinary connection and Multer storage engine for file uploads.
 * Dependencies: cloudinary, multer-storage-cloudinary
 * Author: Ian
 * Location: server/config/cloudinary.js
 * Created: 2026-05-18
 * Last Updated: 2026-05-18
 */

const cloudinary = require('cloudinary').v2;
const CloudinaryStorage = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const storage = CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'hr_system_profiles', 
        allowed_formats: ['jpg', 'jpeg', 'png', 'jfif'],
        resource_type: 'image',
        transformation: [{ width: 300, height: 300, crop: 'limit' }] 
    }
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };