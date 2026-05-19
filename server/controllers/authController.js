/**
 * Name: authController.js
 * Purpose: Handles user authentication logic, including registration, login, and password reset.
 * Dependencies: User Model, jsonwebtoken, nodemailer, crypto, Logger Utility
 * Author: Ian
 * Location: server/controllers/authController.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-18
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { createAuditLog } = require('../utils/logger');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

exports.register = async (req, res, next) => {
    try {
        const { fullname, email, password } = req.body;
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }     
        const user = await User.create({
            fullname,
            email,
            password,
            role: 'user' 
        });

        const token = generateToken(user._id);

        await createAuditLog(
            user._id,
            'profile_update',
            `New user registered account: ${user.fullname} (${user.email})`,
            req
        );

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            data: { 
                id: user._id, 
                fullname: user.fullname, 
                email: user.email, 
                role: user.role 
            }
        });
    } catch (error) {
        next(error);
    }
};

exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password' });
        }

        const user = await User.findOne({ email }).select('+password');

        if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);
        await createAuditLog(
            user._id,
            'profile_update',
            `User logged in successfully. Role: ${user.role.toUpperCase()}`,
            req
        );

        res.status(200).json({
            success: true,
            token,
            data: { id: user._id, fullname: user.fullname, role: user.role },
            message: 'Login successful'
        });
    } catch (error) {
        next(error);
    }
};

exports.forgotPassword = async (req, res, next) => {
    try {
        const user = await User.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `"HR System" <${process.env.EMAIL_USER}>`,
            to: user.email,
            subject: 'Password Reset Request',
            text: `You are receiving this email because you (or someone else) requested a password reset. \n\n Your reset token is: ${resetToken}`,
        };

        await transporter.sendMail(mailOptions);
        await createAuditLog(
            user._id,
            'profile_update',
            `Password reset token requested and dispatched via email to: ${user.email}`,
            req
        );

        res.status(200).json({ success: true, message: 'Email sent' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Email could not be sent' });
    }
};

exports.logout = async (req, res, next) => {
    try {
        if (req.user && req.user.id) {
            await createAuditLog(
                req.user.id,
                'profile_update',
                `User session closed (Logged Out).`,
                req
            );
        }

        res.status(200).json({ 
            success: true, 
            message: 'Logout successful' 
        });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (req.body.fullname) user.fullname = req.body.fullname;
        if (req.file && req.file.path) {
            user.profilePicture = req.file.path;
        }

        await user.save();


        await createAuditLog(
            req.user.id,
            'profile_update',
            `${user.fullname} updated their profile info${req.file ? ' including avatar picture' : ''}.`,
            req
        );

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                profilePicture: user.profilePicture,
                role: user.role
            }
        });
    } catch (error) {
        next(error);
    }
};


exports.changePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
        }


        const user = await User.findById(req.user.id).select('+password');

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password' });
        }
        user.password = newPassword;
        await user.save();
        await createAuditLog(
            req.user.id,
            'profile_update',
            `${user.fullname} changed their account security password.`,
            req
        );

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};