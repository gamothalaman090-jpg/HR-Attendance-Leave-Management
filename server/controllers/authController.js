/**
 * Name: authController.js
 * GOOGLE-ONLY AUTH:
 *   - Removed register() and login() — authentication is Google OAuth only
 *   - googleOAuth() returns isNewUser flag for unknown emails (no auto-create)
 *   - NEW: googleCompleteSignup() — profile completion with optional custom password
 *   - Default password: WelcomeNini123! (when no custom password provided)
 *   - Kept: forgotPassword, resetPassword, changePassword, logout, updateProfile, onboardUser
 */

const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { createAuditLog } = require('../utils/logger');

// ─────────────────────────────────────────────
// FIX: Create the transporter ONCE at module load.
// Previously it was recreated on every forgotPassword call — wasteful.
// ─────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '15m',
  });
};

// ─────────────────────────────────────────────────────────
// LOCAL REGISTER & LOGIN
// ─────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { fullname, email, password, company } = req.body;

    if (!fullname || !email || !password || !company) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (fullname, email, password, company)',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please sign in instead.',
      });
    }

    const user = await User.create({
      fullname,
      email,
      password,
      company,
      authProvider: 'local',
      role: 'admin',
      department: 'Unassigned',
      position: 'Staff Employee',
      employmentStatus: 'active',
      onboarded: false,
    });

    const token = generateToken(user._id);

    req.user = { company: user.company };
    await createAuditLog(
      user._id,
      'profile_update',
      `New admin registered via Email: ${user.fullname} (${user.email}) — company: ${user.company}`,
      req,
      'INFO',
      'AUTH'
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        company: user.company,
        department: user.department,
        position: user.position,
        profilePicture: user.profilePicture || '',
        onboarded: user.onboarded,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Find user and select password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Match password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.employmentStatus === 'pending') {
      return res.status(403).json({ success: false, message: 'Your account is pending admin approval' });
    }

    if (['suspended', 'terminated'].includes(user.employmentStatus)) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }

    const token = generateToken(user._id);

    req.user = { company: user.company };
    await createAuditLog(
      user._id,
      'auth_login',
      `User authenticated via Email: ${user._id}`,
      req,
      'INFO',
      'AUTH'
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        company: user.company,
        department: user.department,
        position: user.position,
        profilePicture: user.profilePicture || '',
        onboarded: user.onboarded,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// GOOGLE OAUTH  (Google-only auth — no email/password login)
// Returns isNewUser flag if email not found in DB.
// Existing users get logged in directly.
// ─────────────────────────────────────────────────────────
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const DEFAULT_PASSWORD = 'WelcomeNini123!';

exports.googleOAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Missing Google credential token',
      });
    }

    // Verify the Google ID token server-side
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid Google credential',
      });
    }

    const payload = ticket.getPayload();
    const { email, name, sub: providerId, picture: profilePicture, email_verified } = payload;

    // Only allow verified Google emails
    if (!email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Google email is not verified. Please verify your email with Google first.',
      });
    }

    let user = await User.findOne({ email });

    // ── New user — return profile info, don't create account yet ──
    if (!user) {
      return res.status(200).json({
        success: true,
        isNewUser: true,
        googleProfile: {
          email,
          name,
          picture: profilePicture || '',
        },
      });
    }

    // ── Existing user — link authProvider if was local ──
    if (user.authProvider === 'local') {
      user.authProvider = 'google';
      user.providerId = providerId;
      if (!user.profilePicture && profilePicture) user.profilePicture = profilePicture;
      await user.save();
    }

    if (user.employmentStatus === 'pending') {
      return res.status(403).json({ success: false, message: 'Your account is pending admin approval' });
    }

    if (['suspended', 'terminated'].includes(user.employmentStatus)) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated' });
    }

    const token = generateToken(user._id);

    req.user = { company: user.company };
    await createAuditLog(
      user._id,
      'auth_login',
      `User authenticated via Google OAuth: ${user._id}`,
      req,
      'INFO',
      'AUTH'
    );

    return res.status(200).json({
      success: true,
      isNewUser: false,
      message: 'OAuth login successful',
      token,
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        company: user.company,
        department: user.department,
        position: user.position,
        profilePicture: user.profilePicture || '',
        onboarded: user.onboarded,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// GOOGLE COMPLETE SIGNUP
// Called after googleOAuth returns isNewUser: true.
// Creates the admin account with optional custom password.
// ─────────────────────────────────────────────────────────
exports.googleCompleteSignup = async (req, res, next) => {
  try {
    const { credential, company, password } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Missing Google credential token',
      });
    }

    // Re-verify Google token (never trust client-cached profile)
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyError) {
      console.error('Google token verification failed:', verifyError.message);
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired Google credential. Please sign in with Google again.',
      });
    }

    const payload = ticket.getPayload();
    const { email, name, sub: providerId, picture: profilePicture, email_verified } = payload;

    if (!email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Google email is not verified.',
      });
    }

    // Prevent duplicate registration
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists. Please sign in instead.',
      });
    }

    // Company name
    let targetCompany = company?.trim();
    if (!targetCompany || targetCompany === 'Default Company') {
      targetCompany = name ? `${name.trim()}'s Org` : 'Default Company';
    }

    // Password: use custom if provided (min 8 chars), otherwise default
    let userPassword = DEFAULT_PASSWORD;
    if (password && password.trim().length > 0) {
      if (password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Password must be at least 8 characters',
        });
      }
      userPassword = password;
    }

    const user = await User.create({
      fullname: name,
      email,
      password: userPassword,
      authProvider: 'google',
      providerId,
      profilePicture: profilePicture || '',
      role: 'admin',
      company: targetCompany,
      department: 'Unassigned',
      position: 'Staff Employee',
      employmentStatus: 'active',
      onboarded: false,
    });

    const token = generateToken(user._id);

    req.user = { company: user.company };
    await createAuditLog(
      user._id,
      'profile_update',
      `New admin registered via Google OAuth: ${user.fullname} (${user.email}) — company: ${user.company}`,
      req,
      'INFO',
      'AUTH'
    );

    return res.status(201).json({
      success: true,
      isNewUser: false,
      message: 'Account created successfully',
      token,
      data: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        role: user.role,
        company: user.company,
        department: user.department,
        position: user.position,
        profilePicture: user.profilePicture || '',
        onboarded: user.onboarded,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// FORGOT PASSWORD
// ─────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });

    // ─────────────────────────────────────────────
    // SECURITY NOTE: Don't reveal whether the email exists.
    // Always return the same message regardless (prevents email enumeration).
    // ─────────────────────────────────────────────
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'If that email exists, a reset link has been sent.',
      });
    }

    // ─────────────────────────────────────────────
    // FIX: Previously used crypto.randomBytes() but NEVER saved the token
    // to the database — so it was impossible to verify it later.
    // Now uses User.getResetPasswordToken() which stores the hashed token.
    // ─────────────────────────────────────────────
    const rawToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
    const resetUrl = `${clientOrigin}/reset-password?token=${rawToken}`;

    try {
      await transporter.sendMail({
        from: `"HR System" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
        to: user.email,
        subject: 'Password Reset Request — Action Required',
        html: `
          <p>Hi ${user.fullname},</p>
          <p>You requested a password reset. Click the link below (expires in 15 minutes):</p>
          <a href="${resetUrl}" style="font-weight:bold">Reset My Password</a>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });
    } catch (emailError) {
      // Roll back the token if email failed
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      console.error('Email send failed:', emailError.message);
      return res.status(500).json({ success: false, message: 'Email could not be sent' });
    }

    await createAuditLog(user._id, 'profile_update',
      `Password reset link dispatched to: ${user.email}`, req, 'WARN', 'SECURITY');

    res.status(200).json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// RESET PASSWORD  ← NEW (was completely missing)
// Route: PUT /api/auth/reset-password
// Body: { token: string, newPassword: string }
// ─────────────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }

    // Hash the incoming raw token to compare with what's stored
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    }).select('+resetPasswordToken +resetPasswordExpire');

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    await createAuditLog(user._id, 'profile_update',
      `Password successfully reset for: ${user.email}`, req, 'WARN', 'SECURITY');

    res.status(200).json({ success: true, message: 'Password reset successful. Please log in.' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// LOGOUT
// ─────────────────────────────────────────────────────────
exports.logout = async (req, res, next) => {
  try {
    if (req.user?.id) {
      await createAuditLog(req.user.id, 'auth_login',
        'User session closed (Logged Out).', req, 'INFO', 'AUTH');
    }
    res.status(200).json({ success: true, message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// UPDATE PROFILE
// ─────────────────────────────────────────────────────────
exports.updateProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (req.body.fullname) user.fullname = req.body.fullname;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.department !== undefined && req.user.role === 'admin') {
      user.department = req.body.department;
    }

    if (req.body.email && req.body.email !== user.email) {
      const emailExists = await User.findOne({ email: req.body.email });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already in use' });
      }
      user.email = req.body.email;
    }

    if (req.file?.path) user.profilePicture = req.file.path;

    await user.save();

    await createAuditLog(req.user.id, 'profile_update',
      `${user.fullname} updated their profile${req.file ? ' (including avatar)' : ''}.`,
      req, 'INFO', 'AUTH');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id, fullname: user.fullname, email: user.email,
        phone: user.phone || '', profilePicture: user.profilePicture,
        role: user.role, company: user.company, department: user.department,
        position: user.position, onboarded: user.onboarded,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// CHANGE PASSWORD
// ─────────────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Please provide current and new passwords' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
    }

    const user = await User.findById(req.user.id).select('+password');

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses third-party login. Use the forgot password flow to set a password.',
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    await createAuditLog(req.user.id, 'profile_update',
      `${user.fullname} changed their password.`, req, 'WARN', 'SECURITY');

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────────────
// ONBOARD USER
// ─────────────────────────────────────────────────────────
exports.onboardUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.onboarded = true;
    await user.save();

    await createAuditLog(req.user.id, 'profile_update',
      'User completed onboarding flow.', req, 'INFO', 'AUTH');

    res.status(200).json({
      success: true,
      message: 'Onboarding completed',
      data: {
        id: user._id, fullname: user.fullname, email: user.email,
        role: user.role, company: user.company,
        profilePicture: user.profilePicture || '', onboarded: user.onboarded,
      },
    });
  } catch (error) {
    next(error);
  }
};
