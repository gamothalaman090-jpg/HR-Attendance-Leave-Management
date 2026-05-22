/**
 * Name: authController.js
 * Purpose: Handles user authentication logic, including registration, login, OAuth integrations, and password resets.
 * Dependencies: User Model, jsonwebtoken, nodemailer, crypto, Logger Utility
 * Author: Ian
 * Location: server/controllers/authController.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-22
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
        const { fullname, email, password, department, position } = req.body;
        
        if (!password) {
            return res.status(400).json({ success: false, message: 'Please add a password for traditional registration' });
        }
        
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }     
        
        // Creates the user record with input values or applies organizational fallbacks automatically
        const user = await User.create({
            fullname,
            email,
            password,
            role: 'user', // Hardcoded safety constraint to prevent privilege escalation during registration
            department: department || 'Unassigned',
            position: position || 'Staff Employee'
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
                role: user.role,
                department: user.department,
                position: user.position
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

exports.googleOAuth = async (req, res, next) => {
    try {
        const { email, fullname, providerId, profilePicture } = req.body;

        // 1. Basic validation guardrail checking incoming provider parameters
        if (!email || !providerId || !fullname) {
            return res.status(400).json({
                success: false,
                message: 'Incomplete OAuth data profile payload provided from login intercept.'
            });
        }

        // 2. Query against existing records inside database
        let user = await User.findOne({ email });
        let isNewRegistration = false;

        if (user) {
            // Scenario A: User profile exists but is currently configured as a password account.
            // Dynamically link provider coordinates on the fly to support future unified login options!
            if (user.authProvider === 'local') {
                user.authProvider = 'google';
                user.providerId = providerId;
                if (!user.profilePicture && profilePicture) {
                    user.profilePicture = profilePicture;
                }
                await user.save();
            }
        } else {
            // Scenario B: Brand new user registration via OAuth workflow interface
            isNewRegistration = true;
            user = await User.create({
                fullname,
                email,
                authProvider: 'google',
                providerId: providerId,
                profilePicture: profilePicture || '',
                role: 'user',
                department: 'Unassigned',
                position: 'Staff Employee'
                // password property stays completely undefined, skipping model salting hooks cleanly!
            });
        }

        // 3. Issue native platform server authentication bearer token
        const token = generateToken(user._id);

        // 4. Generate specific audit log entries matching state activity
        await createAuditLog(
            user._id,
            'profile_update',
            isNewRegistration 
                ? `New user registered and provisioned via Google OAuth: ${user.fullname} (${user.email})`
                : `User logged in using Google OAuth token validation. Account id: ${user._id}`,
            req
        );

        return res.status(isNewRegistration ? 201 : 200).json({
            success: true,
            message: isNewRegistration ? 'OAuth profile provisioned successfully' : 'OAuth login verification complete',
            token,
            data: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                department: user.department,
                position: user.position
            }
        });

    } catch (error) {
        console.error('Error handling Google OAuth pipeline callback execution:', error);
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
        
        if (!user.password) {
            return res.status(400).json({
                success: false,
                message: 'This account was created via third-party login. Please utilize password recovery links to assign traditional credential properties.'
            });
        }

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