/**
 * Name: authController.js
 * Purpose: Handles user authentication logic, including registration, login, OAuth integrations, and password resets.
 * Dependencies: User Model, jsonwebtoken, nodemailer, crypto, Logger Utility
 * Author: Ian
 * Location: server/controllers/authController.js
 * Created: 2026-05-15
 * Last Updated: 2026-05-23
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
        const { fullname, email, password, department, position, company, role } = req.body;
        
        if (!password) {
            return res.status(400).json({ success: false, message: 'Please add a password' });
        }
        
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }     
        
        const targetRole = role || 'user';
        let targetCompany = company;
        if (!targetCompany || targetCompany === 'Default Company') {
            if (targetRole === 'admin' && fullname) {
                targetCompany = `${fullname.trim()}'s Org`;
            } else {
                targetCompany = 'Default Company';
            }
        }

        if (targetRole === 'user') {
            const employeeCount = await User.countDocuments({
                role: 'user',
                employmentStatus: { $ne: 'terminated' },
                company: targetCompany
            });
            if (employeeCount >= 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Tier Limit Reached: This company has reached the maximum of 10 employees.'
                });
            }
        }
        
        const user = await User.create({
            fullname,
            email,
            password,
            role: targetRole, // Accept dynamic registration roles to cleanly provision admins and employees
            company: targetCompany,
            department: department || 'Unassigned',
            position: position || 'Staff Employee',
            employmentStatus: (targetRole === 'admin' || targetRole === 'superadmin') ? 'active' : 'pending',
            onboarded: targetRole === 'admin' ? false : true
        });

        const token = generateToken(user._id);

        // 📝 Telemetry Log: New registrations mapped to INFO level under AUTH module
        await createAuditLog(
            user._id,
            'profile_update',
            `New user registered account: ${user.fullname} (${user.email}) under company: ${user.company}`,
            req,
            'INFO',
            'AUTH'
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
                company: user.company,
                department: user.department,
                position: user.position,
                onboarded: user.onboarded
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
            // 📝 Optional/Future update: If you want to track malicious attempts, you could call createAuditLog here with 'WARN' / 'SECURITY'
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (user.employmentStatus === 'pending') {
            return res.status(403).json({ success: false, message: 'Your registration is pending admin approval' });
        }

        if (user.employmentStatus === 'suspended' || user.employmentStatus === 'terminated') {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
        }

        const token = generateToken(user._id);
        
        // 📝 Telemetry Log: Successful logins sent directly to AUTH stream
        await createAuditLog(
            user._id,
            'profile_update',
            `User logged in successfully. Role: ${user.role.toUpperCase()}`,
            req,
            'INFO',
            'AUTH'
        );

        res.status(200).json({
            success: true,
            token,
            data: { id: user._id, fullname: user.fullname, role: user.role, company: user.company, onboarded: user.onboarded },
            message: 'Login successful'
        });
    } catch (error) {
        next(error);
    }
};

exports.googleOAuth = async (req, res, next) => {
    try {
        const { email, fullname, providerId, profilePicture } = req.body;

        if (!email || !providerId || !fullname) {
            return res.status(400).json({
                success: false,
                message: 'Incomplete OAuth data profile payload provided from login intercept.'
            });
        }

        let user = await User.findOne({ email });
        let isNewRegistration = false;

        if (user) {
            if (user.authProvider === 'local') {
                user.authProvider = 'google';
                user.providerId = providerId;
                if (!user.profilePicture && profilePicture) {
                    user.profilePicture = profilePicture;
                }
                await user.save();
            }
        } else {
            const targetCompany = req.body.company || 'Default Company';
            const employeeCount = await User.countDocuments({
                role: 'user',
                employmentStatus: { $ne: 'terminated' },
                company: targetCompany
            });
            if (employeeCount >= 10) {
                return res.status(400).json({
                    success: false,
                    message: 'Tier Limit Reached: This company has reached the maximum of 10 employees.'
                });
            }

            isNewRegistration = true;
            user = await User.create({
                fullname,
                email,
                authProvider: 'google',
                providerId: providerId,
                profilePicture: profilePicture || '',
                role: 'user',
                company: targetCompany,
                department: 'Unassigned',
                position: 'Staff Employee',
                employmentStatus: 'pending',
                onboarded: true
            });
        }

        if (user.employmentStatus === 'pending') {
            return res.status(403).json({ success: false, message: 'Your registration is pending admin approval' });
        }

        if (user.employmentStatus === 'suspended' || user.employmentStatus === 'terminated') {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
        }

        const token = generateToken(user._id);

        // 📝 Telemetry Log: Routes OAuth registrations or authorizations into the AUTH engine module cleanly
        await createAuditLog(
            user._id,
            'profile_update',
            isNewRegistration 
                ? `New user registered and provisioned via Google OAuth: ${user.fullname} (${user.email}) under company: ${user.company}`
                : `User logged in using Google OAuth token validation. Account id: ${user._id}`,
            req,
            'INFO',
            'AUTH'
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
                company: user.company,
                department: user.department,
                position: user.position,
                onboarded: user.onboarded
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

        // 📝 Telemetry Log: Escallated to WARN under SECURITY tracking because password resets change security parameters
        await createAuditLog(
            user._id,
            'profile_update',
            `Password reset token requested and dispatched via email to: ${user.email}`,
            req,
            'WARN',
            'SECURITY'
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
            // 📝 Telemetry Log: Basic session close tagged under AUTH module
            await createAuditLog(
                req.user.id,
                'profile_update',
                `User session closed (Logged Out).`,
                req,
                'INFO',
                'AUTH'
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

        // 📝 Telemetry Log: Personal account data change recorded cleanly
        await createAuditLog(
            req.user.id,
            'profile_update',
            `${user.fullname} updated their profile info${req.file ? ' including avatar picture' : ''}.`,
            req,
            'INFO',
            'AUTH'
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

        // 📝 Telemetry Log: Password alterations recorded under WARN level in SECURITY stream
        await createAuditLog(
            req.user.id,
            'profile_update',
            `${user.fullname} changed their account security password.`,
            req,
            'WARN',
            'SECURITY'
        );

        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
};

exports.onboardUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        user.onboarded = true;
        await user.save();
        
        await createAuditLog(
            req.user.id,
            'profile_update',
            `User completed onboarding flow successfully.`,
            req,
            'INFO',
            'AUTH'
        );
        
        res.status(200).json({
            success: true,
            message: 'Onboarding completed successfully',
            data: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                company: user.company,
                onboarded: user.onboarded
            }
        });
    } catch (error) {
        next(error);
    }
};